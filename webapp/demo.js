// Poison Backbone models & collections to sync mock data

module.exports = require('./main');
const Perms = require('../lib/permissions');

const Users = [
	{
		id: 1,
		admin: Perms.ADMIN,
		username: 'DemoAdmin',
	}, {
		id: 2,
		admin: Perms.NOOB,
		username: 'lacky',
		services: [
			{id: 1, type: 'door', name: 'Front Door'},
			{id: 2, type: 'door', name: 'Back Door'},
		],
	}, {
		id: 3,
		admin: Perms.NOOB,
		services: [
			{id: 1, type: 'door', name: 'Front Door'},
		],
		username: 'newb',
		password: '77bcc639bb33e4',
		requires_reset: true,
	},
];

const MockData = {
	'site/settings': {
		app_name: null,
		org_name: 'DemoOrg',
		require_invites: true,
	},
	'site/private_settings': {
		auth_attempts_per_hour: 15,
	},
	'site/secrets': {
		coinbase_key: '*****',
	},
	'users/me': Users[0],
	'doors': [
		{
			id: 1,
			name: 'Front Door',
			// token: '',
			available: true,
		}, {
			id: 2,
			name: 'Back Door',
			token: 'c56b323a155abeffdd0ca77e6916198b53e874493e85c78388ce35e3688322cc',
			available: false,
		},
	],
	'doors/1/open': {},
	'users': Users,
	'users/DemoAdmin': Users[0],
	'DemoAdmin/logs?last_id=': [
		{
			id: 3,
			user_id: 1,
			service: {
				id: 1,
				type: 'door',
				name: 'Front Door',
			},
			note: 'web:10.1.1.101',
			time: '2018-11-01 01:45:02',
		},{
			id: 2,
			user_id: 1,
			service: {
				id: 1,
				type: 'door',
				name: 'Front Door',
			},
			note: 'web:10.1.1.101',
			time: '2018-10-23 20:38:17',
		},
	],
	'users/lacky': Users[1],
	'lacky/logs?last_id=': [
		{
			id: 5,
			user_id: 2,
			service: {
				id: 1,
				type: 'door',
				name: 'Front Door',
			},
			note: 'web:10.1.1.101',
			time: '2018-10-23 20:38:17',
		},
	],
	'users/newb': Users[2],
	'logs?last_id=': [],
	'invites': [{
		admin_id: 1,
		admin_username: 'admin',
		date: '2018-11-03 05:10:27',
		permissions: [],
		token: '3cefc4a12177fb70e41615ca96b6e3c0ec5f69f6104927a186dcca1ed919588c',
	}],
};

const sync = Backbone.sync;
Backbone.sync = function(method, model, options) {
	const url = options.url || (_.isFunction(this.url)? this.url() : this.url);
	for (const [key, value] of Object.entries(MockData)) {
		if (url.endsWith(key)) {
			console.log('DEMO: Mocking data for', url, value);
			this.set(value);
			this.trigger('sync', this);
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
