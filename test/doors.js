const server = require('../server');
const agent = require('supertest').agent(server);

describe('Doors API', function() {
	before(async function() {
		await server.ready;
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

});