// Permissions bitfield helper
'use strict';

module.exports = class Permissions {
	constructor(perms) {
		this.perms = parseInt(perms) || 0;
		this.has = this.has.bind(this);
		Object.freeze(this);
	}
	// Has everything from one target
	has(...targets) {
		if ((this.perms & module.exports.SUPERUSER) !== 0) {
			return true;
		}
		for (const t of targets) {
			if ((t &~ this.perms) === 0) {
				return true;
			}
		}
		return false;
	}
};

Object.assign(module.exports, {
	SUPERUSER: 0x80000000,
	ADMIN:     0x40000000,
	// TODO: more formal permissions
	// READ_ADMIN:0x20000000,
	INVITE:    0x01000000,
	UNUSED:    0x00000001,
});
