// MainPanel
'use strict';

require('styles/main_panel.css');
const Confetti = require('ConfettiCannon');

module.exports = Backbone.View.extend({
	id: 'MainPanel',
	className: 'container flex',
	template: `
		<div rv-each-door="doors" class="row">
			<div class="col-md-12">
				<button
					rv-show="door:available"
					rv-data-id="door:id"
					class="btn btn-default open-door">
						{ door:name }
				</button>
			</div>
		</div>
		<div rv-hide="hasAvail">
			No doors available
		</div>
	`,
	events: {
		'click .open-door': 'openDoor',
	},
	initialize: function() {
		this.hasAvail = true;
		this.doors = new (Backbone.Collection.extend({
			url: 'doors',
		}))();
		this.doors.on('sync', _.bind(function() {
			//TODO: render should not be nessicary
			this.hasAvail = Boolean(this.doors.findWhere({available: true})),
			this.render();
		}, this));
		this.doors.fetch();

		this.confetti = new Confetti(Backbone.$('canvas')[0], true, true);
		Backbone.$(window).on('resize', _.bind(function() {
			this.confetti.setCanvasSize();
		}, this));
		return this;
	},
	render: function() {
		this.scope = {
			doors: this.doors,
			hasAvail: this.hasAvail,
		};
		this.$el.html(this.template);
		Rivets.bind(this.$el, this.scope);
		return this;
	},
	openDoor: function(e) {
		const target = this.$(e.currentTarget);
		const door = this.doors.find({id: target.data('id')});
		door.sync(null, this, {
			url: door.url()+'/open',
			method: 'POST',
			success: _.bind(function() {
				target.addClass('opened');
				setTimeout(function() {
					target.removeClass('opened');
				}, 1500);

				this.confetti.addConfettiParticles(
					50, 223, 2000, e.pageX, e.pageY);
				this.confetti.addConfettiParticles(
					50, 322, 2000, e.pageX, e.pageY);
			}, this),
		});
	},
});
