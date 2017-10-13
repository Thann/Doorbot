// REST API for users.

const db = require('../lib/db');
const crypto = require('crypto');
const error = require('../lib/errors');
const helpers = require('../lib/helpers');

module.exports = function(app) {
	app.  post("/auth", auth);
	app.delete("/auth", logout);
	app.   get("/users", index);
	app.  post("/users", create);
	app.   get("/users/:username", read);
	app. patch("/users/:username", update);
	app.delete("/users/:username", del_user);
	app.   get("/users/:username/logs", logs);
}

async function auth(request, response) {
	if (!request.body.username || !request.body.password) {
		response.writeHead(400);
		response.write("username and password are required.");
		return response.end();
	}
	const user = await db.get("SELECT * FROM users where username = ?",
		request.body.username);
	const password = request.body.password;
	if (user) {
		// console.log("HX",
		// 	//crypto.createHash("sha256", user.pw_salt||'').update(request.query.password).digest('hex'))
		// 	crypto.createHash("sha256", user.pw_salt||'').update(password).digest('hex'))
		// //if ((!user.pw_salt && request.query.password == user.password_hash) ||
		// 		//(crypto.createHash("sha256", user.pw_salt).update(request.query.password).digest('hex') == user.password_hash)) {
		if ((!user.pw_salt && password == user.password_hash) ||
				(crypto.createHash("sha256", user.pw_salt)
					.update(password).digest('hex') == user.password_hash)) {

			const sesh = crypto.createHash("sha256")
				.update(Math.random().toString()).digest('hex');

			await db.run(`
				UPDATE users
				SET session_cookie = ? , session_created = CURRENT_TIMESTAMP
				WHERE id = ?`,
				sesh, user.id);
			response.setHeader('Set-Cookie', 'Session='+sesh+'; HttpOnly');
			response.writeHead(200);
			response.write(JSON.stringify({
				id: user.id,
				username: user.username,
				requires_reset: !user.pw_salt,
			}));
			return response.end();
		}
	}
	response.writeHead(401);
	return response.end();
}

async function logout(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (user) {
		await db.run("UPDATE users SET session_cookie = NULL WHERE id = ?",
			user.id);
		response.setHeader('Set-Cookie', 'Session=; HttpOnly');
		response.writeHead(200);
		return response.end();
	}
	response.writeHead(401);
	return response.end();
}

async function index(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (!user.admin) {
		response.writeHead(403);
		response.write("Must be admin");
		return response.end();
	}
	const users = await db.all(`
		SELECT users.*, group_concat(permissions.door_id) as doors FROM users
		LEFT JOIN permissions on users.id = permissions.user_id
		GROUP BY users.id`);

	response.writeHead(200);
	const user_l = [];
	for (const usr of users) {
		user_l.push({
			id: usr.id,
			doors: usr.doors,
			admin: !!usr.admin,
			username: usr.username,
			password: usr.pw_salt? null : usr.password_hash,
			requires_reset: !usr.pw_salt,
		});
	}
	response.write(JSON.stringify(user_l));
	response.end();
}

async function create(request, response) {
	if (!request.body.username) {
		response.writeHead(400);
		response.write("username is required.");
		return response.end();
	}

	const user = await helpers.check_cookie(request, response);
	if (!user.admin) {
		response.writeHead(403);
		response.write("Must be admin");
		return response.end();
	}

	// Give the user a random un-hashed password
	const pw = crypto.createHash("sha256")
		.update(Math.random().toString()).digest('hex').substring(1, 15);

	try {
		var r = await db.run(
			"INSERT INTO users (username, password_hash, admin) VALUES (?,?,?)",
			request.body.username, pw, !!request.body.admin);
	} catch(e) {
		response.writeHead(400);
		response.write("Username already taken");
		return response.end();
	}

	response.writeHead(200);
	response.write(JSON.stringify({
		id: r.stmt.lastID,
		admin: !!request.body.admin,
		username: request.body.username,
		password: pw,
		requires_reset: true,
	}));
	response.end();
}

async function read(request, response) {
	var user = await helpers.check_cookie(request, response);
	if (request.params.username != user.username) {
		if (user.admin) {
			// user = await db.get("SELECT * FROM users where username = ?",
			user = await db.get(`
				SELECT users.*, group_concat(permissions.door_id) as doors FROM users
				LEFT JOIN permissions on users.id = permissions.user_id
				WHERE username = ?`,
				request.params.username);
		} else {
			response.writeHead(403);
			response.write("Only admins can view others.");
			return response.end();
		}
	}
	response.writeHead(200);
	response.write(JSON.stringify({
		id: user.id,
		doors: user.doors,
		admin: !!user.admin,
		username: user.username,
		requires_reset: !user.pw_salt,
	}));
	response.end();
}

async function update(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (!user.admin && (
			!request.body.password || request.body.password.length < 8)) {
		response.writeHead(400);
		response.write("password must be at least 8 characters.");
		return response.end();
	}

	console.log("Update_USER", user, !user.admin, request.params.username, user.username)
	if (!user.admin && request.params.username != user.username) {
		response.writeHead(403);
		response.write("Can only update your own info.");
		return response.end();
	}

	if (!user.admin && request.body.admin) {
		response.writeHead(403);
		response.write("Cant make yourself admin.");
		return response.end();
	}
	//TODO: update username and stuff. (PUT?)

	if (request.params.username != user.username) {
		var salt = null;
		if (request.body.password) {
			var pw_hash = request.body.password;
		} else {
			var pw_hash = crypto.createHash("sha256")
				.update(Math.random().toString())
				.digest('hex').substring(1, 15);
		}
	} else {
		var salt = crypto.createHash("sha256")
			.update(Math.random().toString()).digest('hex');
		var pw_hash = crypto.createHash("sha256", salt)
			.update(request.body.password).digest('hex');
	}

	try {
		const f = await db.run(`
			UPDATE users SET pw_salt = ? , password_hash = ?
			WHERE username = ?`,
			salt, pw_hash, request.params.username);
		console.log("UPDATE:", f)
	} catch(e) {
		response.writeHead(400);
		response.write("DB update error.");
		return response.end();
	}

	response.writeHead(200);
	response.write(JSON.stringify({
		id: user.id,
		admin: user.admin,
		username: user.username,
		requires_reset: false,
	}));
	response.end();
}

async function del_user(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (!user.admin) {
		response.writeHead(403);
		response.write("Must be admin");
		return response.end();
	}
	const r = await db.run("DELETE FROM users WHERE username = ?",
			request.params.username);
	if (!r.stmt.changes) {
		response.writeHead(404);
	} else {
		response.writeHead(200);
	}

	response.end();
}

async function logs(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (!user.admin && request.params.username != user.username) {
		response.writeHead(403);
		response.write("Must be admin");
		return response.end();
	}
	try {
		var page = parseInt(request.params.page||1)-1;
	} catch(e) {
		response.writeHead(400);
		response.write("page must be an int");
		return response.end();
	}
	const logs = await db.all(`
		SELECT entry_logs.*, doors.name as door FROM entry_logs
		INNER JOIN users on entry_logs.user_id = users.id
		INNER JOIN doors on entry_logs.door_id = doors.id
		WHERE users.username = ? ORDER BY entry_logs.id DESC LIMIT ? OFFSET ?`,
		request.params.username, 50, page*50);

	response.writeHead(200);
	response.write(JSON.stringify(logs));
	response.end();
}
