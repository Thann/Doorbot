// User - stores user information in the browser.

const UserModel = Backbone.Model.extend({
	isAuthed: false,
	urlRoot: 'users/',
	idAttribute: 'username',
	init: function() {
		this.on('sync', function(m) {
			if (!this.isAuthed) {
				this.isAuthed = true;
				this.trigger('relog', true);
			}
		});

		if(typeof(Storage) !== "undefined") {
			var username = window.localStorage.getItem('Doorbot_LatestUser');
			if (username) {
				// Check if logged in by calling API
				this.set('username', username);
				this.fetch();
			} else {
				this.trigger('relog', false);
			}
		} else {
			console.error("Sorry! No Web Storage support..");
		}
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
				self.fetch({success: function() {
					window.localStorage.setItem('Doorbot_LatestUser', username);
				}});
			},
			error: function(model, response, options) {
				self.trigger('login_error');
				if (error_callback) error_callback();
			}
		});
	},
});

module.exports = UserModel;
