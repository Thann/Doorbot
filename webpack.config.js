'use strict';

const webpack = require('webpack');

module.exports = {
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
	],
	module: {
		loaders: [
			{ test:  /\.json$/, loader: 'hson' },
			{ test:  /\.s?css$/, loaders: ['style', 'css?sourceMap', 'sass'] },
			{ // ES6 support.
				test:  /\.js$/,
				loader: 'babel',
				exclude: /node_modules/,
				query: { presets: ['es2015'] },
			},
		],
		preLoaders: [],
	},
	devtool: 'source-map',
};

if (process.argv.indexOf('--minify') >= 0) {
	const CompressionPlugin = require('compression-webpack-plugin');

	module.exports.plugins.push(
		new webpack.optimize.UglifyJsPlugin({
			minimize: true,
			compress: {warnings: false},
		})
	);

	module.exports.plugins.push(
		new CompressionPlugin({
			test: /\.js$/,
			algorithm: 'gzip',
			asset: '[path].gz[query]',
		})
	);
}

if (process.argv.indexOf('--lint') >= 0) {
	module.exports.module.preLoaders.push({
		test: /\.js$/,
		loader: 'eslint-loader',
		exclude: /node_modules/,
	});
}
