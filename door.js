#!/usr/bin/env node
'use strict';

const WebSocket = require('ws');

var options = {
	server: "localhost",
	port: "3000",
	door: "1",
};

var getopts = require("node-getopt").create([
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

const ws = new WebSocket(
	'ws'+(options.insecure?'':'s')+'://'+options.server+':'+options.port+'/doors/'+options.door+'/connect', {
	perMessageDeflate: false,
	headers: {
		'Authorization': options.token
	}
});

ws.on('open', function open() {
	ws.send('something');
});

ws.on('close', function close(code, reason) {
	console.log("CLOSE:", code, reason)
	if (code == 1007) process.exit(0);
});

ws.on('message', function incoming(data) {
	console.log("WS:", data);
});

setInterval(function() {
	//TODO: retry connection
	ws.send("hey!");
}, 5000);