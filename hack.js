#!/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {stdin, stdout} = process;
const FILE = path.resolve(os.homedir(), 'passwd.json');
// const gpio = require('gpio-bullshit');

const defaultPasswd = new Set([
	'admin'
]);

function readJSON(filename) {
	try {
		const data = fs.readFileSync(filename, 'utf8');
		const arr = JSON.parse(data);
		const set = new Set();
		assert(Array.isArray(arr), 'Passwords must be an array.');
		for (const pass of arr) {
			assert(typeof pass === 'string', 'Password must be a string.');
			set.add(pass);
		}
		return set;
	} catch (e) {
		if (e.code === 'ENOENT')
			return defaultPasswd;
		throw e;
	}
}

let passwd = readJSON(FILE);

stdin.setRawMode(true);
stdin.setEncoding('utf8');

let str = '';

stdin.on('data', (ch) => {
	switch (ch) {
		case '\x03':
		case '\x1b': {
			stdout.write('Quitting...\r\n');
			process.exit(0);
			break;
		}
		case '\r': {
			if (str.length === 0) {
				console.log('Reloading file: %s.', FILE);
				passwd = readJSON(FILE);
				break;
			}
			if (passwd.has(str)) {
				console.log('Keypad password: %s', str);
				// gpio.write(BULLSHIT, str);
			} else {
				console.log('Bad password: %s', str);
			}
			str = '';
			break;
		}
	  default: {
			if (str.length > 255)
				str = '';
		  str += ch;
			break;
		}
	}
});
