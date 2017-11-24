#!/usr/bin/env node
'use strict';

const util = require('util');
const WebSocket = require('ws');
const gpio = require('rpi-gpio');
const express = require('express');
const errors = require('./lib/errors');

const options = {
	server: 'localhost',
	port: '3000',
	door: '1',
	gpio: '10',
	locktime: 5000,
	pingtime: 5000,
};

const getopts = require('node-getopt').create([
	['x', 'dummy',     "Don't use GPIO, print instead"],
	['g', 'gpio=',     'GPIO pins to open the door'],
	['d', 'door=',     'Connect to server with door_id'],
	['t', 'token=',    'Connect to server with token (required)'],
	['s', 'server=',   'Connect to server at address'],
	['p', 'port=',     'Connect to server on port'],
	['',  'keypad[=]', 'Enable Wiegand keypad on GPIO pins (default 11,12)'],
	['',  'insecure',  "Don't validate SSL"],
	['h', 'help',    ''],
]).bindHelp().setHelp(
	'Doorbot: connects to a server and registers a door to open.\n' +
	'Usage: node door [OPTIONS]\n\n' +
	'[[OPTIONS]]\n\n' +
	'Repository: https://github.com/Thann/Doorbot'
);
const opt = getopts.parseSystem();

if (opt.argv.length > 0) {
	console.error('ERROR: Unexpected argument(s): ' + opt.argv.join(', '));
	console.error(getopts.getHelp());
	process.exit(1);
}

if (!opt.options.token) {
	console.error('ERROR: token is required');
	console.error(getopts.getHelp());
	process.exit(1);
}

// Merge opts into options
Object.assign(options, opt.options);

// Handle errors
process.on('unhandledRejection', function(err, promise) {
	if (!(err instanceof errors.HandledError))
		console.error('UHR', err, promise);
});

let lock = false;
if (!options.dummy)
	gpio.setup(parseInt(options.gpio));

function open() {
	if (options.dummy)
		return console.log('Dummy Open');
	if (lock)
		return console.warn('ERROR: already open');
	lock = true;
	gpio.write(options.gpio, true);
	setTimeout(function() {
		gpio.write(options.gpio, false);
		lock = false;
	}, options.locktime);
}

let ws;
let pongTimeout;
function connect() {
	if (ws) ws.terminate();
	ws = new WebSocket(
		util.format('ws%s://%s:%s/api/v1/doors/%s/connect',
			options.insecure?'':'s',
			options.server,
			options.port,
			options.door
		), {
			headers: {
				'Authorization': options.token,
			},
			perMessageDeflate: false,
			handshakeTimeout: options.pingtime,
		}
	);

	ws.on('error', function(e) {
		console.log('Connection Error:', e.code);
	});

	ws.on('open', function() {
		console.log('success');
	});

	ws.on('close', function(code, reason) {
		console.log('CLOSE:', code, reason);
		if (code === 1007)
			safeExit();
	});

	ws.on('message', function(data) {
		console.log('WS:', data);
		open();
	});

	ws.on('pong', function() {
		clearTimeout(pongTimeout);
	});
}

// Wiegand keypad init
if (options.keypad !== undefined && !options.dummy) {
	let waiting, index = 0;
	const maxCodeLen = 8; // must be even
	const keypadTimeout = 5; // seconds
	const keycode = Buffer.alloc(maxCodeLen/2);
	const pin = (options.keypad || '11,12').split(',').map(Number);

	gpio.setup(pin[0], gpio.DIR_IN, gpio.EDGE_FALLING);
	gpio.setup(pin[1], gpio.DIR_IN, gpio.EDGE_FALLING);

	// TODO: unlocking the door interferes with this...
	gpio.on('change', function(num, dir) {
		const i = parseInt(index/8);
		clearTimeout(waiting);
		if (num === pin[1]) {
			keycode[i] = keycode[i] | (1 << 7-index%8);
		}
		if (index >= maxCodeLen*4-1) {  //TODO: pound sign?
			ws.send('keycode:'+keycode.toString('hex'));
			index = 0;
			keycode.fill(0);
		} else {
			waiting = setTimeout(function() {
				index = 0;
				keycode.fill(0);
			}, keypadTimeout*1000);
			index += 1;
		}
	});
} else if (options.keypad !== undefined) {
	setInterval(() => {
		if (ws.readyState === 1) {
			console.log('Sending dummy keycode to server...');
			ws.send('keycode:00000000');
		}
	}, 10000);
}

function safeExit() {
	console.log('shutting down..');
	if (!options.dummy) {
		gpio.write(options.gpio, false, function() {
			process.exit(0);
		});
	} else {
		process.exit(0);
	}
}

// Lock the door on quit
process.on('SIGINT', safeExit);
process.on('SIGTERM', safeExit);

setInterval(function() {
	if (ws.readyState !== WebSocket.OPEN) {
		console.log(`Retrying connection (${ws.readyState})`);
		connect();
	} else {
		// listen for pong, close if we dont hear back
		pongTimeout = setTimeout(function() {
			ws.close();
		}, options.pingtime/2);
		ws.ping();
	}
}, options.pingtime);
connect();

// Start Healthcheck server
const hcPort = 3000;
const router = express.Router();
require('./api/health')(router);
require('http')
	.createServer(express().use('/api/v1', router))
	.on('error', () => {
		console.error(`Healthcheck failed to listen on port ${hcPort}`);
	})
	.listen(hcPort, () => {
		console.log(`Healthcheck listening on port ${hcPort}`);
	});
