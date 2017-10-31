var db = require('./db')
var error = require('./errors')

module.exports = {
	check_cookie: async function(request, response){
		try {
			var sesh = request.headers.cookie.split("=").pop();
			// console.log("GET:", request.path)
		} catch (e) {
			// console.warn("ERROR Processing Cookie:", e);
			response.status(401);
			response.set('Set-Cookie', 'Session=; HttpOnly');
			response.send({error: "session cookie malformed"});
			throw new error.HandledError();
		}
		var user = await db.get(`
			SELECT * FROM users WHERE session_cookie = ?
			AND datetime(session_created, '+1 month') >= CURRENT_TIMESTAMP`,
			sesh);
		if (!user || sesh.length < 5) {
			response.status(401);
			response.set('Set-Cookie', 'Session=; HttpOnly').end();
			throw new error.HandledError();
		}
		return user;
	},
}
