// UserPanel
'use strict';

// require('styles/user.css');
const UserModel = require('models/user.js');

module.exports = Backbone.View.extend({
	id: 'UserPanel',
	className: 'container',
	template: `
		<div>
			<span rv-text="user:username"></span>
			<span rv-text="user:password"></span>
			<button class="btn btn-default update-user">Update</button>

			<br>
			<div rv-hide="user:admin">
				Doors:
				<div rv-each-door="doors">
					<span rv-text="door:name"></span>
					<button rv-hide="door:allowed" rv-data-id="door:id" class="btn btn-default permit">
						Permit
					</span>
					<button rv-show="door:allowed" rv-data-id="door:id" class="btn btn-default deny">
						Deny
					</span>
				</div>
			</div>

			<br>
			<button class="fetch btn btn-default">Fetch Logs</button>
			<div class="logs">
				<div rv-each-log="logs">
					<span rv-text="log:door"></span> &nbsp;
					<span rv-text="log:time"></span> &nbsp;
					<span rv-text="log:method"></span>
				</div>
			</div>
		</div>
	`,
	events: {
		'click .fetch': 'fetch',
		'click .update': 'update',
		'click .permit': 'permit',
		'click .deny': 'deny',
	},
	initialize: function() {
		// console.log("UUU", Doorbot.Router.args, Doorbot.User.get('username'))
		const username = Doorbot.Router.args[0];
		if (username === Doorbot.User.get('username')) {
			this.user = Doorbot.User;
		} else {
			this.user = new UserModel({username: username});
			this.user.fetch({error: function() {
				Doorbot.Router.navigate('', {trigger: true});
			}});
		}

		this.doors = new (Backbone.Collection.extend({
			url: 'doors',
		}))();
		this.doors.fetch();

		this.logs = new (Backbone.Collection.extend({
			url: 'users/'+username+'/logs',
		}))();

		//TODO: render should not be nessicary
		this.logs.on('sync', _.bind(this.render, this));
		this.user.on('sync', _.bind(this.dingleDoors, this));
		this.doors.on('sync', _.bind(this.dingleDoors, this));
	},
	render: function() {
		this.scope = {
			user: this.user,
			logs: this.logs,
			doors: this.doors,
		};
		this.$el.html(this.template);
		//TODO: rivets throws an error because of user?
		Rivets.bind(this.$el, this.scope);
		return this;
	},
	dingleDoors: function() {
		if (!this.user.get('doors'))
			return this.render();
		this.doors.each(_.bind(function(d) {
			if (_.findWhere(this.user.get('doors'), {id: d.id})) {
				d.set('allowed', true);
			}
		}, this));
		this.render();
	},
	fetch: function() {
		this.logs.fetch();
	},
	update: function() {
		//TODO:
		console.log('NOT IMPLEMENTED');
	},
	permit: function(e) {
		const door = this.doors.find({id: this.$(e.currentTarget).data('id')});
		door.sync(null, this, {
			method: 'POST',
			url: door.url()+'/permit/'+this.user.get('username'),
		});
		door.attributes.allowed = true;
		this.render();
	},
	deny: function(e) {
		const door = this.doors.find({id: this.$(e.currentTarget).data('id')});
		door.sync(null, this, {
			method: 'DELETE',
			url: door.url()+'/permit/'+this.user.get('username'),
		});
		door.attributes.allowed = false;
		this.render();
	},
});

/* eslint-env browser */
/* global Doorbot, Backbone, Rivets, _ */
