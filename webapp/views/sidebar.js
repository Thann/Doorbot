// Sidebar

require('styles/sidebar.css');

module.exports = Backbone.View.extend({
	id: 'Sidebar',
	template: `
		SideBar
	`,
	render: function() {
		this.$el.html(this.template);
		return this;
	},
	toggle: function(bool) {
		this.$el.toggleClass("open", bool);
	}
});
