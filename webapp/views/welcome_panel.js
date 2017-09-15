// WelcomePanel

require('styles/welcome_panel.css');

var UserService = require('utils/user_service.js');

module.exports = Backbone.View.extend({
	id: 'WelcomePanel',
	template: `<h2>Welcome To Doorbot <span rv-if="scope.OrgName"> for { scope.OrgName }</span>!</h2>
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
	`,
	events: {
		// 'keyup input': 'login'
		'submit form': 'login'
	},
	initialize: function() {
		var x = (new (Backbone.Model.extend({
			url: 'users/admin'
		}))).fetch()
	},
	render: function(){
		this.scope = {};
		this.$el.html(this.template);
		Rivets.bind(this.$el, {scope: this.scope});

		return this;
	},
	login: function(evt) {
		console.log("Keyup", this.$('input[name="username"]'))
		evt.preventDefault();
		// if (evt.keyCode == 13){
			var x = (new (Backbone.Model.extend({
				url: 'auth'
			}))({
				username: this.$('input[name="username"]')[0].value,
				password: this.$('input[name="password"]')[0].value,
			}))
			console.log('XXX', x)
			x.save()
		// }

	}
});
