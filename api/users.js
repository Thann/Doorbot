// REST API for users.
'use strict';

const db = require('../lib/db');
const crypto = require('crypto');
const cookie = require('cookie');
const errors = require('../lib/errors');
const Perms = require('../lib/permissions');
const MemCache = require('../lib/memcache');

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
		sesh = cookie.parse(request.headers.cookie).Session;
		// console.log("GET:", request.path)
	} catch (e) {
		// console.warn("ERROR Processing Cookie:", e);
		response.clearCookie('Session');
		response.status(401).send({error: 'session cookie malformed'});
		throw new errors.HandledError();
	}
	const user = await db.get(`
		SELECT * FROM users WHERE session_cookie = ?
		AND datetime(session_created, '+1 month') >= CURRENT_TIMESTAMP`,
		sesh);
	if (!user || sesh.length < 5) {
		response.clearCookie('Session');
		response.status(401).end();
		throw new errors.HandledError();
	}
	user.has = new Perms(user.admin).has;
	return user;
};
module.exports.checkCookie = checkCookie;

const site = require('./site');  //TODO: remove circular require.
const userAuthRates = new MemCache();

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
	const user = await db.get(`
		SELECT * FROM users WHERE username = ? AND deleted_at IS NULL`,
		request.body.username);
	const password = request.body.password;
	if (user) {
		// Empty salt mean unhashed password
		if ((!user.pw_salt && password === user.password_hash) ||
				(hash(password, user.pw_salt) === user.password_hash)) {
			userAuthRates.set(user.username);

			const sesh = hash();
			await db.run(`
				UPDATE users
				SET session_cookie = ? , session_created = CURRENT_TIMESTAMP
				WHERE id = ? AND deleted_at IS NULL`,
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
		response.clearCookie('Session');
		return response.status(204).end();
	}
	response.status(401).end();
}

async function index(request, response) {
	const user = await checkCookie(request, response);
	// TODO: formalize permissions (read only?)
	if (!user.has(Perms.ADMIN)) {
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
		WHERE deleted_at IS NULL GROUP BY users.id`);

	const userList = [];
	for (const usr of users) {
		userList.push({
			id: usr.id,
			doors: JSON.parse(usr.doors) || [],
			admin: usr.admin || 0,
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
	if (!username.match(/^\w+$/) || username === 'me')
		return response.status(400).send({username: 'invalid'});

	let invite, salt, pw, admin;
	const user = await checkCookie(request, response);
	let creator = user.id;

	if (!user.has(Perms.ADMIN)) {
		if (!request.body.invite)
			return response.status(403).send({error: 'must have invite'});
		invite = site.pendingInvites.get(request.body.invite);
		if (!invite)
			return response.status(400)
				.send({invite: 'invalid or expired'});
		creator = invite.admin_id;
		if (request.body.password) {
			if (request.body.password.length < 8)
				return response.status(400)
					.send({password: 'must be at least 8 characters'});
			salt = hash();
			pw = hash(request.body.password, salt);
		}
	} else {
		pw = request.body.password;
		if (request.body.admin & (~user.admin) !== 0) {
			return response.status(403)
				.send({admin: "can't give admin permissions you don't have"});
		}
		try {
			admin = parseInt(request.body.admin);
		} catch(e) {
			return response.status(400).send({admin: 'must be int'});
		}
	}

	// Default password to random hash.
	pw = pw || hash().substring(1, 15);

	let sqlResp;
	try {
		sqlResp = await db.run(`
			INSERT INTO users (username, pw_salt, password_hash, created_by, admin)
			VALUES (?,?,?,?,?)`,
			username, salt, pw, creator, admin);
	} catch(e) {
		// console.warn('USER UPDATE ERROR:', e);
		return response.status(400)
			.send({username: 'already taken'});
	}

	if (invite) {
		site.pendingInvites.del(request.body.invite);
	}
	//TODO: create invite permissions.

	response.send({
		id: sqlResp.stmt.lastID,
		admin: parseInt(admin) || 0,
		username: request.body.username,
		password: pw,
		requires_reset: true,
	});
}

async function read(request, response) {
	const user = await checkCookie(request, response);
	if (request.params.username === 'me')
		request.params.username = user.username;
	if (!user.has(Perms.ADMIN) &&
		request.params.username !== user.username) {
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
		WHERE username = ? AND deleted_at IS NULL`,
		request.params.username);

	if (!usr.id) {
		return response.status(404).end();
	}
	response.send({
		id: usr.id,
		doors: JSON.parse(usr.doors) || [],
		admin: usr.admin || 0,
		username: usr.username,
		// TODO: formalize permission
		password: (user.has(Perms.ADMIN) &&
			!usr.pw_salt && usr.password_hash) || undefined,
		requires_reset: !usr.pw_salt,
	});
}

async function update(request, response) {
	const user = await checkCookie(request, response);
	if (!user.has(Perms.SUPERUSER) && (
		request.body.password && request.body.password.length < 8)) {
		return response.status(400)
			.send({password: 'must be at least 8 characters'});
	}

	// console.log("Update_USER", user, request.params.username, user.username)
	const sameUser = (user.username.toLowerCase() ===
		request.params.username.toLowerCase());
	if (!sameUser && !user.has(Perms.ADMIN)) {
		return response.status(403)
			.send({error: 'can only update your own info'});
	}
	if (!sameUser && request.body.keycode !== undefined) {
		return response.status(403)
			.send({keycode: 'can only update your own keycode'});
	}
	if (request.body.admin !== undefined) {
		if (sameUser) {
			return response.status(403)
				.send({admin: "can't make yourself admin"});
		}
		const currentAdmin = (await db.get(`
			SELECT admin FROM users
			WHERE username = ? AND deleted_at IS NULL`,
			request.params.username)).admin || 0;
		if (!user.has(currentAdmin ^ request.body.admin)) {
			return response.status(403)
				.send({admin: "can't change permissions you don't have"});
		}
	}

	const values = {};
	for (const k of ['keycode', 'admin']) {
		if (request.body[k] !== undefined)
			values[k] = request.body[k];
	}

	if (!sameUser && request.body.password !== undefined) {
		values.pw_salt = null;
		if (request.body.password) {
			values.password_hash = request.body.password;
		} else {
			values.password_hash = hash().substring(1, 15);
		}
	} else if (request.body.password) {
		if (user.pw_salt && (!request.body.current_password ||
							hash(request.body.current_password, user.pw_salt)
								!== user.password_hash)) {
			return response.status(400)
				.send({current_password: 'incorrect password'});
		}
		values.pw_salt = hash();
		values.password_hash = hash(request.body.password, values.pw_salt);
	}

	try {
		await db.update('users', values,
			'username = ? AND deleted_at IS NULL',
			request.params.username);
	} catch(e) {
		console.log('USER UPDATE ERROR:', e);
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
		WHERE username = ? AND deleted_at IS NULL`,
		request.params.username);

	response.send({
		id: usr.id,
		doors: JSON.parse(usr.doors) || [],
		admin: usr.admin || 0,
		username: usr.username,
		password: user.admin && !usr.pw_salt && usr.password_hash || undefined,
		requires_reset: !usr.pw_salt,
	});
}

async function remove(request, response) {
	const user = await checkCookie(request, response);
	if (!user.has(Perms.ADMIN)) {
		return response.status(403).send({error: 'must be admin'});
	}

	const r = await db.run(`
		UPDATE users SET deleted_at = CURRENT_TIMESTAMP, session_cookie = NULL
		WHERE username = ? AND deleted_at IS NULL`,
		request.params.username);

	response.status(r.stmt.changes? 204 : 404).end();
}

async function logs(request, response) {
	const user = await checkCookie(request, response);
	const sameUser = (user.username.toLowerCase() ===
		request.params.username.toLowerCase());
	if (!sameUser && !user.has(Perms.ADMIN)) {
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
		WHERE users.username = ? AND deleted_at IS NULL
			AND entry_logs.id < COALESCE(?, 9e999)
		ORDER BY entry_logs.id DESC LIMIT ?`,
		request.params.username, lastID, 50);

	response.send(logs);
}

// Hashing helper for passwords
function hash(input, salt) {
	//TODO: hardfork to pbkdf2Sync
	return crypto.createHash('sha256', salt)
		.update(input || Math.random().toString())
		.digest('hex');
}
