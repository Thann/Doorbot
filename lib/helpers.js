'use strict';

// An object with values that can expire.
class MemCache {
	constructor() {
		this.cache = {};
		this.timers = {};
	}
	get(key) {
		return this.cache[key];
	}
	set(key, value, expires) {
		this.cache[key] = value;
		if (expires) {
			if (this.timers[key])
				clearTimeout(this.timers[key]);
			this.timers[key] = setTimeout(function() {
				this.cache[key] = undefined;
				this.timers[key] = undefined;
			}, expires);
		}
	}
	del (key) {
		if (this.cache[key] !== undefined) {
			this.cache[key] = undefined;
			if (this.timers[key]) {
				clearTimeout(this.timers[key]);
				this.timers[key] = undefined;
			}
		}
	}
	map(fn) {
		return Object.entries(this.cache).reduce(function(arr, [k, v]) {
			if (v !== undefined)
				arr.push(fn(k, v));
			return arr;
		}, []);
	}
}

module.exports = {
	MemCache,
};
