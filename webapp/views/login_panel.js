// LoginPanel

require('styles/login_panel.css');

module.exports = Backbone.View.extend({
	id: 'LoginPanel',
	className: 'container',
	template: `<h2>Welcome to Doorbot <span rv-if="OrgName"> for { OrgName }</span>!</h2>
		<h4>
			An <a href="https://github.com/Thann/Doorbot" target="_blank" rel="nofollow">open source</a>
			door-opening platform that respects your privacy and freedom!
		</h4>
		<p>
			It's a simple user-management platform that uses a raspberry pi for opening doors and logging entry.
		<br>
			For help getting started see the
			<a href="https://github.com/Thann/Doorbot/blob/master/README.md" target="_blank">readme</a>.
		</p>

		<br>
		<form rv-hide="user.isAuthed" action="auth" class="login form-inline">
			<div class="form-group">
				<input placeholder="username" type="text" name="username"
					class="form-control" autocomplete="username">
			</div> <div class="form-group">
				<input placeholder="password" type="password" name="password"
					class="form-control" autocomplete="current-password">
			</div>
			<input type="submit" value="Login" class="btn btn-default">
		</form>
		<div rv-hide="user.isAuthed" class="form-group has-error">
			<span class="control-label">{ error }</span>
		</div>

		<p rv-show="user.attributes.requires_reset" class="bold">
			Your password was set by an admin and requires a reset!
		</p>
		<form rv-show="user.attributes.requires_reset" action="auth" class="change form-inline">
			<div class="form-group">
				<input placeholder="username" type="hidden" name="username"
					rv-value="user.attributes.username" autocomplete="username">
			</div> <div class="form-group">
				<input placeholder="new password" type="password" name="password"
					class="form-control" autocomplete="new-password">
			</div>
			<div class="form-group has-error">
				<span class="control-label">{ error }</span>
			</div>
			<input type="submit" value="Reset Password" class="btn btn-default">
		</form>

		<a rv-show="user.isAuthed" class="btn btn-default" href="#">Doors</a>
		<a rv-show="user.isAuthed" class="btn btn-default logout">Logout</a>
		<a rv-show="user.isAuthed" class="btn btn-default"
			rv-href="'#user/'|+ user:username">
			User Settings
		</a>
	`,
	events: {
		'submit form.login': 'login',
		'submit form.change': 'changePW',
		'click .logout': 'logout',
	},
	render: function() {
		this.scope = {user: Doorbot.User};
		this.$el.html(this.template);
		Rivets.bind(this.$el, this.scope);
		return this;
	},
	login: function(evt) {
		evt.preventDefault();
		this.scope.error = null;
		Doorbot.User.login(
			this.$('.login input[name="username"]')[0].value,
			this.$('.login input[name="password"]')[0].value,
			_.bind(function() { // on error
				this.scope.error = 'incorrect username or password (case sensitive)';
			}, this)
		);
	},
	logout: function() {
		Doorbot.User.logout();
	},
	changePW: function(evt) {
		evt.preventDefault();
		this.scope.error = null;
		// console.log('PP',this.$('.change input[name="password"]')[0].value);
		Doorbot.User.save({
			password: this.$('.change input[name="password"]')[0].value,
		}, {
			patch: true,
			success: function(m) {
				m.set({'password': undefined}, {trigger: false});
				Doorbot.Router.navigate('', {trigger: true});
			}, error: (m, e) => {
				this.scope.error = (e.responseJSON.password ||
					e.responseJSON.error);
			},
		});
	},
});
