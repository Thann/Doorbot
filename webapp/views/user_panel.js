// UserPanel

// require('styles/user.css');

module.exports = Backbone.View.extend({
	id: 'UserPanel',
	template: `
		<div>
			<span rv-text="user:username"></span>
			<span rv-text="user:password"></span>
			<span rv-text="user:doors"></span>
			<button class="btn btn-default update-user">Update</button>
		</div>
	`,
	events: {
		'click new': 'update',
	},
	initialize: function() {
		console.log("UUU", arguments)
		// if ()
		// this.user =
	},
	render: function(){
		this.scope = {
			user: Doorbot.User,
		};
		this.$el.html(this.template);
		Rivets.bind(this.$el, this.scope);
		return this;
	},
	update: function() {
		//TODO:
		console.log("NOT IMPLEMENTED")
	}
});
