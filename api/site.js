// Settings
'use strict';

const fs = require('fs');
const path = require('path');
const users = require('./users');
const crypto = require('crypto');
const Perms = require('../lib/permissions');
const MemCache = require('../lib/memcache');

const settingsFile = (process.env.NODE_ENV === 'test' ? null :
	path.join(__dirname, '../db/site_settings.json'));

module.exports = function(app) {
	app.   get('/site/invites', indexInvites);
	app.  post('/site/invites', createInvite);
	app.delete('/site/invites/:token', deleteInvite);
	app.   get('/site/settings', readSettings);
	app. patch('/site/settings', updateSettings);
	app.   get('/site/private_settings', readPrivateSettings);
	app. patch('/site/private_settings', updatePrivateSettings);
	app.   get('/site/secrets', readSecrets);
	app. patch('/site/secrets', updateSecrets);
};

// === Default Settings ===

const publicSettings = {
	// app_name: null,
	org_name: null,
	require_invites: true,
};

const privateSettings = {
	auth_attempts_per_hour: 15,  // per username
};

const secrets = {};

const pendingInvites = new MemCache();

module.exports.pendingInvites = pendingInvites;
module.exports.publicSettings = publicSettings;
module.exports.privateSettings = privateSettings;
module.exports.secrets = secrets;

// === API ===

async function indexInvites(request, response) {
	const user = await users.checkCookie(request, response);
	if (!user.has(Perms.ADMIN)) {
		return response.status(403).send({error: 'must be admin'});
	}

	response.status(200).send(
		pendingInvites.map(function(k, v) {
			return {
				token: k,
				date: v.date,
				admin_id: v.admin_id,
				permissions: v.permissions,
				admin_username: v.admin_username,
			};
		})
	);
}

async function createInvite(request, response) {
	const user = await users.checkCookie(request, response);
	if (!user.has(Perms.ADMIN)) {
		return response.status(403).send({error: 'must be admin'});
	}

	const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
	const token = crypto.createHash('sha256')
		.update(Math.random().toString()).digest('hex');
	pendingInvites.set(token, {
		date,
		admin_id: user.id,
		admin_username: user.username,
		permissions: request.body.permissions || [],
	});

	response.status(200).send({
		date,
		token: token,
		admin_id: user.id,
		admin_username: user.username,
		permissions: request.body.permissions || [],
	});
}

async function deleteInvite(request, response) {
	const user = await users.checkCookie(request, response);
	if (!user.has(Perms.ADMIN)) {
		return response.status(403).send({error: 'must be admin'});
	}

	pendingInvites.del(request.params.token);
	response.status(204).end();
}

async function readSettings(request, response) {
	response.status(200).send(publicSettings);
}

async function updateSettings(request, response) {
	const user = await users.checkCookie(request, response);
	if (!user.has(Perms.ADMIN)) {
		return response.status(403).send({error: 'must be admin'});
	}

	_saveSettings(publicSettings, request.body);
	response.status(200).send(publicSettings);
}

async function readPrivateSettings(request, response) {
	const user = await users.checkCookie(request, response);
	if (!user.has(Perms.ADMIN)) {
		return response.status(403).send({error: 'must be admin'});
	}

	response.status(200).send(privateSettings);
}

async function updatePrivateSettings(request, response) {
	const user = await users.checkCookie(request, response);
	if (!user.has(Perms.ADMIN)) {
		return response.status(403).send({error: 'must be admin'});
	}

	_saveSettings(privateSettings, request.body);
	response.status(200).send(privateSettings);
}

async function readSecrets(request, response) {
	const user = await users.checkCookie(request, response);
	if (!user.has(Perms.ADMIN)) {
		return response.status(403).send({error: 'must be admin'});
	}

	response.status(200).send(_censor(secrets));
}

async function updateSecrets(request, response) {
	const user = await users.checkCookie(request, response);
	if (!user.has(Perms.ADMIN)) {
		return response.status(403).send({error: 'must be admin'});
	}

	_saveSettings(secrets, request.body);
	response.status(200).send(_censor(secrets));
}

// === Helpers ===

function _saveSettings(settings, updates) {
	for (const [k, v] of Object.entries(settings)) {
		let newV = updates[k];
		if (newV !== undefined) {
			switch (typeof v) {
			case 'number':
				newV = Number(newV);
				break;
			//TODO: more typecasting?
			}
			settings[k] = newV;
		}
	}
	if (settingsFile) {
		fs.writeFileSync(settingsFile, JSON.stringify({
			public: publicSettings,
			private: privateSettings,
			secrets: secrets,
		}));
	}
}

function _censor(secrets) {
	const sec = {};
	for (const [k,v] of Object.entries(secrets)) {
		sec[k] = v? '*****' : null;
	}
	return sec;
}

// === Init ===

if (settingsFile && fs.existsSync(settingsFile)) {
	// read file and update vars
	const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
	Object.assign(publicSettings, settings.public);
	Object.assign(privateSettings, settings.private);
}

// init or update settings file
_saveSettings({});
