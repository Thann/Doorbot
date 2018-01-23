#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const errors = require('./lib/errors');
const app = express();

const options = {
	port: 3000,
};

if (require.main !== module) {
	// Override port when required by tests
	options.port = 6969;
} else {
	const getopts = require('node-getopt').create([
		['p', 'port=', 'Set listen port'],
		['',  'watch', 'Recompile webapp on file modification'],
		['',  'build', 'Compile webapp'],
		['',  'dev',   'Watch and lint quickly with bigger bundles'],
		['h', 'help'],
	]).bindHelp().setHelp(
		'Doorbot: server w/ webui to manage users and doors.\n' +
		'Usage: node server [OPTION]\n' +
		'\n' +
		'[[OPTIONS]]\n' +
		'\n' +
		'Repository: https://github.com/Thann/Doorbot'
	);

	const opt = getopts.parseSystem();
	if (opt.argv.length > 0) {
		console.error('ERROR: Unexpected argument(s): ' + opt.argv.join(', '));
		console.error(getopts.getHelp());
		process.exit(1);
	}

	// Merge opts into options
	Object.assign(options, opt.options);
}

// Load middleware
app.use(require('body-parser').json());

// Serve static files
app.use(express.static('dist', {setHeaders: function(res, path) {
	if (path.endsWith('/bundle.js.gz'))
		res.setHeader('Content-Encoding', 'gzip');
}}));

// Load all controllers from the api directory.
const controllers = path.join(__dirname, 'api');
fs.readdirSync(controllers).forEach(function(file) {
	require(path.join(controllers, file))(app);
});

// Handle errors
app.use(function errorHandler(err, request, response, next) {
	console.error('ERROR:', err);
	next(err);
});

process.on('unhandledRejection', function(err, promise) {
	if (!(err instanceof errors.HandledError))
		console.error('UHR', err, promise);
});

module.exports = app.listen(options.port, function() {
	if (require.main === module)
		console.log('listening on', options.port);
});

// --Watch
if (options.watch || options.build || options.dev) {
	const opts = ['--color'];
	if (options.dev) opts.push('--env.dev');
	if (options.watch || options.dev) opts.push('--watch');
	const watcher = require('child_process')
		.spawn('node_modules/.bin/webpack', opts);

	watcher.stdout.on('data', function(data) {
		console.log(data.toString());
	});

	watcher.stderr.on('data', function(data) {
		console.log(data.toString());
	});
}
