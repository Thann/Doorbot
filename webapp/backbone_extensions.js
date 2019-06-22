// Enchance Backbone with custom stuff

const { DateTime } = require('luxon');

Object.assign(Backbone.View.prototype, {
	render: function() {
		this.$el.html(this.template(this));
		return this;
	},
	// Luxon helper to convert database timestamps into human-readable strings
	lux: function(time, format) {
		return DateTime
			.fromSQL(time, {zone: 'UTC'})
			.setZone('local')
			.toLocaleString(
				format && DateTime[format] || DateTime.DATETIME_FULL);
	},
});
