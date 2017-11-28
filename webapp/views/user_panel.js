// UserPanel
'use strict';

// require('styles/user.css');
const UserModel = require('models/user.js');

module.exports = Backbone.View.extend({
	id: 'UserPanel',
	className: 'container',
	template: `
		<div class="user panel panel-default">
			<div class="panel-heading" data-toggle="collapse" data-target=".user .panel-collapse">
				<div class="panel-title" rv-text="user:username"></div>
			</div>
			<div class="panel-collapse collapse in">
				<div class="panel-body">
					<table>
						<form>
							<tr rv-show="user:admin">
								<td>Admin</td>
							</tr>
							<tr>
								<td>Password</td>
								<td>
									<input rv-value="user:password">
									<button class="btn btn-default fa fa-random"></button>
								</td>
							</tr>
						</form>
					</table>
				</div>
				<div class="panel-footer">
					<input type="submit" value="Update" class="update btn btn-default">
					<div class="error" rv-text="settingsError"></div>
				</div>
			</div>
		</div>

		<div class="doors panel panel-default" rv-hide="user:admin">
			<div class="panel-heading" data-toggle="collapse" data-target=".user .panel-collapse">
				<div class="panel-title">Doors</div>
			</div>
			<div class="panel-collapse collapse in">
				<div class="panel-body">
					<div rv-each-door="doors">
						<a rv-show="door:allowed" rv-data-id="door:id" class="deny">
							<span rv-text="door:name"></span>
							<span class="fa fa-check-circle"></span>
						</a>
						<a rv-hide="door:allowed" rv-data-id="door:id" class="permit">
							<span rv-text="door:name"></span>
							<span class="fa fa-ban"></span>
						</a>
					</div>
				</div>
			</div>
		</div>

		<div class="logs panel panel-default">
			<div class="panel-heading fetch" data-toggle="collapse" data-target=".logs .panel-collapse">
				<div class="panel-title">Logs</div>
			</div>
			<div class="panel-collapse collapse" rv-class-in="logs.length">
				<div class="panel-body">
					<div rv-each-log="logs">
						<span rv-text="log:door"></span> &nbsp;
						<span rv-text="log:time"></span> &nbsp;
						<span rv-text="log:method"></span>
					</div>
				</div>
				<div class="panel-footer">
					<input type="submit" value="More" class="more btn btn-default"
						rv-enabled="logs.hasMore">
					<div class="error" rv-text="logsError"></div>
				</div>
			</div>
		</div>
	`,
	events: {
		'click .update': 'update',
		'click .permit': 'permit',
		'click .deny': 'deny',
		'click .fetch': 'fetch',
		'click .logs .more': 'moreLogs',
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
			url: function() {
				return 'users/'+username+'/logs?last_id='+this.last_id;
			},
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
		if (!this.logs.length) {
			this.logs.fetch();
			this.logs.hasMore = true;
		}
	},
	moreLogs: function() {
		this.logs.last_id = this.logs.models[this.logs.models.length-1].id;
		this.logs.fetch({ add: true, remove: false,
			success: _.bind(function(coll, newLogs) {
				if (newLogs.length < 50)
					this.logs.hasMore = false;
			}, this),
		});
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
