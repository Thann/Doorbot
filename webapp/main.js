// Portalbot - loads the libraries and exports the global variable "Portalbot".

require('backbone-subviews'); // also makes "Backbone" globally available.
require('./jquery_extensions');
// include dependancies + css
require('bootstrap');
require('bootstrap/scss/bootstrap.scss');
const { library, dom } = require('@fortawesome/fontawesome-svg-core');
const { fas } = require('@fortawesome/free-solid-svg-icons');
const { far } = require('@fortawesome/free-regular-svg-icons');
const { fab } = require('@fortawesome/free-brands-svg-icons');
library.add(fas, far, fab);
dom.watch();

// Load all views in an extensible way.
// "views/sample_view.js" becomes "views.SampleView".
const views = loadModule(require.context('./views', true, /\.js$/));

// Make PUBLIC modules accessible.
module.exports = {

	Views: views,
	AppConfig: require('./config.json'),

	// Run this after extensions have been loaded.
	init: function() {
		const self = this;
		Backbone.$(document).ready(function() {
			self.Layout = new self.Views.Layout();
		});
	},
};

// Load all files from a "context" into a single object.
function loadModule(context) {
	// Helper to turn "snake_case" filenames into module names.
	// "./sample_view.js" becomes "SampleView".
	function modularize(str) {
		return str.replace(/(^(\.\/)?\w|_[a-z])/g, function(s) {
			return s.slice(-1).toUpperCase();
		}).replace(/\.js$/, '');
	}

	return _.reduce(context.keys(), function(module, filename) {
		return (module[modularize(filename)] = context(filename)) && module;
	}, {});
}
