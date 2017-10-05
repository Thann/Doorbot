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
	doorsTemplate: '<div data-subview="doors"></div>',
	loginTemplate: '<div data-subview="login"></div>',
	adminTemplate: '<div data-subview="admin"></div>',
	events: {
		'click #Header .toggle-left-sidebar': function() {
			this.subviews.sidebar.toggle();
		},
	},
	subviewCreators: {
		doors: function() { return new Doorbot.Views.DoorsPanel(); },
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
				layout.render(Doorbot.User.isAuthed ? layout.doorsTemplate : undefined);
			},
			login: function() {
				console.log("LOGN..")
				layout.render(layout.loginTemplate);
			},
			admin: function() {
				console.log("ADMN..")
				layout.render(layout.adminTemplate);
			},
		}))();

		Doorbot.User = new UserModel();
		Doorbot.User.on('relog', function(logged_in) {
			console.log("RELOG!!", logged_in);
			if (logged_in) {
				Doorbot.Router.navigate('', {trigger: true});
			} else {
				Doorbot.Router.navigate('login', {trigger: true});
			}
		});

		// Backbone.history.start({silent: true});
		Backbone.history.start();
		Doorbot.User.init();
	},
	setTitle: function() {
		document.title = Doorbot.AppConfig.OrgName||''+' - Doorbot';
	},
	render: function(tmpl){
		console.log("RRR", tmpl)
		this.setTitle();
		this.$el.html(this.template);
		if (tmpl) this.$('.main-panel').html(tmpl);
		return this;
	},
});
