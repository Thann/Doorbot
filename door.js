#!/usr/bin/env node
'use strict';

const util = require('util');
const WebSocket = require('ws');
const gpio = require('rpi-gpio');

var options = {
	server: "localhost",
	port: "3000",
	door: "1",
	gpio: "10",
	locktime: 5000,
	pingtime: 5000,
};

var getopts = require("node-getopt").create([
	['x', 'dummy',   'Don\'t use GPIO, print instead'],
	['g', 'gpio=',   'GPIO pins to open the door'],
	['d', 'door=',   'Connect to server with door_id'],
	['t', 'token=',  'Connect to server with token (required)'],
	['s', 'server=', 'Connect to server at address'],
	['p', 'port=',   'Connect to server on port'],
	['k', 'insecure','Don\'t validate SSL'],
	['h', 'help',    '']
]).bindHelp().setHelp(
	"Doorbot: connects to a server and registers a door to open.\n" +
	"Usage: node door [OPTION]\n" +
	"\n" +
	"[[OPTIONS]]\n" +
	"\n" +
	"Repository: https://github.com/Thann/Doorbot"
);
var opt = getopts.parseSystem();

if (opt.argv.length > 0) {
	console.error("ERROR: Unexpected argument(s): " + opt.argv.join(', '));
	console.error(getopts.getHelp());
	process.exit(1);
}

if (!opt.options.token) {
	console.error("ERROR: token is required");
	process.exit(0);
}

// Merge opts into options
Object.assign(options, opt.options);

// Handle errors
process.on('unhandledRejection', function(err, promise) {
	if (!(err instanceof error.HandledError))
		console.error("UHR", err, promise);
});

var lock = false;
if (!options.dummy) gpio.setup(parseInt(options.gpio));
function open() {
	if (options.dummy) return console.log("Dummy Open");
	if (lock) return console.warn('ERROR: locked');
	lock = true;
	gpio.write(options.gpio, true);
	setTimeout(function() {
		gpio.write(options.gpio, false);
		lock = false;
	}, options.locktime);
}

var ws;
function connect() {
	ws = new WebSocket(
		util.format('ws%s://%s:%s/doors/%s/connect',
			options.insecure?'':'s',
			options.server,
			options.port,
			options.door), {
		perMessageDeflate: false,
		headers: {
			'Authorization': options.token
		},
	});

	ws.on('error', function(e) {
		console.log("Connection Error:", e.code)
	});

	ws.on('open', function() {
		console.log("success")
	});

	ws.on('close', function(code, reason) {
		console.log("CLOSE:", code, reason)
		if (code == 1007) safeExit();
	});

	ws.on('message', function(data) {
		console.log("WS:", data);
		open();
	});
}

function safeExit() {
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
	if (ws.readyState != 1) {
		console.log("Retrying connection");
		connect();
	} else {
		ws.ping();
	}
}, options.pingtime);
connect();
