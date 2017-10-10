#!/usr/bin/env node
'use strict';

const WebSocket = require('ws');
const gpio = require('rpi-gpio');

var options = {
	server: "localhost",
	port: "3000",
	door: "1",
	gpio: "8",
	locktime: 5000,
};

var getopts = require("node-getopt").create([
	['x', 'dummy',   'Don\'t use GPIO, print instead'],
	['g', 'gpio=',   'GPIO pins to open the door'],
	['d', 'door=',   'Connect to server with door_id'],
	['t', 'token=',  'Connect to server with token'],
	['s', 'server=', 'Connect to server at address'],
	['p', 'port=',   'Connect to server on port'],
	['k', 'insecure','Don\'t validate SSL'],
	['h', 'help',    '']
]).bindHelp();
var opt = getopts.parseSystem();

if (opt.argv.length > 0) {
	console.error("ERROR: Unexpected argument(s): " + opt.argv.join(', '));
	console.error(getopts.getHelp());
	process.exit(1);
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

const ws = new WebSocket(
	'ws'+(options.insecure?'':'s')+'://'+options.server+':'+options.port+'/doors/'+options.door+'/connect', {
	perMessageDeflate: false,
	headers: {
		'Authorization': options.token
	}
});

// ws.on('open', function() {
// 	ws.send('something');
// });

ws.on('close', function(code, reason) {
	console.log("CLOSE:", code, reason)
	if (code == 1007) safeExit();
});

ws.on('message', function incoming(data) {
	console.log("WS:", data);
	open();
});

function safeExit() {
	if (!options.dummy) {
		gpio.write(options.gpio, false, function() {
			process.exit(0);
		});
	}
}

// Lock the door on quit
process.on('SIGINT', safeExit);
process.on('SIGTERM', safeExit);

setInterval(function() {
	//TODO: retry connection
	ws.send("hey!");
}, 5000);