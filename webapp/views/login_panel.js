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
		<form action="auth">
			<input placeholder="username" type="text", name="username">
			<input placeholder="password" type="password", name="password">
			<input type="submit" value="Login">
		</form>
		<div rv-value="errors"></div>
	`,
	events: {
		'submit form': 'login'
	},
	render: function(){
		this.scope = {};
		this.$el.html(this.template);
		Rivets.bind(this.$el, this.scope);
		return this;
	},
	login: function(evt) {
		evt.preventDefault();
		Doorbot.User.login(
			this.$('input[name="username"]')[0].value,
			this.$('input[name="password"]')[0].value,
			_.bind(function() { // on error
				this.scope.error = 'incorrect username or password';
			}, this)
		);
	}
});
