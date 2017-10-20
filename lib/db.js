const db = require('sqlite');
(async function() {
	if (process.env.NODE_ENV == 'test') {
		try { require('fs').unlinkSync('db/testing.sqlite');
		} catch (e) {}
		await db.open('db/testing.sqlite', {cache: true});
	} else {
		await db.open('db/doorbot.sqlite', {cache: true});
	}
	await db.migrate();
	// await db.migrate({force: 'last'});
})()
module.exports = db
