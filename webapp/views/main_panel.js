// MainPanel

require('../styles/main_panel.css');

module.exports = Backbone.View.extend({
	id: 'MainPanel',
	className: 'container flex',
	template: _.template(`
		<div class="row">
			<div class="col-md-6"></div>
			<div class="col-md-6">
					balance: <%- user.attributes.balance %>
			</div>
		</div>
		<div class="row">
			<div class="col-md-6">
				add funds:
				//TOOD: QRCODE: user.btc_address
				//TOOD: Coinbase: user.coinbase_auth
			</div>
		</div>
		<div class="row">
			<% for (const door of doors) { %>
				<div class="col-md-12">
					<% if (door.available) { %>
						<button data-id="<%- door.id %>" class="btn btn-light open-door">
							<%- door.get('name') %>
						</button>
					<% } %>
				</div>
			<% } %>
		</div>
	`),
	events: {
		'click .open-door': 'openDoor',
	},
	initialize: function() {
		this.user = App.User;
		this.hasAvail = true;
		this.doors = new (Backbone.Collection.extend({
			url: '/api/v1/doors',
		}))();
		this.doors.on('sync', _.bind(function() {
			//TODO: render should not be nessicary
			this.hasAvail = Boolean(this.doors.findWhere({available: true})),
			this.render();
		}, this));
		this.doors.fetch();
	},
	openDoor: function(e) {
		const target = this.$(e.currentTarget);
		const door = this.doors.find({id: target.data('id')});
		door.sync(null, this, {
			url: door.url()+'/open',
			method: 'POST',
			success: function() {
				target.addClass('opened');
				setTimeout(function() {
					target.removeClass('opened');
				}, 1500);
			},
		});
	},
});
