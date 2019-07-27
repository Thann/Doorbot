'use strict';

const assert = require('assert');
const Perms = require('../lib/permissions');
const { ProgrammerError } = require('../lib/errors');

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

	it('explodes', async function() {
		/* eslint-disable no-return-assign */
		Perms.SUPERUSER;
		assert.throws(() => Perms.NON_EXISTANT, ProgrammerError);
		assert.throws(() => Perms.NON_EXISTANT = 1, ProgrammerError);
		assert.throws(() => Perms.ADMIN = 1, ProgrammerError);
	});
});
