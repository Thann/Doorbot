// Doorbot - loads the libraries and exports the global variable "Doorbot".

require('backbone-subviews'); // also makes "Backbone" globally available.
require('./rivets_extensions');
require('rivets-backbone-adapter');
// require('imports-loader?jQuery=jquery!bootstrap/dist/js/bootstrap.js');

// Load all views in an extensible way.
// "views/sample_view.js" becomes "views.SampleView".
var views = load_module(require.context('app/views', true, /\.js$/));

// Make PUBLIC modules accessible.
module.exports = {

	Views: views,
	AppConfig: require('app/config.json'),

	// Run this after extensions have been loaded.
	init: function() {
		var self = this;
		$(document).ready(function() {
			self.Layout = new self.Views.Layout();
		});
	}
};

// Load all files from a "context" into a single object.
function load_module(context) {
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
