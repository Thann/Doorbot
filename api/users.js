// REST API for users.
'use strict';

const db = require('../lib/db');
const crypto = require('crypto');
const errors = require('../lib/errors');
const helpers = require('../lib/helpers');

module.exports = function(app) {
	app.  post('/auth', auth);
	app.delete('/auth', logout);
	app.   get('/users', index);
	app.  post('/users', create);
	app.   get('/users/:username', read);
	app. patch('/users/:username', update);
	app.delete('/users/:username', remove);
	app.   get('/users/:username/logs', logs);
};

// Returns the user that owns the session cookie
const checkCookie = async function(request, response) {
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
};
module.exports.checkCookie = checkCookie;

const site = require('./site');  //TODO: remove circular require.
const userAuthRates = new helpers.MemCache();

// === API ===

async function auth(request, response) {
	if (!request.body.username || !request.body.password) {
		return response.status(400)
			.send({username: 'required', password: 'required'});
	}
	//TODO: rate-limit by ip address also.
	if (userAuthRates.get(request.body.username) >=
		site.privateSettings['auth_attempts_per_hour']) {
		return response.status(429)
			.send({error: 'too many auth attempts'});
	}
	const user = await db.get('SELECT * FROM users WHERE username = ?',
		request.body.username);
	const password = request.body.password;
	if (user) {
		// Empty salt mean unhashed password
		if ((!user.pw_salt && password === user.password_hash) ||
				(crypto.createHash('sha256', user.pw_salt)
					.update(password).digest('hex') === user.password_hash)) {
			userAuthRates.set(user.username);

			const sesh = crypto.createHash('sha256')
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
				last_login: user.session_created,
			});
		}

		const rl = userAuthRates.get(user.username) || 0;
		userAuthRates.set(user.username, rl + 1, !rl && 60*60*1000);
	}
	response.status(400).send({error: 'incorrect username or password'});
}

async function logout(request, response) {
	const user = await checkCookie(request, response);
	if (user) {
		await db.run('UPDATE users SET session_cookie = NULL WHERE id = ?',
			user.id);
		response.set('Set-Cookie', 'Session=; HttpOnly');
		return response.status(204).end();
	}
	response.status(401).end();
}

async function index(request, response) {
	const user = await checkCookie(request, response);
	if (!user.admin) {
		return response.status(403).send({error: 'must be admin'});
	}

	const users = await db.all(`
		SELECT users.*, '['||
			GROUP_CONCAT( '{'||
				'"id":'          || permissions.door_id ||','||
				'"name":"'       || IFNULL(doors.name, '') ||'",'||
				'"creation":"'   || IFNULL(permissions.creation, '') ||'",'||
				'"expiration":"' || IFNULL(permissions.expiration, '') ||'",'||
				'"constraints":"'|| IFNULL(permissions.constraints, '') ||'"'||
			'}' ) ||']' AS doors FROM users
		LEFT JOIN permissions ON users.id = permissions.user_id
		LEFT JOIN doors ON permissions.door_id = doors.id
		GROUP BY users.id`);

	const userList = [];
	for (const usr of users) {
		userList.push({
			id: usr.id,
			doors: JSON.parse(usr.doors) || [],
			admin: Boolean(usr.admin),
			username: usr.username,
			password: usr.pw_salt? undefined : usr.password_hash,
			requires_reset: !usr.pw_salt,
		});
	}
	response.send(userList);
}

async function create(request, response) {
	const username = request.body.username;
	if (!username)
		return response.status(400).send({username: 'required'});
	if (!username.match(/^\w+$/))
		return response.status(400).send({username: 'invalid'});

	let invite, salt, pw, admin;
	const user = await checkCookie(request, response);

	if (!user.admin) {
		if (!request.body.invite)
			return response.status(403).send({error: 'must have invite'});
		invite = site.pendingInvites.get(request.body.invite);
		if (!invite)
			return response.status(400)
				.send({error: 'invalid or expired invite'});
		if (request.body.password) {
			if (request.body.password.length < 8)
				return response.status(400)
					.send({password: 'must be at least 8 characters'});
			salt = crypto.createHash('sha256')
				.update(Math.random().toString()).digest('hex');
			pw = crypto.createHash('sha256', salt)
				.update(request.body.password).digest('hex');
		}
	} else {
		pw = request.body.password;
		admin = Boolean(request.body.admin);
		//TODO: use bitfield
		// try {
		// 	admin = parseInt(request.body.admin);
		// } catch(e) {
		// 	return response.status(400).send({admin: 'must be int'});
		// }
	}

	// Default password to random hash.
	pw = pw || (crypto.createHash('sha256')
		.update(Math.random().toString()).digest('hex').substring(1, 15));

	let sqlResp;
	try {
		sqlResp = await db.run(`
			INSERT INTO users (username, pw_salt, password_hash, admin)
			VALUES (?,?,?,?)`,
			username, salt, pw, admin);
	} catch(e) {
		// console.warn('USER UPDATE ERROR:', e);
		return response.status(400)
			.send({username: 'already taken'});
	}

	//TODO: create invite permissions.

	response.send({
		id: sqlResp.stmt.lastID,
		admin: Boolean(request.body.admin),
		username: request.body.username,
		password: pw,
		requires_reset: true,
	});
}

async function read(request, response) {
	const user = await checkCookie(request, response);
	if (!user.admin && request.params.username !== user.username) {
		return response.status(403)
			.send({error: 'only admins can view others'});
	}

	const usr = await db.get(`
		SELECT users.*, '['||
			GROUP_CONCAT( '{'||
				'"id":'          || permissions.door_id ||','||
				'"name":"'       || IFNULL(doors.name, '') ||'",'||
				'"creation":"'   || IFNULL(permissions.creation, '') ||'",'||
				'"expiration":"' || IFNULL(permissions.expiration, '') ||'",'||
				'"constraints":"'|| IFNULL(permissions.constraints, '') ||'"'||
			'}' ) ||']' AS doors FROM users
		LEFT JOIN permissions ON users.id = permissions.user_id
		LEFT JOIN doors ON permissions.door_id = doors.id
		WHERE username = ?`,
		request.params.username);

	if (!usr.id) {
		return response.status(404).end();
	}
	response.send({
		id: usr.id,
		doors: JSON.parse(usr.doors) || [],
		admin: Boolean(usr.admin),
		username: usr.username,
		password: user.admin && !usr.pw_salt && usr.password_hash || undefined,
		requires_reset: !usr.pw_salt,
	});
}

async function update(request, response) {
	const user = await checkCookie(request, response);
	if (!user.admin && (
		!request.body.password || request.body.password.length < 8)) {
		return response.status(400)
			.send({password: 'must be at least 8 characters'});
	}

	// console.log("Update_USER", user, request.params.username, user.username)
	if (!user.admin && request.params.username !== user.username) {
		return response.status(403)
			.send({error: 'can only update your own info'});
	}

	if (!user.admin && request.body.admin) {
		return response.status(403).send({error: "can't make yourself admin"});
	}
	//TODO: update username and stuff. (PUT?)

	let salt, pwHash = null;
	if (request.params.username !== user.username) {
		// var salt = null;
		if (request.body.password) {
			pwHash = request.body.password;
		} else {
			pwHash = crypto.createHash('sha256')
				.update(Math.random().toString())
				.digest('hex').substring(1, 15);
		}
	} else {
		if (user.pw_salt && (!request.current_password ||
							crypto.createHash('sha256', user.pw_salt)
								.update(request.body.current_password)
								.digest('hex') !== user.password_hash)) {
			return response.status(400)
				.send({current_password: 'incorrect password'});
		}
		salt = crypto.createHash('sha256')
			.update(Math.random().toString()).digest('hex');
		pwHash = crypto.createHash('sha256', salt)
			.update(request.body.password).digest('hex');
	}

	try {
		// const r = await db.run(`
		await db.run(`
			UPDATE users SET pw_salt = ? , password_hash = ?
			WHERE username = ?`,
			salt, pwHash, request.params.username);
		// console.log("UPDATE:", r)
	} catch(e) {
		return response.status(400).send({error: 'DB update error'});
	}

	const usr = await db.get(`
		SELECT users.*, '['||
			GROUP_CONCAT( '{'||
				'"id":'          || permissions.door_id ||','||
				'"name":"'       || IFNULL(doors.name, '') ||'",'||
				'"creation":"'   || IFNULL(permissions.creation, '') ||'",'||
				'"expiration":"' || IFNULL(permissions.expiration, '') ||'",'||
				'"constraints":"'|| IFNULL(permissions.constraints, '') ||'"'||
			'}' ) ||']' AS doors FROM users
		LEFT JOIN permissions ON users.id = permissions.user_id
		LEFT JOIN doors ON permissions.door_id = doors.id
		WHERE username = ?`,
		request.params.username);

	response.send({
		id: usr.id,
		doors: JSON.parse(usr.doors) || [],
		admin: Boolean(usr.admin),
		username: usr.username,
		password: user.admin && !usr.pw_salt && usr.password_hash || undefined,
		requires_reset: !usr.pw_salt,
	});
}

async function remove(request, response) {
	const user = await checkCookie(request, response);
	if (!user.admin) {
		return response.status(403).send({error: 'must be admin'});
	}

	//TODO: use ON DELETE CASCADE instead?
	await db.run(`
		DELETE FROM permissions WHERE user_id = (
			SELECT id FROM users WHERE username = ?)`,
		request.params.username);
	await db.run(`
		DELETE FROM entry_logs WHERE user_id = (
			SELECT id FROM users WHERE username = ?)`,
		request.params.username);
	const r = await db.run(
		'DELETE FROM users WHERE username = ?',
		request.params.username);

	response.status(r.stmt.changes? 204 : 404).end();
}

async function logs(request, response) {
	const user = await checkCookie(request, response);
	if (!user.admin && request.params.username !== user.username) {
		return response.status(403).send({error: 'must be admin'});
	}

	let lastID;
	try {
		lastID = parseInt(request.query.last_id);
	} catch(e) {
		return response.status(400).send({last_id: 'must be an int'});
	}

	const logs = await db.all(`
		SELECT entry_logs.*, doors.name AS door FROM entry_logs
		INNER JOIN users ON entry_logs.user_id = users.id
		INNER JOIN doors ON entry_logs.door_id = doors.id
		WHERE users.username = ? AND entry_logs.id < COALESCE(?, 9e999)
		ORDER BY entry_logs.id DESC LIMIT ?`,
		request.params.username, lastID, 50);

	response.send(logs);
}
