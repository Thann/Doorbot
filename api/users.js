// REST API for users.

var db = require('../lib/db')
var crypto = require('crypto')
var error = require('../lib/errors');
var helpers = require('../lib/helpers');

module.exports = function(app) {
	app.get("/auth", auth);
	app.post("/users", create);
	app.get("/users/:id", read);
	app.patch("/users/:id", update);
	app.delete("/users/:id", del_user);
}

async function auth(request, response) {
	console.log("AUTH:", request.query)
	if (!request.query.username || !request.query.password) {
		response.writeHead(400);
		response.write("username and password are required.");
		return response.end();
	}
	user = await db.get("SELECT * FROM users where username = ?", request.query.username)
	// console.log("RES:",user)
	if (user) {
		console.log("HX",
			crypto.createHash("sha256", user.pw_salt||'').update(request.query.password).digest('hex'))
		if ((!user.pw_salt && request.query.password == user.password_hash) ||
				(crypto.createHash("sha256", user.pw_salt).update(request.query.password).digest('hex') == user.password_hash)) {

			var sesh = crypto.createHash("sha256").update(Math.random().toString()).digest('hex')
			await db.run("UPDATE users SET session_cookie = ? WHERE id = ?", sesh, user.id)
			response.setHeader('Set-Cookie', 'Session='+sesh+'; HttpOnly');
			response.writeHead(200);
			response.write(JSON.stringify({username: user.username}));
			return response.end();
		}
	}
	response.writeHead(401);
	return response.end();
}

async function create(request, response) {
	console.log("BODY:", request.body);
	if (!request.body.username) {
		response.writeHead(400);
		response.write("username is required.");
		return response.end();
	}

	user = await helpers.check_cookie(request, response)
	console.log("USER", user)
	if (!user.admin) {
		response.writeHead(403);
		response.write("Must be admin")
		response.end();
		return;
	}

	var salt = crypto.createHash("sha256").update(Math.random().toString()).digest('hex');
	var pw = crypto.createHash("sha256").update(Math.random().toString()).digest('hex').substring(1, 15);
	var pw_hash = crypto.createHash("sha256", user.pw_salt).update(pw).digest('hex');
	try {
		await db.run("INSERT INTO users (username, pw_salt, password_hash, admin) VALUES (?,?,?,?)",
			request.body.username, salt, pw_hash, !!request.body.admin);
	} catch(e) {
		response.writeHead(400);
		response.write("Username already taken");
		return response.end();
	}

	response.writeHead(200);
	response.write(JSON.stringify({
		username: request.body.username,
		password: pw
	}));
	response.end();
}

async function read(request, response) {
	user = await helpers.check_cookie(request, response)
	if (request.params.id != user.id) {
			if (user.admin) {
				user = await db.get("SELECT * FROM users where username = ?", request.params.id)
			} else {
				response.writeHead(403);
				response.end();
				throw new error.HandledError();
			}
	}
	response.writeHead(200);
	response.write(JSON.stringify({
		username: user.username
	}));
	response.end();
}

async function update(request, response) {
	console.log("BODY:", request.body);
	// if (!request.body.username) {
	// 	response.writeHead(400);
	// 	response.write("username is required.");
	// 	return response.end();
	// }

	user = await helpers.check_cookie(request, response, request.parmms.id)
	console.log("USER", user)
	if (!user.admin) {
		response.writeHead(403);
		response.write("Must be admin")
		response.end();
		return;
	}


	// var salt = crypto.createHash("sha256").update(Math.random().toString()).digest('hex');
	var pw = crypto.createHash("sha256").update(Math.random().toString()).digest('hex').substring(1, 15);
	var pw_hash = crypto.createHash("sha256", user.pw_salt).update(pw).digest('hex');
	try {
		await db.run("INSERT INTO users (username, pw_salt, password_hash) VALUES (?,?,?)",
			request.body.username, salt, pw_hash);
	} catch(e) {
		response.writeHead(400);
		response.write("Username already taken");
		return response.end();
	}

	response.writeHead(200);
	response.write(JSON.stringify({
		username: request.body.username,
		password: pw
	}));
	response.end();
}

async function del_user(request, response) {

}
