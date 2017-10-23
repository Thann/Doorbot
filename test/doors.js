const db = require('../lib/db');
const server = require('../server');
const agent = require('supertest').agent(server);

describe('Doors API', function() {
	before(async function() {
		await db.reset();
		await agent.post('/auth')
			.send({username: 'admin', password: 'admin'})
			.expect(200);
	});

	it('create', async function() {
		await agent.post('/doors')
			.send({name: 'main'})
			.expect(200, {
				id: 1,
				name: 'main',
				token: /\w+/
			});
	});

	it('read', async function() {
		await agent.get('/doors/1')
			.expect(200, {
				id: 1,
				name: 'main',
				token: /\w+/
			});
	});

	it('index', async function() {
		await agent.get('/doors')
			.expect(200, [{
				id: 1,
				name: 'main',
				token: /\w+/
			}]);
	});

	it('update', async function() {
		await agent.patch('/doors/1')
			.expect(400, {name: 'required'});
		await agent.patch('/doors/1')
			.send({name: 'front'})
			.expect(200, {
				id: 1,
				name: 'front',
				// token: /\w+/
			});
	});

	it('delete', async function() {
		await agent.post('/doors')
			.send({name: 'delete_me'})
			.expect(200, {
				id: 2,
				name: 'delete_me',
				token: /\w+/,
			});
		await agent.delete('/doors/2')
			.expect(200);
		await agent.delete('/users/missing')
			.expect(404);
	});

	it('open', async function() {
		await agent.post('/doors/1/open')
			.expect(503);
		//TODO: mock connection...
		// await agent.ws()
	});

	it('logs', async function() {
		//TODO: add entries
		await agent.get('/doors/1/logs')
			.expect(200, []);
		await agent.get('/doors/1/logs')
			.expect(200, []);
	});

	describe('as an under-privileged user', function() {
		before('auth', async function() {
			await agent.post('/users')
				.send({username: 'door_dummy'})
				.expect(200);
			await agent.patch('/users/door_dummy')
				.send({password: 'door_dummy'})
				.expect(200);
			await agent.post('/doors/1/permit/door_dummy')
				.expect(200)
			await agent.post('/doors')
				.send({name: 'back'})
				.expect(200)
			await agent.post('/auth')
				.send({username: 'door_dummy', password: 'door_dummy'})
				.expect(200);
		});

		it('create', async function() {
			await agent.post('/doors')
				.send({name: 'bad'})
				.expect(403)
		});

		it('read', async function() {
			await agent.get('/doors/1')
				.expect(200, {
					id: 1,
					name: 'front',
				});
			await agent.get('/doors/2')
				.expect(404)
		});

		it('update', async function() {
			await agent.patch('/doors/1')
				.expect(400, {name: 'required'});
			await agent.patch('/doors/1')
				.send({name: 'bad'})
				.expect(403);
			await agent.patch('/doors/2')
				.send({name: 'bad'})
				.expect(403);
		});

		it('delete', async function() {
			// await agent.post('/doors')
			// 	.send({name: 'delete_me'})
			// 	.expect(200, {
			// 		id: 2,
			// 		name: 'delete_me',
			// 		token: /\w+/,
			// 	});
			await agent.delete('/doors/1')
				.expect(403);
			await agent.delete('/users/missing')
				.expect(403);
		});

		it('open', async function() {
			await agent.post('/doors/1/open')
				.expect(422);
			//TODO: mock connection...
			// await agent.ws()
		});

		it('logs', async function() {
			await agent.get('/doors/1/logs')
				.expect(403);
		});
	});
});