const db = require('sqlite');
(async function() {
	await db.open('freesee.db', {cache: true});
	await db.migrate();
	// await db.migrate({force: 'last'});
	console.log(await db.all('SELECT * FROM users'))
})()
module.exports = db
