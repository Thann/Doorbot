// REST API for doors.

var db = require('../lib/db');
var crypto = require('crypto');
var error = require('../lib/errors');
var helpers = require('../lib/helpers');

module.exports = function(app) {
	app.get("/doors", index);
	app.post("/doors", create);
	app.get("/doors/:id", read);
	app.patch("/doors/:id", update);
	app.delete("/doors/:id", del_door);
	app.post("/doors/:id/open", open);
	app.post("/doors/:id/connect", connect);
	app.post("/doors/:id/permit/:user_id", permit);
}

async function index(request, response) {
	var user = await helpers.check_cookie(request, response)
	if (user.admin) {
		var doors = await db.all("SELECT * FROM doors");
	} else {
		var doors = await db.all("SELECT * FROM doors INNER JOIN permissions on door.id = permissions.door_id WHERE permissions.user_id = ?",
			user.id);
	}

	response.writeHead(200);
	var door_l = [];
	for (const door of doors) {
		door_l.push({
			id: door.id,
			name: door.name,
			token: user.admin ? door.token : null
		});
	}
	response.write(JSON.stringify(door_l));
	response.end();
}

async function create(request, response) {
	if (!request.body.name) {
		response.writeHead(400);
		response.write("name is required.");
		return response.end();
	}

	var user = await helpers.check_cookie(request, response)
	if (!user.admin) {
		response.writeHead(403);
		response.write("Must be admin");
		response.end();
		return;
	}

	var token = crypto.createHash("sha256").update(Math.random().toString()).digest('hex');
	try {
		var resp = await db.run("INSERT INTO doors (name, token) VALUES (?,?)",
			request.body.name, token);
	} catch(e) {
		response.writeHead(400);
		response.write("Door name already used");
		return response.end();
	}

	response.writeHead(200);
	response.write(JSON.stringify({
		id: resp.stmt.lastID,
		name: request.body.name,
		token: token,
	}));
	response.end();
}

async function read(request, response) {
	var user = await helpers.check_cookie(request, response)
	if (request.params.id != user.id) {
		if (user.admin) {
			var door = await db.get("SELECT * FROM doors WHERE id = ?", request.params.id)
		} else {
			response.writeHead(403);
			response.end();
			throw new error.HandledError();
		}
	}

	if (!door) {
		response.writeHead(404);
		return response.end();
	}

	response.writeHead(200);
	response.write(JSON.stringify({
		id: door.id,
		name: door.name,
		token: user.admin ? door.token : null,
	}));
	response.end();
}

async function update(request, response) {
	console.log("BODY:", request.body);
	if (!request.body.name) {
		response.writeHead(400);
		response.write("name is required.");
		return response.end();
	}

	var user = await helpers.check_cookie(request, response, request.params.id)
	console.log("Update_DOOR", user)
	if (!user.admin) {
		response.writeHead(403);
		response.write("Must be admin");
		return response.end();
	}

	try {
		var resp = await db.run("UPDATE doors SET name = ? WHERE id = ?",
			request.body.name, request.params.id);
		console.log("DOOR_UPDATE_DB_RESP:", resp)
	} catch(e) {
		response.writeHead(400);
		response.write("DB update error.");
		return response.end();
	}

	response.writeHead(200);
	response.write(JSON.stringify({
		id: request.params.id,
		name: request.body.name,
		// token: door.token,
	}));
	response.end();
}

async function del_door(request, response) {
	var user = await helpers.check_cookie(request, response)
	if (!user.admin) {
		response.writeHead(403);
		response.write("Must be admin");
		return response.end();
	}
	try {
		await db.run("DELETE doors WHERE id = ?", request.params.id);
	} catch(e) {
		response.writeHead(400); //TODO: 404?
		response.write("DB delete error.");
		return response.end();
	}

	response.writeHead(200);
	response.end();
}

async function open(request, response) {
	var user = await helpers.check_cookie(request, response, request.params.id)
	console.log("permit_DOOR", user)
	if (!user.admin) {
		var perm = await db.get("SELECT * FROM permissions WHERE door_id = ? AND user_id = ?",
			request.params.id, user.id);

		if (!perm) {
			response.writeHead(403);
			response.write("You dont have permissions to open this door.");
			return response.end();
		}
	}

	//TODO: open the door!
	await db.run("INSERT INTO entry_log (user_id, door_id) VALUES (?,?)",
		request.params.id, user.id);

	response.writeHead(200);
	response.end();
}

async function connect(request, response) {
	//TODO: header instead?
	if (!request.body.token) {
		response.writeHead(400);
		response.write("token is required.");
		return response.end();
	}
	var door = await db.get("SELECT * FROM door WHERE id = ? AND token = ?",
		request.params.id, request.body.token);

	if (!door) {
		response.writeHead(404);
		return response.end();
	}

	//TODO: connect the door!

	response.writeHead(200);
	response.end();
}

async function permit(request, response) {
	user = await helpers.check_cookie(request, response, request.params.id)
	console.log("permit_DOOR", user)
	if (!user.admin) {
		response.writeHead(403);
		response.write("Must be admin");
		return response.end();
	}

	try {
		var resp = await db.run("INSERT INTO permissions (door_id, user_id) VALUES (?,?)",
			request.params.id, token.params.user_id);
	} catch(e) {
		response.writeHead(400);
		response.write("Door already permits user.");
		return response.end();
	}

	response.writeHead(200);
	response.write(JSON.stringify({
		name: user.admin,
	}));
	response.end();
}
