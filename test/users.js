const server = require('../server');
const request = require('supertest');

describe('Users API', function() {
	it('auth', function(done) {
		request(server)
			.post('/auth', {username: 'admin', password: 'admin'})
			.expect(200, done);
	});
	// it('update', function(done) { });
});