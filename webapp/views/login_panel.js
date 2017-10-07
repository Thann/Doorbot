// LoginPanel

require('styles/login_panel.css');

module.exports = Backbone.View.extend({
	id: 'LoginPanel',
	template: `<h2>Welcome To Doorbot <span rv-if="OrgName"> for { OrgName }</span>!</h2>
		<h4>
			An <a href="https://github.com/thann/doorbot" target="_blank" rel="nofollow">open source</a>
			door-opening platform that respects your privacy and freedom!
		</h4>
		It's a simple user-management platform that uses a raspberry pi for opening doors and logging entry.
		<br>
		For help getting started see <a href="#">the wiki</a>
		<br><br>
		<form rv-hide="user.isAuthed" action="auth" class="login">
			<input placeholder="username" type="text", name="username">
			<input placeholder="password" type="password", name="password">
			<input type="submit" value="Login">
		</form>
		<div rv-value="errors"></div>

		<form rv-show="user.isAuthed" action="auth" class="change">
			<div rv-show="user.attributes.requires_reset">
				Your password was set by an admin and requires a reset!
			</div>
			Reset Password
			<input placeholder="username" type="hidden", name="username" rv-value="user.attributes.username">
			<input placeholder="password" type="password", name="password">
			<input type="submit" value="Change">
		</form>
		<button rv-show="user.isAuthed" class="btn btn-default logout">logout</button>
	`,
	events: {
		'submit form.login': 'login',
		'submit form.change': 'changePW',
		'click .logout': 'logout',
	},
	render: function(){
		console.log("RENDER USR", Doorbot.User.isAuthed)
		this.scope = {user: Doorbot.User};
		this.$el.html(this.template);
		Rivets.bind(this.$el, this.scope);
		return this;
	},
	login: function(evt) {
		evt.preventDefault();
		Doorbot.User.login(
			this.$('.login input[name="username"]')[0].value,
			this.$('.login input[name="password"]')[0].value,
			_.bind(function() { // on error
				this.scope.error = 'incorrect username or password';
			}, this)
		);
	},
	logout: function() {
		Doorbot.User.logout();
	},
	changePW: function(evt) {
		evt.preventDefault();
		console.log("PP",this.$('.change input[name="password"]')[0].value)
		Doorbot.User.save({
			password: this.$('.change input[name="password"]')[0].value,
		}, {
			patch: true
		});
	},
});
