// DoorsPanel

// require('styles/main_panel.css');

module.exports = Backbone.View.extend({
	id: 'MainPanel',
	template: `
		Doors:
		<form class="door">
			<input rv-show="scope.creatingDoor" type="text" name="name" placeholder="Name" required>
			<input rv-show="scope.creatingDoor" type="submit" class="new-door btn btn-default">
		</form>
		<button rv-hide="scope.creatingDoor" class="btn btn-default new-door">New</button>

		<div rv-each-door="doors">
			ima door!
		</div>

		<br>
		Users:
		<button rv-if="admin" class="btn btn-default new-user">New</button>
		<div rv-each-user="users">
			ima user!
		</div>
	`,
	events: {
		'click .new-door': 'createDoor',
		'click .new-user': 'createUser',
	},
	initialize: function() {
		this.doors = new (Backbone.Collection.extend({
			url: 'doors'
		}))();
		console.log("DOORS:", this.doors)
		this.doors.on('add', _.bind(function() {
			console.log("DOOR ADD")
		}, this));
		this.doors.on('sync', _.bind(function() {
			console.log("DOOR SYNC", this)
			//TODO: render should not be nessicary
			this.render()
		}, this));
		this.doors.fetch();
	},
	render: function(){
		console.log("RENDER MAIN:", Doorbot.User.get('admin'))
		this.scope = {
			doors: this.doors,
			admin: Doorbot.User.get('admin'),
		};
		this.$el.html(this.template);
		Rivets.bind(this.$el, this.scope);
		//TODO: users
		return this;
	},
	createDoor: function(e) {
		if (e) e.preventDefault();
		var self = this;
		console.log("CREEATING DOOR:", this.scope.creatingDoor);
		if (!this.scope.creatingDoor) {
			this.scope.creatingDoor = true;
		} else {
			this.doors.create({
				name: this.$('form [name="name"]').val()
			}, {success: function() {
					console.log("DOOR CREATE DONE!", self.doors)
					self.scope.creatingDoor = false;
					// self.render()
				},
				error: function() {
					console.warn("DOOR CREATE ERR!")
				}
 			});
		}
	},
});
