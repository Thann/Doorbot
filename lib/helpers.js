var db = require('./db')
var error = require('./errors')

module.exports = {
	// fail unless the cookie belongs to a user.
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
	// takes in an Object of {argument: function} and a request;
	// runs the function on the argument of the request.
	parse_args: function(args, request) {
		for (const key of args) {
			console.log("PPP", key);
			if (request.body[key]) {
				try {
					if (args[key])
						args[key] = args[key](request.body[key]);
					else
						args[key] = (request.body[key]);
					}
				} catch(e) {
					args[key] = undefined;
				}
			} else {
				args[key] = undefined;
			}
		}
		return args;
	},
	// wraps db.run calls to insert "arguments" after "SET" in sql
	db_run_set: function(query, args, ...more) {
		query = query.split(" SET ", 2);
		if (query.length != 2) throw Exception("SET not found in query!")
		for (const [index key] of args.keys().entries()) {
			query.splice(index+1, 0, " "+key" = ?, ");
		}
		console.log("RUN: ", query, args, more);
		// return db.run(query, args.values(), ...more);
	},
}
