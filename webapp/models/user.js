// User - stores user information in the browser.

const UserModel = Backbone.Model.extend({
	isAuthed: false,
	urlRoot: '/api/v1/users',
	idAttribute: 'username',
	init: function() {
		this.on('sync', function(m) {
			this.isAuthed = true;
			this.trigger('relog', true);
			if (this.redir) {
				this.redir = false;
				Doorbot.Router.navigate('', {trigger: true});
			}
		});

		this.set('username', 'me', {trigger: false});
		this.fetch({error: function(m, r) {
			if (r.status === 403)
				m.trigger('relog', false);
		}});

		Backbone.$(document).ajaxError(_.bind(function(e, r) {
			if (r.status === 401) {
				this.isAuthed = false;
				this.clear({silent: true});
				//TODO: clear doesn't actually change the attributes =/
				this.attributes = {};
				this.trigger('relog', false);
			}
		}, this));
	},
	login: function(username, password, errorCallback) {
		const self = this;
		(new (Backbone.Model.extend({
			url: '/api/v1/auth',
		}))({
			username: username,
			password: password,
		})).save(undefined, {
			success: function(model, response, options) {
				self.set('username', model.get('username'), {silent: true});
				self.redir = model.get('requires_reset') !== true;
				self.fetch();
			},
			error: function(model, response, options) {
				self.trigger('login_error');
				if (errorCallback)
					errorCallback(model, response, options);
			},
		});
	},
	logout: function() {
		console.log('logging out..', this);
		const m = new Backbone.Model();
		m.sync(null, m, {
			url: '/api/v1/auth',
			method: 'DELETE',
			success: _.bind(function() {
				this.isAuthed = false;
				this.clear({silent: true});
				//TODO: clear doesn't actually change the attributes =/
				this.attributes = {};
				this.trigger('relog', false);
			}, this),
		});
	},
});
module.exports = UserModel;
