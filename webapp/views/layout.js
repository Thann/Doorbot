// Layout - The parent view of the whole app, and also the router.

require('../styles/layout.css');

const UserModel = require('../models/user.js');

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
		main: function() { return new App.Views.MainPanel(); },
		user: function() { return new App.Views.UserPanel(); },
		// door: function() { return new App.Views.DoorPanel(); },
		admin: function() { return new App.Views.AdminPanel(); },
		login: function() { return new App.Views.LoginPanel(); },
		header: function() { return new App.Views.Header(); },
		sidebar: function() { return new App.Views.Sidebar(); },
	},
	initialize: function() {
		const layout = this;
		this.loading = true;
		Backbone.Subviews.add( this );

		App.Router = new (Backbone.Router.extend({
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
				if (!layout.loading && !App.User.isAuthed) {
					this.navigate('login', {trigger: true});
				} else if (!App.Router.name && layout[name]) {
					layout.render(layout[name]);
				} else {
					// route not found
					this.navigate('', {trigger: true});
				}
			},
		}))();

		App.User = new UserModel();
		App.User.on('relog', function(loggedIn) {
			if (loggedIn) {
				layout.render();
			} else {
				App.Router.navigate('login', {trigger: false});
				layout.render(layout.loginTemplate);
			}
		});

		App.Settings = new (Backbone.Model.extend({
			url: '/api/v1/site/settings',
		}))();
		App.Settings.fetch();
		// Fetch on user sync?

		this.setTitle();
		Backbone.history.start();
		App.User.init();
	},
	setTitle: function() {
		document.title = 'Doorbot '+(
			App.AppConfig.OrgName? ' - '+App.AppConfig.OrgName : '');
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
