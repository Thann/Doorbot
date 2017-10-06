
require('styles/header.css');

module.exports = Backbone.View.extend({
	id: 'Header',
	template: `
		<span>
			<span>Doorbot</span>
			<span rv-if="orgName"><a href="#">{ orgName }</a> / { roomName }</span>
		</span>
	`,
		//<div class="fa fa-bars toggle-left-sidebar"></div>
		//
		// <div data-subview="user_menu"></div>
	// initialize: function() {
	// 	Backbone.Subviews.add( this );
	// },
	// subviewCreators: {
	// 	user_menu: function() { return new Doorbot.Views.UserMenu(); },
	// },
	render: function() {
		this.scope = {
			orgName: Doorbot.AppConfig.OrgName,
		};
		this.$el.html(this.template);
		Rivets.bind(this.$el, this.scope);
		return this;
	},
});
