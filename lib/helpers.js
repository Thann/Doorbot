var db = require('./db')
var error = require('./errors')

module.exports = {
	check_cookie: async function(request, response){
		try {
			var sesh = request.headers.cookie.split("=").pop();
			// console.log("GET:", request.path)
		} catch (e) {
			console.warn("ERROR Processing Cookie:", e);
			response.writeHead(400);
			response.write("Session cookie is malformed.");
			response.end();
			throw new error.HandledError();
		}
		var user = await db.get("SELECT * FROM users WHERE session_cookie = ?", sesh);
		if (!user || sesh.length < 5) {
			response.writeHead(401);
			response.end();
			throw new error.HandledError();
		}
		//TODO...
		// if (user.session_created && user.session_created < ...) {
		// 	response.writeHead(401);
		// 	response.end();
		// 	throw new error.HandledError();
		// }
		return user;
	},
}
