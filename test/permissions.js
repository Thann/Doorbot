'use strict';

const Perms = require('../lib/permissions');
const assert = require('assert');

describe('Permissions module', function() {
	it('has', async function() {
		const A = new Perms(0b1010);
		assert(A.has(0b1010));
		assert(A.has(0b1000));
		assert(A.has(0b10));
		assert(A.has(0b1000, 0b10));
		assert(A.has(0b010, 0b100));
		assert(A.has(0b100, 0b010));
		assert(!A.has(0b100, 0b1));
		assert(!A.has(0b100));
	});

	it('binds', async function() {
		const B = { 'has': new Perms(0b1010).has };
		assert(B.has(0b1010));
	});

	it('superuser', async function() {
		const B = new Perms(Perms.SUPERUSER);
		assert(B.has(0b1));
	});
});
