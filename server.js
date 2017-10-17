#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');
var express = require('express');
// var https = require('https');
var qs = require('querystring');
var app = express();

var options = {
	port: 3000,
};

var getopts = require("node-getopt").create([
	['p', 'port=', 'Set listen port'],
	['',  'watch', 'Recompile webapp on file modification'],
	['',  'build', 'Compile webapp'],
	['h', 'help']
]).bindHelp().setHelp(
	"Doorbot: server w/ webui to manage users and doors.\n" +
	"Usage: node server [OPTION]\n" +
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

// Merge opts into options
Object.assign(options, opt.options);

// Load middleware
app.use(require('body-parser').json());

// Serve static files
app.use(express.static('dist'));

// Load all controllers from the api directory.
var controllers = path.join(__dirname, 'api');
fs.readdirSync(controllers).forEach(function(file) {
	require(path.join(controllers, file))(app);
});

//TODO: handle errors
app.use(function errorHandler(err, request, response, next) {
	console.log("XXX",err);
	next(err);
});

app.listen(options.port, function() {
	console.log("listening on", options.port);
});

// Handle errors
var error = require('./lib/errors');
process.on('unhandledRejection', function(err, promise) {
	if (!(err instanceof error.HandledError))
		console.error("UHR", err, promise);
});

// --Watch
if (options.watch || options.build) {
	var watcher = require('child_process').spawn(
		'node_modules/.bin/webpack', ['--color', options.watch?'--watch':null]);

	watcher.stdout.on('data', function(data) {
		console.log(data.toString());
	});

	watcher.stderr.on('data', function(data) {
		console.log(data.toString());
	});
}
