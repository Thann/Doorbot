'use strict';

const db = require('../lib/db');
const server = require('../server');
const agent = require('supertest').agent(server);
const site = require('../api/site');

describe('Site API', function() {
	before(async function() {
		await db.reset();
		await agent.post('/auth')
			.send({username: 'admin', password: 'admin'})
			.expect(200);
	});

	it('invites', async function() {
		await agent.get('/site/invites')
			.expect(200, []);
		await agent.post('/site/invites')
			.expect(200, {
				token: /\w{64}/,
				admin_id: 1,
				permissions: [],
			});
		await agent.get('/site/invites')
			.expect(200, [{
				token: /\w{64}/,
				admin_id: 1,
				permissions: [],
			}]);
		await agent.delete('/site/invites/invalid')
			.expect(204);
		await agent.get('/site/invites')
			.expect(200, [{
				token: /\w{64}/,
				admin_id: 1,
				permissions: [],
			}]);
		const token = (await agent.get('/site/invites')).body[0].token;
		await agent.delete('/site/invites/'+token)
			.expect(204);
		await agent.get('/site/invites')
			.expect(200, []);
	});

	it('settings', async function() {
		await agent.get('/site/settings')
			.expect(200, site.publicSettings);
		await agent.get('/site/settings')
			.expect(200, {
				org_name: null,
			});
		await agent.patch('/site/settings')
			.send({org_name: 'noobs'})
			.expect(200, {
				org_name: 'noobs',
			});
		await agent.patch('/site/settings')
			.send({})
			.expect(200, {
				org_name: 'noobs',
			});
		await agent.get('/site/settings')
			.expect(200, {
				org_name: 'noobs',
			});
		await agent.patch('/site/settings')
			.send({org_name: null})
			.expect(200, {
				org_name: null,
			});
		await agent.get('/site/settings')
			.expect(200, {
				org_name: null,
			});
	});

	it('private_settings', async function() {
		await agent.get('/site/private_settings')
			.expect(200, site.privateSettings);
		await agent.get('/site/private_settings')
			.expect(200, {
				auth_attempts_per_hour: 15,
			});
		await agent.patch('/site/private_settings')
			.send({missing_key: 'bad'})
			.expect(200, {
				auth_attempts_per_hour: 15,
			});
		await agent.get('/site/private_settings')
			.expect(200, {
				auth_attempts_per_hour: 15,
			});
		await agent.patch('/site/private_settings')
			.send({auth_attempts_per_hour: null})
			.expect(200, {
				auth_attempts_per_hour: 0,
			});
		await agent.patch('/site/private_settings')
			.send({auth_attempts_per_hour: '10'})
			.expect(200, {
				auth_attempts_per_hour: 10,
			});
		await agent.get('/site/private_settings')
			.expect(200, {
				auth_attempts_per_hour: 10,
			});
	});

	describe('as an under-privileged user', function() {
		before(async function() {
			await agent.post('/users')
				.send({username: 'dummy', password: 'dummy'})
				.expect(200);
			await agent.post('/auth')
				.send({username: 'dummy', password: 'dummy'})
				.expect(200);
		});

		it('invites', async function() {
			await agent.get('/site/invites')
				.expect(403, {error: 'must be admin'});
			await agent.post('/site/invites')
				.expect(403, {error: 'must be admin'});
		});

		it('settings', async function() {
			await agent.get('/site/settings')
				.expect(200, site.publicSettings);
			await agent.get('/site/settings')
				.expect(200, {
					org_name: null,
				});
			await agent.patch('/site/settings')
				.send({org_name: 'noobs'})
				.expect(403, {error: 'must be admin'});
		});

		it('private_settings', async function() {
			await agent.get('/site/private_settings')
				.expect(403, {error: 'must be admin'});
			await agent.patch('/site/private_settings')
				.send({org_name: 'noobs'})
				.expect(403, {error: 'must be admin'});
		});
	});
});
