// User - stores user information in the browser.

const UserModel = Backbone.Model.extend({
	isAuthed: false,
	urlRoot: 'users/',
	idAttribute: 'username',
	init: function() {
		this.on('sync', function(m) {
			console.log("USR SYNC!", m)
			this.isAuthed = true;
			this.trigger('relog', true);
			window.localStorage.setItem('Doorbot_LatestUser', m.get('username'));
		});

		if(typeof(Storage) !== "undefined") {
			var username = window.localStorage.getItem('Doorbot_LatestUser');
			if (username) {
				// Check if logged in by calling API
				this.set('username', username);
				this.fetch({error: function(model) {
					model.trigger('relog', false);
				}});
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
				self.fetch();
				// 	{success: function() {
				// }});
			},
			error: function(model, response, options) {
				self.trigger('login_error');
				if (error_callback) error_callback();
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
			success: function() {
				console.log("SUCCESS!")
				self.trigger('relog', false);
			},
			error: function() {
				console.log("FAIL!!", arguments)
				self.isAuthed = false;
				self.clear({silent: true});
				self.trigger('relog', false);
			}
		});
	}
});
module.exports = UserModel;
