'use strict';

const db = require('./db');
const errors = require('./errors');

module.exports = {
	check_cookie: async function(request, response) {
		let sesh;
		try {
			sesh = request.headers.cookie.split('=').pop();
			// console.log("GET:", request.path)
		} catch (e) {
			// console.warn("ERROR Processing Cookie:", e);
			response.status(401);
			response.set('Set-Cookie', 'Session=; HttpOnly');
			response.send({error: 'session cookie malformed'});
			throw new errors.HandledError();
		}
		const user = await db.get(`
			SELECT * FROM users WHERE session_cookie = ?
			AND datetime(session_created, '+1 month') >= CURRENT_TIMESTAMP`,
			sesh);
		if (!user || sesh.length < 5) {
			response.status(401);
			response.set('Set-Cookie', 'Session=; HttpOnly').end();
			throw new errors.HandledError();
		}
		return user;
	},
};
