// Permissions bitfield helper
'use strict';

const { ProgrammerError } = require('./errors');

class Permissions {
	constructor(perms) {
		this.perms = parseInt(perms) || 0;
		this.has = this.has.bind(this);
		Object.freeze(this);
	}
	// Has everything from one target
	has(...targets) {
		for (const t of targets) {
			if ((t &~ this.perms) === 0) {
				return true;
			}
		}
		return false;
	}
};

// Create Permissions
Object.assign(Permissions, {
	SUPERUSER: 0xffffffff,
	ADMIN:     0x40000000,
	// TODO: more formal permissions
	// READ_ADMIN:0x20000000,
	INVITE:    0x01000000,
	UNUSED:    0x00000001,
	NOOB:      0x00000000,
});

// Explode if a dev tries to use a non-existant permission
const explodey = {
	get(obj, prop) {
		if (prop in obj)
			return obj[prop];
		throw new ProgrammerError(`${obj.name}: non-existant: ${prop}`);
	},
	set(obj, prop) {
		throw new ProgrammerError(
			`${obj.name}: Don't modify permissions during runtime: ${prop}`);
	},
};

Object.freeze(Permissions); // IDK if this does anything
module.exports = new Proxy(Permissions, explodey);
