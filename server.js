#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const errors = require('./lib/errors');

const options = {
	port: 3000,
};

if (require.main === module) {
	// If ran directly, parse arguments
	const getopts = require('node-getopt').create([
		['p', 'port=', 'Set listen port'],
		['',  'build', 'Compile webapp'],
		['',  'dev',   'Compile webapp & restart server on file modification (bigger bundles)'],
		['h', 'help'],
	]).bindHelp(
		'Doorbot: server w/ webui to manage users and doors.\n' +
		'Usage: node server [OPTION]\n' +
		'\n' +
		'[[OPTIONS]]\n' +
		'\n' +
		'Repository: https://github.com/Thann/Doorbot'
	).error((err) => {
		console.error(err.message + '\n\n' + getopts.getHelp());
		process.exit(1);
	});

	const opt = getopts.parseSystem();
	if (opt.argv.length > 0) {
		console.error('ERROR: Unexpected argument(s): ' + opt.argv.join(', '));
		console.error('\n' + getopts.getHelp());
		process.exit(1);
	}

	// Merge opts into options
	Object.assign(options, opt.options);
} else {
	// Override port when required by tests
	options.port = 6969;
}

if (options.dev) {
	// Fork server
	require('nodemon')({
		script: 'server.js',
		watch: ['api','lib'],
		args: ['--port', options.port.toString()],
		ext: 'js',
	}).on('crash', () => {
		process.exit(1);
	}).on('quit', process.exit);
} else {
	// Init server
	const app = express();

	// Load middleware
	require('express-ws')(app);
	app.use(require('body-parser').json());

	// Load all controllers from the api directory.
	const apiRouter = express.Router();
	const controllers = path.join(__dirname, 'api');
	app.use('/api/v1', apiRouter);
	fs.readdirSync(controllers).forEach(function(file) {
		if (file.endsWith('.js'))
			require(path.join(controllers, file))(apiRouter);
	});

	// Serve static files
	app.use(express.static('dist', {setHeaders: function(res, path) {
		if (path.endsWith('/bundle.js.gz')) {
			res.setHeader('Content-Encoding', 'gzip');
			res.setHeader('Content-Type', 'application/javascript');
		}
	}}));

	// Serve index.html at all other routes
	// app.get('*', function (req, res) {
	// 	res.sendFile(path.join(__dirname, '/dist/index.html'));
	// });

	// Handle errors
	app.use(function errorHandler(err, request, response, next) {
		console.error('ERROR:', err);
		next(err);
	});

	process.on('unhandledRejection', function(err, promise) {
		if (!(err instanceof errors.HandledError))
			console.error('UHR', err, promise);
	});

	// Start server
	module.exports = app.listen(options.port, function() {
		if (require.main === module)
			console.log('listening on', options.port);
	});
}

// Webpack watch
if (options.build || options.dev) {
	const opts = ['--color'];
	if (options.dev) opts.push('--watch', '--env.dev');
	const watcher = require('child_process')
		.spawn('node_modules/.bin/webpack', opts);

	watcher.stdout.on('data', function(data) {
		console.log(data.toString());
	});

	watcher.stderr.on('data', function(data) {
		console.log(data.toString());
	});
}
