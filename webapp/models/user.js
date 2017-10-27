// User - stores user information in the browser.

const UserModel = Backbone.Model.extend({
	isAuthed: false,
	urlRoot: 'users/',
	idAttribute: 'username',
	init: function() {
		this.on('sync', function(m) {
			this.isAuthed = true;
			this.trigger('relog', true);
			if (this.redir) {
				this.redir = false;
				Doorbot.Router.navigate('', {trigger: true});
			}
			window.localStorage.setItem('Doorbot_LatestUser', m.get('username'));
		});

		if(typeof(Storage) !== "undefined") {
			var username = window.localStorage.getItem('Doorbot_LatestUser');
			if (username) {
				// Check if logged in by calling API
				this.set('username', username, {trigger: false});
				this.fetch();
			} else {
				this.trigger('relog', false);
			}
		} else {
			console.error("Sorry! No Web Storage support..");
		}

		$(document).ajaxError(_.bind(function(e, r) {
			if (r.status == 401) {
				this.isAuthed = false;
				this.trigger('relog', false);
			}
		}, this));
	},
	login: function(username, password, error_callback) {
		var self = this;
		(new (Backbone.Model.extend({
			url: 'auth'
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
				if (error_callback) error_callback(model, response, options);
			}
		});
	},
	logout: function() {
		console.log("logging out..", this);
		var self = this;
		var m = new Backbone.Model()
		m.sync(null, m, {
			url: 'auth',
			method: 'DELETE',
			error: function() {
				self.isAuthed = false;
				self.clear({silent: true});
				self.trigger('relog', false);
			}
		});
	}
});
module.exports = UserModel;
