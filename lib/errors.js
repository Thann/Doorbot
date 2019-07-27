'use strict';

class AuthError extends Error {
	constructor() {
		super();
		this.code = 401;
	}
}
// TODO: implement handler
class UserError extends Error {
	constructor(message, code) {
		super();
		this.code = code || 400;
		this.message = message;
	}
}
class HandledError extends Error {}
class ProgrammerError extends Error {}

module.exports = {
	AuthError, UserError, HandledError, ProgrammerError,
};
