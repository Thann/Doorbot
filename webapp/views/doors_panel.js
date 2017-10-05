// DoorsPanel

// require('styles/doors_panel.css');

module.exports = Backbone.View.extend({
	id: 'DoorsPanel',
	template: `
		<div rv-each-door="doors">
			ima door!
		</div>
	`,
	events: {
		// 'submit form': 'login'
	},
	initalize: function() {
		this.doors = new (Backbone.Collection.extend({
			url: 'doors'
		}))();
	},
	render: function(){
		this.scope = {doors: this.doors};
		this.$el.html(this.template);
		Rivets.bind(this.$el, {scope: this.scope});
		return this;
	},
});
