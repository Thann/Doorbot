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
		['',  'dev',   'Compile webapp & restart server on file modification'],
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
	if (require('nodemon')(null, {ignored: /.*\/(dist|node_modules)\/.*/}))
		return;
} else {
	// Init server
	console.log(' ==== Starting server ====');
	const app = express();
	module.exports = app;
	app.plugins = {};

	// Load middleware
	require('express-ws')(app);
	app.use(require('body-parser').json());

	// Load all controllers from the api directory.
	const apiRouter = express.Router();
	app.loadControllers = function(location, version='v1') {
		console.debug(` == Loading controllers from: ${location}`);
		app.use(`/api/${version}`, apiRouter);
		const controllers = path.join(__dirname, location);
		fs.readdirSync(controllers).forEach(function(file) {
			if (file.endsWith('.js')) {
				console.debug(`    --> ${file}`);
				require(path.join(controllers, file)).call(app, apiRouter);
			}
		});
	};
	app.loadControllers('api');

	// Serve static files
	const exStatic = express.static(path.join(__dirname, 'dist'));
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

	// load all plugins
	app.loadPlugins = function loadPlugins(location) {
		const folder = path.join(__dirname, location);
		console.debug(` == Loading plugins from: ${location}`);
		fs.readdirSync(folder).forEach(function(file) {
			if (file.endsWith('.js')) {
				const name = file.substr(0, file.length-3); // Trim '.js'
				console.debug(`    --> ${name}`);
				app.plugins[name] = require(path.join(folder, file));
			}
		});
	};
	app.loadPlugins('plugins');

	// Start server
	if (require.main === module) {
		app.listen(options.port, function() {
			console.log(' == Listening on', options.port);
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

	console.debug(' == Starting webpack');
	if (options.build)
		wp(wpCfg()).run(cb);
	else {
		wp(wpCfg({
			dev: options.dev,
			demo: options.demo,
		})).watch(undefined, cb);
	}
}
