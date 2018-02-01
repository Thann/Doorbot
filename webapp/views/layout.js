// Layout - The parent view of the whole app, and also the router.

require('styles/layout.css');

const UserModel = require('models/user.js');

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
	// doorTemplate: '<div data-subview="door"></div>',
	adminTemplate: '<div data-subview="admin"></div>',
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
		admin: function() { return new Doorbot.Views.AdminPanel(); },
		login: function() { return new Doorbot.Views.LoginPanel(); },
		header: function() { return new Doorbot.Views.Header(); },
		sidebar: function() { return new Doorbot.Views.Sidebar(); },
	},
	initialize: function() {
		const layout = this;
		this.loading = true;
		Backbone.Subviews.add( this );

		Doorbot.Router = new (Backbone.Router.extend({
			routes: {
				'': 'mainTemplate',
				'login': 'loginTemplate',
				'admin': 'adminTemplate',
				'user/:id': 'userTemplate',
				// 'door/:id': 'doorTemplate',
				'*notFound': '',
			},
			execute: function(cb, args, name) {
				this.args = args;
				if (!layout.loading && !Doorbot.User.isAuthed) {
					this.navigate('login', {trigger: true});
				} else if (!Doorbot.Router.name && layout[name]) {
					layout.render(layout[name]);
				} else {
					// route not found
					this.navigate('', {trigger: true});
				}
			},
		}))();

		Doorbot.User = new UserModel();
		Doorbot.User.on('relog', function(loggedIn) {
			if (loggedIn) {
				layout.render();
			} else {
				Doorbot.Router.navigate('login', {trigger: false});
				layout.render(layout.loginTemplate);
			}
		});

		Doorbot.Settings = new (Backbone.Model.extend({
			url: '/api/v1/site/settings',
		}))();
		Doorbot.Settings.fetch();
		// Fetch on user sync?

		this.setTitle();
		Backbone.history.start();
		Doorbot.User.init();
	},
	setTitle: function() {
		document.title = 'Doorbot '+(
			Doorbot.AppConfig.OrgName? ' - '+Doorbot.AppConfig.OrgName : '');
	},
	render: function(tmpl) {
		this.$el.html(this.template);
		if (tmpl)
			this._current_template = tmpl;
		if (!this.loading) {
			this.$('.main-panel').html(this._current_template);
		}
		this.loading = false;
		return this;
	},
});
