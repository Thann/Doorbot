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
				'': 'main',
				'login': 'login',
				'admin': 'admin',
				'user/:id': 'user',
				// 'door/:id': 'door',
				'*notFound': 'main',
			},
			unauthRoutes: ['login'],
			execute: function(cb, args, name) {
				this.args = args;
				if (!layout.loading && !App.User.isAuthed
						&& !this.lastRouteUnauthed()) {
					this.navigate('login', {trigger: true});
				} else if (!App.Router.name
						&& layout.subviewCreators[name]) {
					this.lastRoute = name;
					layout.render(name);
				} else {
					// route not found
					this.navigate('', {trigger: true});
				}
			},
			lastRouteUnauthed: function() {
				return this.unauthRoutes.indexOf(this.lastRoute) >= 0;
			},
		}))();

		App.User = new UserModel();
		this.listenTo(App.User, 'relog', function(loggedIn) {
			if (loggedIn || App.Router.lastRouteUnauthed()) {
				layout.render();
			} else {
				App.Router.navigate('login', {trigger: false});
				layout.render('login');
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
		document.title = 'Portalbot '+(
			App.AppConfig.OrgName? ' - '+App.AppConfig.OrgName : '');
	},
	render: function(tmpl) {
		this.$el.html(this.template);
		if (tmpl)
			this._current_template = `<div data-subview="${tmpl}"></div>`;
		if (!this.loading) {
			this.$('.main-panel').html(this._current_template);
		}
		this.loading = false;
		return this;
	},
});
