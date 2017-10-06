// REST API for users.

var db = require('../lib/db');
var crypto = require('crypto');
var error = require('../lib/errors');
var helpers = require('../lib/helpers');

module.exports = function(app) {
	app.post("/auth", auth);
	app.get("/users", index);
	app.post("/users", create);
	app.get("/users/:id", read);
	app.patch("/users/:id", update);
	app.delete("/users/:id", del_user);
}

async function auth(request, response) {
	console.log("AUTH:", request.body)
	if (!request.body.username || !request.body.password) {
		response.writeHead(400);
		response.write("username and password are required.");
		return response.end();
	}
	var user = await db.get("SELECT * FROM users where username = ?", request.body.username)
	var password = request.body.password
	if (user) {
		// console.log("HX",
		// 	//crypto.createHash("sha256", user.pw_salt||'').update(request.query.password).digest('hex'))
		// 	crypto.createHash("sha256", user.pw_salt||'').update(password).digest('hex'))
		// //if ((!user.pw_salt && request.query.password == user.password_hash) ||
		// 		//(crypto.createHash("sha256", user.pw_salt).update(request.query.password).digest('hex') == user.password_hash)) {
		if ((!user.pw_salt && password == user.password_hash) ||
				(crypto.createHash("sha256", user.pw_salt).update(password).digest('hex') == user.password_hash)) {

			var sesh = crypto.createHash("sha256").update(Math.random().toString()).digest('hex')
			await db.run("UPDATE users SET session_cookie = ? , session_created = CURRENT_TIMESTAMP WHERE id = ?",
				sesh, user.id);
			response.setHeader('Set-Cookie', 'Session='+sesh+'; HttpOnly');
			response.writeHead(200);
			response.write(JSON.stringify({username: user.username}));
			return response.end();
		}
	}
	response.writeHead(401);
	return response.end();
}

async function index(request, response) {
	var user = await helpers.check_cookie(request, response)
	if (!user.admin) {
		response.writeHead(403);
		response.write("Must be admin");
		return response.end();
	}
	var users = await db.all("SELECT * FROM users");

	response.writeHead(200);
	var user_l = [];
	for (var usr in users) {
		users_l.push({
			username: usr.username,
			admin: !!usr.admin,
			requires_reset: !user.salt,
		});
	}
	response.write(JSON.stringify(user_l));
	response.end();
}

async function create(request, response) {
	console.log("BODY:", request.body);
	if (!request.body.username) {
		response.writeHead(400);
		response.write("username is required.");
		return response.end();
	}

	var user = await helpers.check_cookie(request, response)
	console.log("USER", user)
	if (!user.admin) {
		response.writeHead(403);
		response.write("Must be admin");
		return response.end();
	}

	// Give the user a random un-hashed password
	var pw = crypto.createHash("sha256").update(Math.random().toString()).digest('hex').substring(1, 15);
	try {
		await db.run("INSERT INTO users (username, password_hash, admin) VALUES (?,?,?,?)",
			request.body.username, pw, !!request.body.admin);
	} catch(e) {
		response.writeHead(400);
		response.write("Username already taken");
		return response.end();
	}

	response.writeHead(200);
	response.write(JSON.stringify({
		username: request.body.username,
		password: pw,
		admin: !!request.body.admin,
		requires_reset: true,
	}));
	response.end();
}

async function read(request, response) {
	var user = await helpers.check_cookie(request, response)
	if (request.params.id != user.id) {
		if (user.admin) {
			user = await db.get("SELECT * FROM users where username = ?", request.params.id);
		} else {
			response.writeHead(403);
			response.end();
			throw new error.HandledError();
		}
	}
	response.writeHead(200);
	response.write(JSON.stringify({
		admin: !!user.admin,
		username: user.username,
		requires_reset: !user.salt,
	}));
	response.end();
}

async function update(request, response) {
	console.log("BODY:", request.body);
	if (!request.body.password) {
		response.writeHead(400);
		response.write("password is required.");
		return response.end();
	}

	var user = await helpers.check_cookie(request, response, request.params.id)
	console.log("Update_USER", user)
	if (request.params.id != user.id) {
		response.writeHead(403);
		response.write("Can only update your own info.");
		return response.end();
	}

	var salt = crypto.createHash("sha256").update(Math.random().toString()).digest('hex');
	var pw_hash = crypto.createHash("sha256", salt).update(request.body.password).digest('hex');
	try {
		await db.run("UPDATE users SET pw_salt = ? , password_hash = ? WHERE username = ?",
			salt, pw_hash, user.id);
	} catch(e) {
		response.writeHead(400);
		response.write("DB update error.");
		return response.end();
	}

	response.writeHead(200);
	response.write(JSON.stringify({
		admin: user.admin,
		username: user.username,
		requires_reset: false,
	}));
	response.end();
}

async function del_user(request, response) {
	var user = await helpers.check_cookie(request, response)
	if (!user.admin) {
		response.writeHead(403);
		response.write("Must be admin");
		return response.end();
	}
	try {
		await db.run("DELETE users WHERE id = ?", request.params.id);
	} catch(e) {
		response.writeHead(400); //TODO: 404?
		response.write("DB delete error.");
		return response.end();
	}

	response.writeHead(200);
	response.end();
}
