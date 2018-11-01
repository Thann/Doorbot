// Poison Backbone models & collections to sync mock data
module.exports = require('./main');

const MockData = {
	'site/settings': {
		orgName: 'DemoOrg',
	},
	'site/private_settings': {},
	'users/me': {
		id: 'me',
		admin: 1,
		username: 'DemoUser',
	},
	'doors': [
		{
			id:1,
			name: 'Front Door',
			token: 'c56b323a155abeffdd0ca77e6916198b53e874493e85c78388ce35e3688322cc',
			available : true,
		},
	],
	'doors/1/open': {},
	'users': [
		{
			username: 'admin',
		}, {
			username: 'lacky',
			doors: [{id: 1}],
		},
	],
	'DemoUser/logs?last_id=': [
		{
			id: 3,
			user_id: 1,
			door_id: 1,
			method: 'web:10.1.1.101',
			time: '2018-11-01 01:45:02',
			door: 'Front Door',
		},{
			id: 2,
			user_id: 1,
			door_id: 1,
			method: 'web:10.1.1.101',
			time: '2018-10-23 20:38:17',
			door: 'Front Door',
		},
	],
};

const sync = Backbone.sync;
Backbone.sync = function(method, model, options) {
	const url = options.url || (_.isFunction(this.url)? this.url() : this.url);
	for (const [key, value] of Object.entries(MockData)) {
		if (url.endsWith(key)) {
			console.log('DEMO: Mocking data for', url, value);
			this.set(value);
			this.trigger('sync');
			if (options.success)
				setTimeout(() => {
					options.success();
				});
			return this;
		}
	}
	console.warn('DEMO: Failed to find mock data for', url);
	sync.apply(this, arguments);
};
