// Layout - The parent view of the whole app, and also the router.

require('styles/layout.css');

module.exports = Backbone.View.extend({
	el: 'body',
	template: `
		<div data-subview="header"></div>
		<div class="main-bar">
			<div data-subview="sidebar"></div>
			<div class="main-panel"></div>
		</div>
		<div class="footer hidden"></div>
	`,
	welcomeTemplate: '<div data-subview="welcome"></div>',
	roomTemplate: '<div data-subview="room"></div>',
	events: {
		'click #Header .toggle-left-sidebar': function() {
			this.subviews.sidebar.toggle();
		},
	},
	subviewCreators: {
		room: function() { return new Doorbot.Views.RoomPanel(); },
		welcome: function() { return new Doorbot.Views.WelcomePanel(); },
		header: function() { return new Doorbot.Views.Header(); },
		sidebar: function() { return new Doorbot.Views.Sidebar(); },
	},
	initialize: function() {
		var self = this;
		Backbone.Subviews.add( this );
		$(window).on('hashchange', function() { self.render(); });
	},
	setTitle: function() {
		document.title = Doorbot.AppConfig.OrgName+' - Doorbot';
	},
	render: function(){
		this.setTitle();
		this.$el.html(this.template);

		// "Router"
		// if (document.location.hash.length === 0) {
			this.$('.main-panel').html(this.welcomeTemplate);
		// } else {
		// 	this.$('.main-panel').html(this.roomTemplate);
		// }

		return this;
	},
});
