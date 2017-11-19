'use strict';

module.exports = {
	// An object with values that can expire.
	MemCache: function() {
		const cache = {};
		const timers = {};
		this.get = function(key) {
			return cache[key];
		};
		this.set = function(key, value, expires) {
			cache[key] = value;
			if (expires) {
				if (timers[key])
					clearTimeout(timers[key]);
				timers[key] = setTimeout(function() {
					cache[key] = null;
				}, expires);
			}
		};
	},
};
