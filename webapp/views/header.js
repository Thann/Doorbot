
require('styles/header.css');

module.exports = Backbone.View.extend({
	id: 'Header',
	template: `
		<div class="fa fa-bars toggle-left-sidebar"></div>
		<span>
			<span rv-if="scope.orgName">Doorbot</span>
			<span rv-if="scope.orgName"><a href="#">{ scope.orgName }</a> / { scope.roomName }</span>
		</span>
	`,
		// <div data-subview="user_menu"></div>
	// initialize: function() {
	// 	Backbone.Subviews.add( this );
	// },
	// subviewCreators: {
	// 	user_menu: function() { return new Doorbot.Views.UserMenu(); },
	// },
	render: function() {
		this.scope = {};
		this.scope.orgName = Doorbot.AppConfig.OrgName;

		this.$el.html(this.template);
		Rivets.bind(this.$el, {scope: this.scope});

		return this;
	},
});
