const db = require('../lib/db');
const server = require('../server');
const agent = require('supertest').agent(server);

describe('Users API', function() {
	before(async function() { await db.reset(); });

	it('auth', async function() {
		await agent.post('/auth')
			.send({username: 'admin', password: 'admin'})
			.expect('set-cookie', /^Session=\w+; HttpOnly; Max-Age=\d+$/)
			.expect(200);
	});

	it('create', async function() {
		await agent.post('/users')
			.send({username: 'Dummy'})
			.expect(200, {
				id: 2,
				admin: false,
				password: /\w+/,
				username: 'Dummy',
				requires_reset: true,
			});
	});

	it('read', async function() {
		await agent.get('/users/admin')
			.expect(200, {
				id: 1,
				doors: null,
				admin: true,
				password: 'admin',
				username: 'admin',
				requires_reset: true,
			});
		await agent.get('/users/Dummy')
			.expect(200, {
				id: 2,
				doors: null,
				admin: false,
				password: /\w+/,
				username: 'Dummy',
				requires_reset: true,
			});
		await agent.get('/users/missing')
			.expect(404)

	});

	it('update', async function() {
		await agent.patch('/users/Dummy')
			.send({password: 'dummy'})
			.expect(200, {
				id: 2,
				doors: null,
				admin: false,
				username: 'Dummy',
				password: 'dummy',
				requires_reset: true,
			});
		await agent.patch('/users/admin')
			.send({password: 'admin'})
			.expect(200, {
				id: 1,
				doors: null,
				admin: true,
				username: 'admin',
				requires_reset: false,
			});
		await agent.get('/users/admin')
			.expect(200, {
				id: 1,
				doors: null,
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
	});

	it('delete', async function() {
		await agent.post('/users')
			.send({username: 'delete_me'})
			.expect(200);
		await agent.delete('/users/delete_me')
			.expect(200);
		await agent.delete('/users/missing')
			.expect(404);
	});

	it('logs', async function() {
		await agent.get('/users/admin/logs')
			.expect(200, []);
		await agent.get('/users/Dummy/logs')
			.expect(200, []);
		await agent.post('/doors')
			.send({name: 'main'})
		await agent.post('/doors/1/open')
			.expect(200);
		await agent.get('/users/admin/logs')
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

	describe('as an under-privileged user', function() {
		it('auth', async function() {
			await agent.post('/doors/1/permit/Dummy')
				.expect(200)
			await agent.post('/auth')
				.send({username: 'Dummy', password: 'dummy'})
				.expect(200);
		});

		it('create', async function() {
			await agent.post('/users')
				.send({username: 'noob'})
				.expect(403);
		});

		it('read', async function() {
			await agent.get('/users/Dummy')
				.expect(200, {
					id: 2,
					doors: '1',
					admin: false,
					username: 'Dummy',
					password: 'dummy',
					requires_reset: true,
				});
			await agent.get('/users/admin')
				.expect(403)
			await agent.get('/users/missing')
				.expect(403)
		});

		it('update', async function() {
			await agent.patch('/users/Dummy')
				.send({password: 'dummy'})
				.expect(400, {password: 'must be at least 8 characters'});
			await agent.patch('/users/Dummy')
				.send({password: 'door_dummy'})
				.expect(200);
		});

		it('delete', async function() {
			await agent.delete('/users/Dummy')
				.expect(403)
			await agent.delete('/users/admin')
				.expect(403)
			await agent.delete('/users/missing')
				.expect(403)
		});

		it('logs', async function() {
			await agent.get('/users/admin/logs')
				.expect(403);
			await agent.get('/users/Dummy/logs')
				.expect(200, []);
			await agent.post('/doors/1/open')
				.expect(200);
			await agent.get('/users/Dummy/logs')
				.expect(200, [{
					id: 2,
					door_id: 1,
					user_id: 2,
					door: 'main',
					time: /[\d\-: ]+/,
					method: 'web:::ffff:127.0.0.1',
				}]);
		});
	});
});