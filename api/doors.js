// REST API for doors.

const db = require('../lib/db');
const crypto = require('crypto');
const error = require('../lib/errors');
const helpers = require('../lib/helpers');
const expressWs = require('express-ws');
const DOOR_SOCKETS = {};

module.exports = function(app) {
	var wsApp = expressWs(app);
	app.   get("/doors", index);
	app.  post("/doors", create);
	app.   get("/doors/:id", read);
	app. patch("/doors/:id", update);
	app.delete("/doors/:id", del_door);
	app.   get("/doors/:id/logs", logs);
	app.  post("/doors/:id/open", open);
	app.    ws("/doors/:id/connect", connect);
	app.  post("/doors/:id/permit/:username", permit);
	app.delete("/doors/:id/permit/:username", deny);
}

async function index(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (user.admin) {
		var doors = await db.all("SELECT * FROM doors");
	} else {
		var doors = await db.all(`
			SELECT doors.* FROM doors
			INNER JOIN permissions ON doors.id = permissions.door_id
			WHERE permissions.user_id = ?`,
			user.id);
	}

	const door_l = [];
	for (const door of doors) {
		door_l.push({
			id: door.id,
			name: door.name,
			token: user.admin ? door.token : undefined,
			available: DOOR_SOCKETS[door.id] && DOOR_SOCKETS[door.id].readyState == 1,
		});
	}
	response.send(door_l);
}

async function create(request, response) {
	if (!request.body.name) {
		return response.status(400).send({name: 'required'});
	}

	const user = await helpers.check_cookie(request, response);
	if (!user.admin) {
		return response.status(403).send({error: 'must be admin'});
	}

	const token = crypto.createHash("sha256")
		.update(Math.random().toString()).digest('hex');
	try {
		var r = await db.run("INSERT INTO doors (name, token) VALUES (?,?)",
			request.body.name, token);
	} catch(e) {
		return response.status(400).send({name: 'already taken'});
	}

	response.send({
		id: r.stmt.lastID,
		name: request.body.name,
		token: token,
	});
}

async function read(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (user.admin) {
		var door = await db.get(
			"SELECT * FROM doors WHERE id = ?", request.params.id);
	} else {
		var door = await db.get(`
			SELECT doors.* FROM doors
			INNER JOIN permissions ON doors.id = permissions.door_id
			WHERE permissions.user_id = ? AND doors.id = ?`,
			user.id, request.params.id);
	}

	if (!door) {
		return response.status(404).end();
	}

	response.send({
		id: door.id,
		name: door.name,
		token: user.admin ? door.token : undefined,
	});
}

async function update(request, response) {
	if (!request.body.name) {
		return response.status(400).send({name: 'required'});
	}

	const user = await helpers.check_cookie(request, response);
	if (!user.admin) {
		return response.status(403).send({error: 'must be admin'});
	}

	try {
		var r = await db.run("UPDATE doors SET name = ? WHERE id = ?",
			request.body.name, request.params.id);
	} catch(e) {
		return response.status(400).send({error: 'DB update error'});
	}

	const door = await db.get(
		"SELECT * FROM doors WHERE id = ?", request.params.id);
	response.send({
		id: door.id,
		name: door.name,
	});
}

async function del_door(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (!user.admin) {
		return response.status(403).send({error: 'must be admin'});
	}
	const r = await db.run("DELETE FROM doors WHERE id = ?", request.params.id);
	response.status(r.stmt.changes? 200 : 404).end();
}

async function logs(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (!user.admin) {
		return response.status(403).send({error: 'must be admin'});
	}
	try {
		var page = parseInt(request.params.page||1)-1;
	} catch(e) {
		return response.status(400).send({page: 'must be an int'});
	}
	const logs = await db.all(`
		SELECT entry_logs.*, users.username FROM entry_logs
		INNER JOIN users ON entry_logs.user_id = users.id
		WHERE door_id = ? ORDER BY entry_logs.id DESC LIMIT ? OFFSET ?`,
		request.params.id, 50, page*50);

	response.send(logs);
}

async function open(request, response) {
	const user = await helpers.check_cookie(request, response);
	if (!user.admin) {
		if (!user.pw_salt) {
			return response.status(422).send({error:
				'your password has been set by an admin and requires reset'});
		}

		const perm = await db.get(`
			SELECT * FROM permissions
			WHERE door_id = ? AND user_id = ?`,
			request.params.id, user.id);

		if (!perm) {
			return response.status(403).send({error:
				'you dont have permissions to open this door.'});
		}
	}

	//TODO: x-forwarded
	const method = "web:"+request.connection.remoteAddress;

	//TODO: check constraints
	try {
		// open the door
		if (process.env.NODE_ENV != 'test')
			DOOR_SOCKETS[request.params.id].send('open');
	} catch(e) {
		console.warn("ERROR: could not open door:", e);
		return response.status(503).send({error: 'door could not be opened'});
	}

	await db.run("INSERT INTO entry_logs (user_id, door_id, method) VALUES (?,?,?)",
		user.id, request.params.id, method);

	response.status(200).end();
}

async function connect(ws, request, next) {
	if (!request.headers.authorization) {
		return ws.close(1007, "no token");
	}
	const door = await db.get("SELECT * FROM doors WHERE id = ? AND token = ?",
		request.params.id, request.headers.authorization);

	if (!door) {
		return ws.close(1007, "bad token");
	}

	DOOR_SOCKETS[request.params.id] = ws;
}

async function permit(request, response) {
	const user = await helpers.check_cookie(request, response)
	if (!user.admin) {
		return response.status(403).send({error: 'must be admin'});
	}

	const door = await db.get("SELECT * FROM doors WHERE id = ?",
		request.params.id);
	if (!door) {
		return response.status(404).send({error: "door doesn't exist"});
	}

	try {
		//TOOD: add constraints, created, expiration
		var r = await db.run(`
			INSERT INTO permissions (user_id, door_id)
			SELECT users.id , ? FROM users WHERE username = ?`,
			request.params.id, request.params.username);
	} catch(e) {
		return response.status(409).send({error: 'door already permits user'});
	}
	if (!r.changes) {
		return response.status(404).send({error: "user doesn't exist"});
	}

	response.status(200).end();
}

async function deny(request, response) {
	const user = await helpers.check_cookie(request, response)
	if (!user.admin) {
		return response.status(403).send({error: 'must be admin'});
	}

	const r = await db.run(`
		DELETE FROM permissions WHERE door_id = ? AND user_id IN
		( SELECT id FROM users WHERE username = ? )`,
		request.params.id, request.params.username);

	if (!r.stmt.changes) {
		response.status(404).send({error: "door doesn't permit user"});
	} else {
		response.status(200).end();
	}
}
