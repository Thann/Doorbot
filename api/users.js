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
		return response.status(400)
			.send({username: 'required', password: 'required'});
	}
	const user = await db.get("SELECT * FROM users where username = ?",
		request.body.username);
	const password = request.body.password;
	if (user) {
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
			response.set('Set-Cookie',
				'Session='+sesh+'; HttpOnly; Max-Age=2592000');
			return response.send({
				id: user.id,
				username: user.username,
				requires_reset: !user.pw_salt,
			});
		}
	}
	response.status(401).end();
}

async function logout(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (user) {
		await db.run("UPDATE users SET session_cookie = NULL WHERE id = ?",
			user.id);
		response.set('Set-Cookie', 'Session=; HttpOnly');
		return response.send(200);
	}
	response.status(401).end();
}

async function index(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (!user.admin) {
		return response.status(403).send({error: 'must be admin'});
	}
	const users = await db.all(`
		SELECT users.*, group_concat(permissions.door_id) as doors FROM users
		LEFT JOIN permissions on users.id = permissions.user_id
		GROUP BY users.id`);

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
	response.send(user_l);
}

async function create(request, response) {
	if (!request.body.username) {
		return response.status(400)
			.send({username: 'required'});
	}

	const user = await helpers.check_cookie(request, response);
	if (!user.admin) {
		return response.status(403).send({error: 'must be admin'});
	}

	// Give the user a random un-hashed password
	const pw = crypto.createHash("sha256")
		.update(Math.random().toString()).digest('hex').substring(1, 15);

	try {
		var r = await db.run(
			"INSERT INTO users (username, password_hash, admin) VALUES (?,?,?)",
			request.body.username, pw, !!request.body.admin);
	} catch(e) {
		return response.status(400)
			.send({username: 'already taken'});
	}

	response.send({
		id: r.stmt.lastID,
		admin: !!request.body.admin,
		username: request.body.username,
		password: pw,
		requires_reset: true,
	});
}

async function read(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (!user.admin && request.params.username != user.username) {
		return response.status(403)
			.send({error: 'only admins can view others'});
	}
	const usr = await db.get(`
		SELECT users.*, group_concat(permissions.door_id) as doors FROM users
		LEFT JOIN permissions on users.id = permissions.user_id
		WHERE username = ?`,
		request.params.username);
	if (!usr.id) {
		return response.status(404).end();
	}
	response.send({
		id: usr.id,
		doors: usr.doors,
		admin: !!usr.admin,
		username: usr.username,
		password: user.admin && usr.pw_salt? null : usr.password_hash,
		requires_reset: !usr.pw_salt,
	});
}

async function update(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (!user.admin && (
			!request.body.password || request.body.password.length < 8)) {
		return response.status(400)
			.send({password: 'must be at least 8 characters'});
	}

	// console.log("Update_USER", user, !user.admin, request.params.username, user.username)
	if (!user.admin && request.params.username != user.username) {
		return response.status(403)
			.send({error: 'can only update your own info'});
	}

	if (!user.admin && request.body.admin) {
		return response.status(403).send({error: "can't make yourself admin"});
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
		if (user.pw_salt && (!request.current_password ||
							crypto.createHash("sha256", user.pw_salt)
							.update(request.body.current_password).digest('hex')
								!== user.password_hash)) {
			return response.status(400)
				.send({current_password: 'incorrect password'});
		}
		var salt = crypto.createHash("sha256")
			.update(Math.random().toString()).digest('hex');
		var pw_hash = crypto.createHash("sha256", salt)
			.update(request.body.password).digest('hex');
	}

	try {
		var r = await db.run(`
			UPDATE users SET pw_salt = ? , password_hash = ?
			WHERE username = ?`,
			salt, pw_hash, request.params.username);
		// console.log("UPDATE:", r)
	} catch(e) {
		return response.status(400).send({error: 'DB update error'});
	}

	response.send({
		id: r.lastID,
		// admin: user.admin,
		// username: user.username,
		// requires_reset: false,
	});
}

async function del_user(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (!user.admin) {
		return response.status(403).send({error: 'must be admin'});
	}
	const r = await db.run("DELETE FROM users WHERE username = ?",
			request.params.username);
	response.status(r.stmt.changes? 200 : 404).end();
}

async function logs(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (!user.admin && request.params.username != user.username) {
		return response.status(403).send({error: 'must be admin'});
	}
	try {
		var page = parseInt(request.params.page||1)-1;
	} catch(e) {
		return response.status(400).send({page: 'must be an int'});
	}
	const logs = await db.all(`
		SELECT entry_logs.*, doors.name as door FROM entry_logs
		INNER JOIN users on entry_logs.user_id = users.id
		INNER JOIN doors on entry_logs.door_id = doors.id
		WHERE users.username = ? ORDER BY entry_logs.id DESC LIMIT ? OFFSET ?`,
		request.params.username, 50, page*50);

	response.send(logs);
}
