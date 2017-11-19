'use strict';

module.exports = {
	AuthError: function() {
		this.code = 401;
	},
	UserError: function(message, code) {
		this.code = code || 400;
		this.message = message;
	},
	HandledError: function() {},
};
