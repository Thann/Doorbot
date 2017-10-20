const server = require('../server');
const request = require('supertest');

describe('Doors API', function() {
	before(function(done) {
		request(server)
			.post('/auth', {username: 'admin', password: 'admin'})
			.expect(200, done);
	});

	it('create', function(done) {
		request(server)
			.post('/doors', {name: 'main'})
			.expect(200, done);
	});
});