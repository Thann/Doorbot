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
	mainTemplate: '<div data-subview="main"></div>',
	loginTemplate: '<div data-subview="login"></div>',
	adminTemplate: '<div data-subview="admin"></div>',
	events: {
		'click #Header .toggle-left-sidebar': function() {
			this.subviews.sidebar.toggle();
		},
	},
	subviewCreators: {
		main: function() { return new Doorbot.Views.MainPanel(); },
		login: function() { return new Doorbot.Views.LoginPanel(); },
		header: function() { return new Doorbot.Views.Header(); },
		sidebar: function() { return new Doorbot.Views.Sidebar(); },
	},
	initialize: function() {
		var layout = this;
		Backbone.Subviews.add( this );

		Doorbot.Router = new (Backbone.Router.extend({
			routes: {
				"": "default",
				"login": "login",
				"admin": "admin",
			},
			default: function() {
				console.log("RENDER DEFAULT: ", Doorbot.User.isAuthed)
				if (!Doorbot.User.isAuthed) {
					Doorbot.Router.navigate('login', {trigger: true});
				} else {
					layout.render(layout.mainTemplate);
				}
			},
			login: function() {
				console.log("LOGN..")
				layout.render(layout.loginTemplate);
			},
			admin: function() {
				console.log("ADMN..")
				layout.render(layout.adminTemplate);
			},
			execute: function() {
				if (loading) {
					layout.render();
					loading = false;
				} else {
					Backbone.Router.prototype.execute.apply(this, arguments);
				}
			}
		}))();

		Doorbot.User = new UserModel();
		Doorbot.User.on('relog', function(logged_in) {
			console.log("RELOG!!", logged_in);
			if (logged_in) {
				Doorbot.Router.navigate('', {trigger: false});
				Doorbot.Router.default();
				//TODO: remove router?
			} else {
				Doorbot.Router.navigate('login', {trigger: false});
				Doorbot.Router.login();
			}
		});

		var loading = true;
		Backbone.history.start();
		Doorbot.User.init();
	},
	setTitle: function() {
		document.title = 'Doorbot - '+(Doorbot.AppConfig.OrgName||'');
	},
	render: function(tmpl){
		this.setTitle();
		this.$el.html(this.template);
		if (tmpl) this.$('.main-panel').html(tmpl);
		return this;
	},
});
