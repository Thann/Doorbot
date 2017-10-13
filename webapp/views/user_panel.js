// UserPanel

// require('styles/user.css');
var UserModel = require('models/user.js');

module.exports = Backbone.View.extend({
	id: 'UserPanel',
	template: `
		<div>
			<span rv-text="user:username"></span>
			<span rv-text="user:password"></span>
			<span rv-text="user:doors"></span>
			<button class="btn btn-default update-user">Update</button>

			<br>
			<button rv-hide="logs.length" class="fetch">Fetch Logs</button>
			<div rv-each-log="logs">
				<span rv-text="log:door"></span>
				<span rv-text="log:time"></span>
			</div>
		</div>
	`,
	events: {
		'click .fetch': 'fetch',
		'click .update': 'update',
	},
	initialize: function() {
		// console.log("UUU", Doorbot.Router.args, Doorbot.User.get('username'))
		var username = Doorbot.Router.args[0];
		if (username == Doorbot.User.get('username')) {
			this.user = Doorbot.User;
		} else {
			this.user = new UserModel({username: username});
		}

		// this.doors =
		this.logs = new (Backbone.Collection.extend({
			url: 'users/'+username+'/logs',
		}))();

		//TODO: render should not be nessicary
		this.logs.on('sync', _.bind(this.render, this));
		this.user.on('sync', _.bind(this.render, this));
	},
	render: function(){
		this.scope = {
			user: this.user,
			logs: this.logs,
		};
		this.$el.html(this.template);
		Rivets.bind(this.$el, this.scope);
		return this;
	},
	fetch: function() {
		this.logs.fetch();
	},
	update: function() {
		//TODO:
		console.log("NOT IMPLEMENTED")
	}
});
