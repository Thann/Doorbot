const db = require('sqlite');
(async function() {
	await db.open('db/doorbot.sqlite', {cache: true});
	await db.migrate();
	// await db.migrate({force: 'last'});
})()
module.exports = db
