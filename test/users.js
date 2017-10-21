const server = require('../server');
const agent = require('supertest').agent(server);

describe('Users API', function() {
	before(async function() { await server.ready; });

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

	it('update', async function() {
		await agent.patch('/users/Dummy')
			.send({password: 'dummy'})
			.expect(200, {
				id: 2,
				//TODO: improve API
				// admin: false,
				// username: 'dummy',
				// password: 'dummy',
				// requires_reset: true,
			});
	});

	it('read', async function() {
		await agent.get('/users/admin')
			.expect(200, {
				id: 1,
				admin: true,
				doors: null,
				username: 'admin',
				password: 'admin',
				requires_reset: true,
			});
		await agent.get('/users/Dummy')
			.expect(200, {
				id: 2,
				admin: false,
				doors: null,
				username: 'Dummy',
				password: 'dummy',
				requires_reset: true,
			});
		await agent.get('/users/missing')
			.expect(404)
	});

	describe('as an under-privileged user', function() {
		before('auth', async function() {
			await agent.post('/auth')
				.send({username: 'Dummy', password: 'dummy'})
				.expect(200);
		});

		it('read', async function() {
			await agent.get('/users/Dummy')
				.expect(200, {
					id: 2,
					admin: false,
					doors: null,
					username: 'Dummy',
					password: 'dummy',
					requires_reset: true,
				});
			await agent.get('/users/admin')
				.expect(403)
			await agent.get('/users/missing')
				.expect(403)
		});

		it('create', async function() {
			await agent.post('/users')
				.send({username: 'noob'})
				.expect(403);
		});

	});
});