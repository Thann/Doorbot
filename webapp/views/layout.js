// Layout - The parent view of the whole app, and also the router.

require('styles/layout.css');

var UserModel = require('models/user.js');

module.exports = Backbone.View.extend({
	el: 'body',
	template: `
		<div data-subview="header"></div>
		<div class="main-bar">
			<div data-subview="sidebar"></div>
			<div class="main-panel">...</div>
		</div>
		<div class="footer hidden"></div>
	`,
	loading: true,
	mainTemplate: '<div data-subview="main"></div>',
	userTemplate: '<div data-subview="user"></div>',
	doorTemplate: '<div data-subview="door"></div>',
	loginTemplate: '<div data-subview="login"></div>',
	events: {
		'click #Header .toggle-left-sidebar': function() {
			this.subviews.sidebar.toggle();
		},
	},
	subviewCreators: {
		main: function() { return new Doorbot.Views.MainPanel(); },
		user: function() { return new Doorbot.Views.UserPanel(); },
		// door: function() { return new Doorbot.Views.DoorPanel(); },
		login: function() { return new Doorbot.Views.LoginPanel(); },
		header: function() { return new Doorbot.Views.Header(); },
		sidebar: function() { return new Doorbot.Views.Sidebar(); },
	},
	initialize: function() {
		var layout = this;
		var loading = true;
		Backbone.Subviews.add( this );

		Doorbot.Router = new (Backbone.Router.extend({
			routes: {
				"": "mainTemplate",
				"login": "loginTemplate",
				"user/:id": "userTemplate",
				"door/:id": "doorTemplate",
			},
			execute: function(cb, args, name) {
				this.args = args;
				if (!layout.loading && !Doorbot.User.isAuthed) {
					this.navigate('login', {trigger: true});
				} else if (!Doorbot.Router.name && layout[name]) {
					layout.render(layout[name]);
				} else {
					// route not found
					Backbone.Router.prototype.execute.apply(this, arguments);
				}
			}
		}))();

		Doorbot.User = new UserModel();
		Doorbot.User.on('relog', function(logged_in) {
			if (logged_in) {
				layout.render();
			} else {
				Doorbot.Router.navigate('login', {trigger: false});
				layout.render(layout.loginTemplate);
			}
		});

		this.setTitle();
		Backbone.history.start();
		Doorbot.User.init();
	},
	setTitle: function() {
		document.title = 'Doorbot - '+(Doorbot.AppConfig.OrgName||'');
	},
	render: function(tmpl){
		this.$el.html(this.template);
		if (tmpl) this._current_template = tmpl;
		if (!this.loading) {
			this.$('.main-panel').html(this._current_template);
		}
		this.loading = false;
		return this;
	},
});
