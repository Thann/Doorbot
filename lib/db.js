// DB wrapper
'use strict';

const db = require('sqlite');
module.exports = db;

db.ready = (async function() {
	if (process.env.NODE_ENV === 'test') {
		try {
			require('fs').unlinkSync('db/testing.sqlite');
		} catch (e) { /**/ }
		await db.open('db/testing.sqlite', {cache: true});
	} else {
		await db.open('db/doorbot.sqlite', {cache: true});
	}
	await db.migrate();
	return db;
})();

// Drop all tables from DB and re-migrate from scratch.
db.reset = async function() {
	await db.ready;
	if (process.env.NODE_ENV !== 'test')
		return console.warn('WARNING: attempted to reset non-test DB!');

	//TODO: this only works because there is only one migration!
	// return await db.migrate({force: 'all'});
	return await db.migrate({force: 'last'});
};
