// UserService - stores user information in the browser.

// require('backbone.localstorage');
const UserModel = Backbone.Model.extend({
	// username:
});

module.exports = {
	init: function() { // sets up the username, and stuff.
		if(typeof(Storage) !== "undefined") {
			// Stores information of the user.
			// this.localUsers = new (Backbone.Collection.extend({
			// 	localStorage: new Backbone.LocalStorage("doorbot_users"),
			// }))();
			// this.localUsers.fetch();
			//
			// this.currentUser = this.localUsers.get(window.localStorage.getItem('RTChat_LatestUser')) ||
			// 	this.localUsers.first();
			//
			// // console.log("found user:", this.currentUser)
			// if (!this.currentUser) { this.create(); }

			// window.localStorage.setItem('DoorBot_LatestUser', this.currentUser.id);

			// Only store info on the latest user
			this.data = new UserModel(window.localStorage.getItem('Doorbot_LatestUser'));
			// if (!this.data) { this.initUser(); }
			console.log("USER DATA: ", this.data)


		} else {
			console.log("Sorry! No Web Storage support..");
		}
	},
	initUser: function(name) {
		this.currentUser = this.localUsers.create({
			name: name || "Guest_"+parseInt(Math.random()*10000).toString()
		});
	},
	login: function() {
		// TODO:
	},
	updateName: function(newName) {
		this.currentUser.name = newName;
		this.currentUser.save();
	},
};

module.exports.init();
