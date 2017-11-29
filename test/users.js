'use strict';

const db = require('../lib/db');
const server = require('../server');
const agent = require('supertest').agent(server);

describe('Users API', function() {
	before(async function() {
		await db.reset();
	});

	it('auth', async function() {
		await agent.post('/auth')
			.send({username: 'admin', password: 'bad'})
			.expect(400, {error: 'incorrect username or password'});
		await agent.post('/auth')
			.send({username: 'missing', password: 'bad'})
			.expect(400, {error: 'incorrect username or password'});
		await agent.delete('/auth')
			.expect('set-cookie', 'Session=; HttpOnly')
			.expect(401, {error: 'session cookie malformed'});
		await agent.delete('/auth')
			.expect('set-cookie', 'Session=; HttpOnly')
			.expect(401, {});
		await agent.post('/auth')
			.send({username: 'admin', password: 'admin'})
			.expect('set-cookie', /^Session=\w+; HttpOnly; Max-Age=\d+$/)
			.expect(200, {
				id: 1,
				username: 'admin',
				last_login: null,
				requires_reset: true,
			});
		await agent.post('/auth')
			.send({username: 'admin', password: 'admin'})
			.expect('set-cookie', /^Session=\w+; HttpOnly; Max-Age=\d+$/)
			.expect(200, {
				id: 1,
				username: 'admin',
				last_login: /\w+/,
				requires_reset: true,
			});
	});

	it('create', async function() {
		await agent.post('/users')
			.send({username: 'Dummy'})
			.expect(200, {
				id: 2,
				admin: false,
				password: /\w{14}/,
				username: 'Dummy',
				requires_reset: true,
			});
		await agent.delete('/users/Dummy').expect(204);
		await agent.post('/users')
			.send({username: 'Dummy', password: 'dumb'})
			.expect(200, {
				id: 2,
				admin: false,
				password: 'dumb',
				username: 'Dummy',
				requires_reset: true,
			});
		await agent.post('/users')
			.send({username: 'Dummy', password: 'dumb'})
			.expect(400, {username: 'already taken'});
	});

	it('read', async function() {
		await agent.get('/users/admin')
			.expect(200, {
				id: 1,
				doors: [],
				admin: true,
				password: 'admin',
				username: 'admin',
				requires_reset: true,
			});
		await agent.get('/users/Dummy')
			.expect(200, {
				id: 2,
				doors: [],
				admin: false,
				password: /\w+/,
				username: 'Dummy',
				requires_reset: true,
			});
		await agent.get('/users/missing')
			.expect(404);
		// permissions
		await agent.post('/doors').send({name: 'main'});
		await agent.post('/doors').send({name: 'rear'});
		await agent.post('/doors/1/permit/admin').expect(200);
		await agent.post('/doors/1/permit/Dummy')
			.send({constraints: 'ip:192.168.1.1/30'}).expect(200);
		await agent.post('/doors/2/permit/Dummy').expect(200);
		await agent.get('/users/admin')
			.expect(200, {
				id: 1,
				doors: [{
					'id': 1,
					'name': 'main',
					'creation': /.+/,
					'expiration': '',
					'constraints': '',
				}],
				admin: true,
				password: 'admin',
				username: 'admin',
				requires_reset: true,
			});
		await agent.get('/users/Dummy')
			.expect(200, {
				id: 2,
				doors: [{
					'id': 1,
					'name': 'main',
					'creation': /.+/,
					'expiration': '',
					'constraints': 'ip:192.168.1.1/30',
				}, {
					'id': 2,
					'name': 'rear',
					'creation': /.+/,
					'expiration': '',
					'constraints': '',
				}],
				admin: false,
				password: /\w+/,
				username: 'Dummy',
				requires_reset: true,
			});
		await agent.delete('/doors/1/permit/admin').expect(204);
		await agent.delete('/doors/1/permit/Dummy').expect(204);
		await agent.delete('/doors/2/permit/Dummy').expect(204);
	});

	it('index', async function() {
		await agent.get('/users')
			.expect(200, [{
				id: 1,
				doors: [],
				admin: true,
				password: 'admin',
				username: 'admin',
				requires_reset: true,
			}, {
				id: 2,
				doors: [],
				admin: false,
				password: /\w+/,
				username: 'Dummy',
				requires_reset: true,
			}]);
		// permissions
		await agent.post('/doors/1/permit/admin').expect(200);
		await agent.post('/doors/1/permit/Dummy')
			.send({constraints: 'ip:192.168.1.1/30'}).expect(200);
		await agent.post('/doors/2/permit/Dummy').expect(200);
		await agent.get('/users')
			.expect(200, [{
				id: 1,
				doors: [{
					'id': 1,
					'name': 'main',
					'creation': /\w+/,
					'expiration': '',
					'constraints': '',
				}],
				admin: true,
				password: 'admin',
				username: 'admin',
				requires_reset: true,
			}, {
				id: 2,
				doors: [{
					'id': 1,
					'name': 'main',
					'creation': /\w+/,
					'expiration': '',
					'constraints': 'ip:192.168.1.1/30',
				}, {
					'id': 2,
					'name': 'rear',
					'creation': /\w+/,
					'expiration': '',
					'constraints': '',
				}],
				admin: false,
				password: /\w+/,
				username: 'Dummy',
				requires_reset: true,
			}]);
		await agent.delete('/doors/1/permit/admin').expect(204);
		await agent.delete('/doors/1/permit/Dummy').expect(204);
		await agent.delete('/doors/2/permit/Dummy').expect(204);
	});

	it('update', async function() {
		await agent.patch('/users/Dummy')
			.send({password: 'dummy'})
			.expect(200, {
				id: 2,
				doors: [],
				admin: false,
				username: 'Dummy',
				password: 'dummy',
				requires_reset: true,
			});
		await agent.patch('/users/admin')
			.send({password: 'admin'})
			.expect(200, {
				id: 1,
				doors: [],
				admin: true,
				username: 'admin',
				requires_reset: false,
			});
		await agent.get('/users/admin')
			.expect(200, {
				id: 1,
				doors: [],
				admin: true,
				username: 'admin',
				requires_reset: false,
			});
		await agent.patch('/users/admin')
			.send({password: 'admin'})
			.expect(400, {current_password: 'incorrect password'});
		//TODO: fix
		// await agent.patch('/users/admin')
		// 	.send({password: 'admin', current_password: 'admin'})
		// 	.expect(200);
		// permissions
		await agent.post('/doors/1/permit/Dummy')
			.send({constraints: 'ip:192.168.1.1/30'}).expect(200);
		await agent.post('/doors/2/permit/Dummy').expect(200);
		await agent.patch('/users/Dummy')
			.send({password: 'dummy'})
			.expect(200, {
				id: 2,
				doors: [{
					'id': 1,
					'name': 'main',
					'creation': /\w+/,
					'expiration': '',
					'constraints': 'ip:192.168.1.1/30',
				}, {
					'id': 2,
					'name': 'rear',
					'creation': /\w+/,
					'expiration': '',
					'constraints': '',
				}],
				admin: false,
				username: 'Dummy',
				password: 'dummy',
				requires_reset: true,
			});
		await agent.delete('/doors/1/permit/Dummy').expect(204);
		await agent.delete('/doors/2/permit/Dummy').expect(204);
	});

	it('delete', async function() {
		await agent.post('/users')
			.send({username: 'delete_me', password: 'delete_me'})
			.expect(200);
		await agent.post('/doors/1/permit/delete_me').expect(200);
		await agent.post('/auth')
			.send({username: 'delete_me', password: 'delete_me'}).expect(200);
		await agent.patch('/users/delete_me')
			.send({password: 'dummydummy'}).expect(200);
		await agent.post('/doors/1/open').expect(204);
		await agent.post('/auth')
			.send({username: 'admin', password: 'admin'}).expect(200);
		await agent.delete('/users/delete_me')
			.expect(204, '');
		await agent.delete('/users/missing')
			.expect(404);
		await agent.post('/users')
			.send({username: 'delete_me'})
			.expect(200);
		await agent.get('/users/delete_me')
			.expect(200, {
				id: 3,
				doors: [],  // ensure no permissions
				admin: false,
				username: 'delete_me',
				password: /\w{14}/,
				requires_reset: true,
			});
		await agent.get('/users/delete_me/logs')
			.expect(200, []);
	});

	it('logs', async function() {
		await agent.get('/users/admin/logs')
			.expect(200, []);
		await agent.get('/users/Dummy/logs')
			.expect(200, []);
		await agent.post('/doors/1/open')
			.expect(204);
		await agent.get('/users/admin/logs')
			.expect(200, [{
				id: 1,
				door_id: 1,
				user_id: 1,
				door: 'main',
				time: /[\d\-: ]+/,
				method: 'web:::ffff:127.0.0.1',
			}]);
		await agent.post('/doors/1/open').expect(204);
		await agent.get('/users/admin/logs?last_id=2')
			.expect(200, [{
				id: 1,
				door_id: 1,
				user_id: 1,
				door: 'main',
				time: /[\d\-: ]+/,
				method: 'web:::ffff:127.0.0.1',
			}]);
		await agent.get('/users/Dummy/logs')
			.expect(200, []);
	});

	it('logout', async function() {
		await agent.delete('/auth')
			.expect('set-cookie', 'Session=; HttpOnly')
			.expect(204, '');
		await agent.get('/users/admin')
			.expect(401);
		await agent.delete('/auth')
			.expect(401);
	});

	describe('as an under-privileged user', function() {
		before(async function() {
			await agent.post('/auth')
				.send({username: 'admin', password: 'admin'})
				.expect(200);
			await agent.post('/doors/1/permit/Dummy')
				.expect(200);
		});

		it('auth', async function() {
			await agent.post('/auth')
				.send({username: 'Dummy', password: 'dummy'})
				.expect(200);
		});

		it('create', async function() {
			await agent.post('/users')
				.send({username: 'noob'})
				.expect(403, {error: 'must have invite'});
			await agent.post('/users')
				.send({username: 'noob', invite: 'invalid'})
				.expect(400, {error: 'invalid or expired invite'});
			//TODO: with valid token
		});

		it('read', async function() {
			await agent.get('/users/Dummy')
				.expect(200, {
					id: 2,
					doors: [{
						'id': 1,
						'name': 'main',
						'creation': /\w+/,
						'expiration': '',
						'constraints': '',
					}],
					admin: false,
					username: 'Dummy',
					requires_reset: true,
				});
			await agent.get('/users/admin')
				.expect(403);
			await agent.get('/users/missing')
				.expect(403);
		});

		it('index', async function() {
			await agent.get('/users')
				.expect(403);
		});

		it('update', async function() {
			await agent.patch('/users/Dummy')
				.send({password: 'dummy'})
				.expect(400, {password: 'must be at least 8 characters'});
			await agent.patch('/users/Dummy')
				.send({password: 'door_dummy'})
				.expect(200, {
					id: 2,
					doors: [{
						'id': 1,
						'name': 'main',
						'creation': /\w+/,
						'expiration': '',
						'constraints': '',
					}],
					admin: false,
					username: 'Dummy',
					requires_reset: false,
				});
			await agent.get('/users/Dummy')
				.expect(200, {
					id: 2,
					doors: [{
						'id': 1,
						'name': 'main',
						'creation': /\w+/,
						'expiration': '',
						'constraints': '',
					}],
					admin: false,
					username: 'Dummy',
					requires_reset: false,
				});
		});

		it('delete', async function() {
			await agent.delete('/users/Dummy')
				.expect(403);
			await agent.delete('/users/admin')
				.expect(403);
			await agent.delete('/users/missing')
				.expect(403);
		});

		it('logs', async function() {
			await agent.get('/users/admin/logs')
				.expect(403);
			await agent.get('/users/Dummy/logs')
				.expect(200, []);
			await agent.post('/doors/1/open')
				.expect(204);
			await agent.get('/users/Dummy/logs')
				.expect(200, [{
					id: 3,
					door_id: 1,
					user_id: 2,
					door: 'main',
					time: /[\d\-: ]+/,
					method: 'web:::ffff:127.0.0.1',
				}]);
		});

		it('logout', async function() {
			await agent.delete('/auth')
				.expect(204, '');
			await agent.get('/users/Dummy')
				.expect(401);
			await agent.delete('/auth')
				.expect(401);
		});
	});
});
