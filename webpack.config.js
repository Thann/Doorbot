'use strict';

const webpack = require('webpack');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = function(env) {
	const config = {
		context: __dirname,
		entry: 'app/main.js',
		output: {
			path: __dirname + '/dist',
			libraryTarget: 'var',
			library: 'Doorbot',
			filename: 'bundle.js',
		},
		resolve: { alias: {
			app: __dirname + '/webapp',
			models: 'app/models',
			styles: 'app/styles',
		} },
		plugins: [
			new webpack.ProvidePlugin({
				// These become available to all files.
				_: 'underscore',
				Rivets: 'rivets',
			}),
			new webpack.optimize.UglifyJsPlugin({
				minimize: true,
				sourceMap: true,
				compress: {warnings: false},
			}),
			new CompressionPlugin({
				test: /\.js$/,
				algorithm: 'gzip',
				asset: '[path].gz[query]',
			}),
		],
		module: {
			loaders: [
				{ test:  /\.json$/, use: 'hson-loader' },
				{ test:  /\.s?css$/,
					use: [
						{ loader: 'style-loader' },
						{ loader: 'css-loader', options: {sourceMap: true} },
						{ loader: 'sass-loader' },
					],
				},
				{ // ES6 support.
					test:  /\.js$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
						options: { presets: ['es2015'] },
					},
				},
			],
		},
		devtool: 'source-map',
	};

	if (env && env.lint) {
		config.module.loaders.push({
			test: /\.js$/,
			use: ['eslint-loader'],
			exclude: /node_modules/,
			enforce: 'pre',
		});
	}

	return config;
};

