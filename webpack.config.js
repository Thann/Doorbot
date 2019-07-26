'use strict';

const webpack = require('webpack');
const CompressionPlugin = require('compression-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = function(env) {
	const config = {
		context: __dirname,
		mode: env && (env.dev || env.demo)? 'development': 'production',
		entry: {
			app: './webapp/main.js',
		},
		output: {
			path: __dirname + '/dist',
			libraryTarget: 'var',
			library: 'App',
			filename: '[name].[contenthash].bundle.js',
		},
		plugins: [
			new HtmlWebpackPlugin({
				inject: 'head',
				template: './webapp/index.html',
			}),
			new webpack.ProvidePlugin({
				// These become available to all files.
				_: 'underscore',
			}),
			new CompressionPlugin({
				test: /\.js$/,
				algorithm: 'gzip',
				asset: '[path].gz[query]',
			}),
			new CleanWebpackPlugin({
				cleanOnceBeforeBuildPatterns: ['*.bundle.*'],
			}),
		],
		module: {
			rules: [
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
						//options: { presets: ['es2015'] },
					},
				},
			],
		},
		devtool: 'source-map',
		performance: {
			maxAssetSize: 200 * 10000,
			maxEntrypointSize: 200 * 10000,
		},
		optimization: {
			minimize: true,
			splitChunks: {
				chunks: 'all',
				cacheGroups: {
					vendor: {
						// minSize: 0,
						// maxSize: 244,
						name: 'vendor',
						test: /[\\/]node_modules[\\/]/,
						reuseExistingChunk: true,
					},
					default: false,
				},
			},
		},
	};

	if (env && env.dev) {
		config.module.rules.push({
			test: /\.js$/,
			use: ['eslint-loader'],
			exclude: /node_modules/,
			enforce: 'pre',
		});
	}
	if (env && env.demo) config.entry.app = './webapp/demo.js';

	return config;
};
