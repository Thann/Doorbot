// Sidebar

require('../styles/sidebar.css');

module.exports = Backbone.View.extend({
	id: 'Sidebar',
	template: `
		SideBar
	`,
	toggle: function(bool) {
		this.$el.toggleClass('open', bool);
	},
});
