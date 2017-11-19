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

// Drop all rows from all tables and re-insert admin user.
db.reset = async function() {
	await db.ready;
	if (process.env.NODE_ENV !== 'test')
		return console.warn('WARNING: attempted to reset non-test DB!');

	//TODO: dynamically truncate all tables
	await db.run('DELETE FROM users');
	await db.run('DELETE FROM doors');
	await db.run('DELETE FROM permissions');
	await db.run('DELETE FROM entry_logs');
	await db.run(`
		INSERT INTO users (username, password_hash, admin)
		VALUES ('admin', 'admin', 1)`);
};
