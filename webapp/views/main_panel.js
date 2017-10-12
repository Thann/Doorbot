// MainPanel

// require('styles/main_panel.css');

module.exports = Backbone.View.extend({
	id: 'MainPanel',
	template: `
		Doors:
		<div rv-if="admin" class="doors">
			<form>
				<input rv-show="creatingDoor" type="text" name="name" placeholder="Name" required>
				<input rv-show="creatingDoor" type="submit" class="new btn btn-default">
				<div class="error" rv-text="error"></div>
			</form>
			<button rv-hide="creatingDoor" class="btn btn-default new">New</button>
		</div>

		<div rv-each-door="doors">
			<span rv-text="door:name"></span>
			<button rv-show="door:available" class="btn btn-default open-door" rv-data-id="door:id">open</button>
		</div>

		<br>
		<div rv-if="admin" class="users">
			Users:
			<form>
				<input rv-show="creatingUser" type="text" name="name" placeholder="Name" required>
				<input rv-show="creatingUser" type="submit" class="new btn btn-default">
				<div class="error" rv-text="error"></div>
			</form>
			<button rv-hide="creatingUser" class="btn btn-default new">New</button>

			<div rv-each-user="users">
				<span rv-text="user:username"></span>
				<span rv-text="user:password"></span>
				<span rv-text="user:doors"></span>
				<button class="btn btn-default edit-user" rv-data-id="user:id">Edit</button>
			</div>
		</div>
	`,
	events: {
		'click .doors .new': 'createDoor',
		'click .open-door': 'openDoor',
		'click .users .new': 'createUser',
	},
	initialize: function() {
		this.doors = new (Backbone.Collection.extend({
			url: 'doors',
		}))();
		this.doors.on('sync', _.bind(function() {
			console.log("DOOR SYNC", this.scope)
			if (this.users) { this.users.fetch(); }
			//TODO: render should not be nessicary
			this.render()
		}, this));
		this.doors.fetch();

		if (Doorbot.User.get('admin')) {
			this.users = new (Backbone.Collection.extend({
				url: 'users'
			}))();
			this.users.on('sync', _.bind(function(coll) {
				console.log("USER SYNC", this.scope)
				//TODO: render should not be nessicary
				for (const m of coll.models) {
					console.log("MMM", m)
				}
				this.render()
			}, this));
		}
	},
	render: function(){
		console.log("RENDER MAIN:", Doorbot.User.get('admin'))
		this.scope = {
			doors: this.doors,
			users: this.users,
			admin: Doorbot.User.get('admin'),
		};
		this.$el.html(this.template);
		Rivets.bind(this.$el, this.scope);
		return this;
	},
	createDoor: function(e) {
		if (e) e.preventDefault();
		var self = this;
		console.log("CREEATING DOOR:", this.scope.creatingDoor);
		if (!this.scope.creatingDoor) {
			this.scope.creatingDoor = true;
			self.scope.error = undefined;
		} else {
			this.doors.create({
				name: this.$('.doors form [name="name"]').val()
			}, {wait: true,
				success: function() {
					console.log("DOOR CREATE DONE!", self.doors)
					self.scope.creatingDoor = false;
					// self.render()
				},
				error: function(m, resp) {
					console.warn("DOOR CREATE ERR!", resp.responseText)
					self.scope.error = resp.responseText;
				}
 			});
		}
	},
	openDoor: function(e) {
		var id = $(e.currentTarget).data('id');
		console.log("OPENING DOOR", id)
		var door = this.doors.find({id: $(e.currentTarget).data('id')});
		door.sync(null, this, {url: door.url()+'/open', method: 'POST'});
	},
	deleteDoor: function() {
		this.doors.find({id: $(e.currentTarget).data('id')}).destroy();
	},
	createUser: function(e) {
		if (e) e.preventDefault();
		var self = this;
		if (!this.scope.creatingUser) {
			this.scope.creatingUser= true;
			self.scope.error = undefined;
		} else {
			this.users.create({
				username: this.$('.users form [name="name"]').val()
			}, {wait: true,
				success: function() {
					console.log("DOOR CREATE DONE!", self.doors)
					self.scope.creatingDoor = false;
				},
				error: function(m, resp) {
					console.warn("USER CREATE ERR!", resp.responseText)
					self.scope.error = resp.responseText;
				}
 			});
		}
	},
});
