// DB wrapper
'use strict';

const db = require('sqlite');
module.exports = db;

db.ready = (async function() {
	if (process.env.NODE_ENV === 'test') {
		await db.open(':memory:', {cache: true});
	} else {
		await db.open('db/doorbot.sqlite', {cache: true});
	}
	// await db.migrate({force: 'last'});
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
		VALUES ('admin', 'admin', 0xffffffff)`);
};

// Helper function to update using data object.
// Usage: d.update('users', {'name': 'jon'}, 'username LIKE ?', 'thann')
db.update = async function(table, data, where, ...values) {
	if (!table || !data || !where) {
		throw 'Invalid Args!';
	}
	const keys = Object.keys(data).join(' = ? , ') + ' = ?';
	// console.log(
	// 	`UPDATE ${table} SET ${keys} WHERE ${where};`,
	// 	...Object.values(data), ...values);
	return await db.run (
		`UPDATE ${table} SET ${keys} WHERE ${where};`,
		...Object.values(data), ...values);
};

// Helper function to update using data object.
// Usage: d.update('users', {'name': 'jon'}, 'username LIKE ?', 'thann');
db.update = async function(table, data, where, ...values) {
	if (!table || !data || !where) {
		throw 'Invalid Args!';
	}
	if (!Object.keys(data).length) return;
	const keys = Object.keys(data).join(' = ? , ') + ' = ?';
	// console.log(
	// 	`UPDATE ${table} SET ${keys} WHERE ${where};`,
	// 	...Object.values(data), ...values);
	return await db.run (
		`UPDATE ${table} SET ${keys} WHERE ${where};`,
		...Object.values(data), ...values);
};
