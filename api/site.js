// Settings
'use strict';

// const fs = require('fs');
// const users = require('./users');
// const helpers = require('../lib/helpers');

module.exports = function(app) {
	app.   get('/invite', inviteUser);
	app.   get('/settings', readSettings);
	app. patch('/settings', updateSettings);
	app.   get('/private_settings', readPrivateSettings);
	app. patch('/private_settings', updatePrivateSettings);
};

// === Default Settings ===

const publicSettings = {

};

const privateSettings = {
	auth_attempts_per_hour: 15,  // per username
};

const loadSettings = function() {
	//TODO:
	// const settingsFile = fs.readSync('../db/site_settings.json');
	// require('../db/site_settings.json');
};
loadSettings();
module.exports.publicSettings = publicSettings;
module.exports.privateSettings = privateSettings;

async function inviteUser(request, response) {
	// const user = await users.checkCookie(request, response);
}

async function readSettings(request, response) {

}

async function updateSettings(request, response) {
	// const user = await users.checkCookie(request, response);
}

async function readPrivateSettings(request, response) {

}

async function updatePrivateSettings(request, response) {
	// const user = await users.checkCookie(request, response);
}
