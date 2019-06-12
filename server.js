#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');

const options = {
	port: 3000,
};

if (require.main === module) {
	// If ran directly, parse arguments
	const getopts = require('node-getopt').create([
		['p', 'port=', 'Set listen port'],
		['',  'build', 'Compile webapp'],
		['',  'dev',   'Compile webapp & restart server on file modification (bigger bundles)'],
		['',  'demo',  'Run in demo mode with mocked api responses'],
		['h', 'help'],
	]).bindHelp(
		'Doorbot: server w/ webui to manage users and doors.\n' +
		'Usage: node server [OPTION]\n\n' +
		'[[OPTIONS]]\n\n' +
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
	module.exports = app;

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
	const exStatic = express.static('dist');
	app.use(function(req, res, next) {
		if (req.url.endsWith('.bundle.js')) {
			req.url += '.gz';
			res.setHeader('Content-Encoding', 'gzip');
			res.setHeader('Content-Type', 'application/javascript');
		}
		exStatic(req, res, next);
	});

	// Serve index.html at all other routes
	// app.get('*', function (req, res) {
	// 	res.sendFile(path.join(__dirname, '/dist/index.html'));
	// });

	// Handle errors
	app.use(function errorHandler(err, request, response, next) {
		console.error('ERROR:', err);
		next(err);
	});

	// Handle async errors
	if (process.listenerCount('unhandledRejection') === 0) {
		process.on('unhandledRejection', function(err, p) {
			if (!(err instanceof require('./lib/errors').HandledError)) {
				console.error('UHR', err, p);
			}
		});
	}

	// Start server
	if (require.main === module) {
		app.listen(options.port, function() {
			console.log('listening on', options.port);
		});
	}
}

// Webpack watch
if (options.build || options.dev || options.demo) {
	const wp = require('webpack');
	const wpCfg = require('./webpack.config');
	const cb = (err, stats) => {
		if (err)
			console.error(err);
		else
			console.log(stats.toString({colors: true}));
	};

	if (options.build)
		wp(wpCfg()).run(cb);
	else {
		wp(wpCfg({
			dev: options.dev,
			demo: options.demo,
		})).watch(undefined, cb);
	}
}
