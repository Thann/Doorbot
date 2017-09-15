var db = require('./db')
var error = require('./errors')

module.exports = {
	check_cookie: async function(request, response, username){
		try {
			var sesh = request.headers.cookie.split("=").pop();
			console.log("GET:", request.path, sesh)
		} catch (e) {
			console.warn("ERROR Processing Cookie:", e);
			response.writeHead(400);
			response.write("Session cookie is malformed.");
			response.end();
			throw new error.HandledError();
		}
		var user = await db.get("SELECT * FROM users WHERE session_cookie = ?", sesh);
		if (user && username && user.username != username) {
			response.writeHead(403);
			response.end();
			throw new error.HandledError();
		}
		if (user) return user;
		response.writeHead(401);
		response.end();
		throw new error.HandledError()
	},
}
