// UserPanel

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
					<form>
						<table>
							<tr rv-show="user:admin">
								<td>Admin</td>
							</tr>
							<tr>
								<td>Password</td>
								<td class="form-inline">
									<input rv-type="pwType" placeholder="hidden"
										name="password" class="form-control"
										rv-value="user:password" autocomplete="new-password">
									<input rv-if="showCurrent" type="password"
										name="current_password" class="form-control"
										placeholder="current password" autocomplete="current-password">
									<button rv-show="self:admin" rv-disabled="me"
										class="btn btn-default fa fa-random password"></button>
									<span rv-show="user:requires_reset" class="fa fa-warning text-danger">
										requires reset</span>
									<input placeholder="username" type="hidden" name="username"
										rv-value="user:username" autocomplete="username">
								</td>
							</tr>
							<tr rv-show="me">
								<td>Keycode</td>
								<td class="form-inline">
									<input name="keycode" min="0" max="99999999"
										placeholder="hidden" class="form-control"
										rv-value="user.keycode" type="number">
									<span>(8 digits, so 1 becomes 00000001)</span>
								</td>
							</tr>
						</table>
					</form>
				</div>
				<div class="panel-footer">
					<input type="submit" value="Update" class="update btn btn-default">
					<span rv-text="updateSuccess"></span>
					<span class="text-danger" rv-text="updateError"></span>
					<a rv-show="me" class="btn btn-default pull-right logout">logout</a>
					<span rv-show="self:admin">
						<a rv-hide="me" class="btn btn-danger delete pull-right">
						Delete</a>
					</span>
				</div>
			</div>
		</div>

		<div class="doors panel panel-default" rv-hide="user:admin">
			<div class="panel-heading" data-toggle="collapse" data-target=".doors .panel-collapse">
				<div class="panel-title">Doors</div>
			</div>
			<div class="panel-collapse collapse in">
				<div class="panel-body">
					<div rv-each-door="doors">
						<a rv-show="door:allowed" rv-data-id="door:id" rv-class-deny="self:admin">
							<span rv-text="door:name"></span>
							<span class="fa fa-check-circle"></span>
						</a>
						<a rv-hide="door:allowed" rv-data-id="door:id" rv-class-permit="self:admin">
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
			<div class="panel-collapse collapse" rv-class-in="logs.length |gt 50">
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
		'click .fa-random.password': 'scramblePassword',
		'click .logout': 'logout',
		'click .delete': 'delUser',
		'click .permit': 'permit',
		'click .deny': 'deny',
		'click .logs .toggle': 'toggleLogs',
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
			url: '/api/v1/doors',
		}))();
		this.doors.fetch();

		this.logs = new (Backbone.Collection.extend({
			hasMore: true,
			url: function() {
				const lastID = this.models.length &&
					this.models[this.models.length-1].id || '';
				return '/api/v1/users/'+username+'/logs?last_id='+lastID;
			},
		}))();
		this.moreLogs();

		const me = this.user.id === Doorbot.User.id;
		this.scope = {
			me,
			user: this.user,
			logs: this.logs,
			doors: this.doors,
			self: Doorbot.User,
			pwType: me ? 'password': 'text',
			showCurrent: !this.user.get('requires_reset') && me,
		};

		//TODO: render should not be nessicary
		this.logs.on('sync', _.bind(this.render, this));
		this.user.on('sync', _.bind(this.dingleDoors, this));
		this.doors.on('sync', _.bind(this.dingleDoors, this));
	},
	render: function() {
		if (Doorbot.Router.args[0] !== this.user.get('username'))
			return this.initialize();
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
	toggleLogs: function() {
		this.logs.open = !this.logs.open;
	},
	moreLogs: function() {
		this.logs.fetch({ add: true, remove: false,
			success: _.bind(function(coll, newLogs) {
				if (newLogs.length < 50)
					this.logs.hasMore = false;
			}, this),
		});
	},
	logout: function() {
		Doorbot.User.logout();
	},
	update: function(e) {
		e.preventDefault();
		const data = this.$('form').serializeObject();
		if (data.password === '')
			data.password = undefined;
		if (data.keycode === '')
			data.keycode = undefined;
		else
			this.user.keycode = data.keycode.toString().padStart(8, '0');
		this.scope.updateError = null;
		this.scope.updateSuccess = null;

		this.user.save(data, {patch: true, wait: true,
			success: () => {
				//console.log("YAY!", arguments)
				this.scope.updateSuccess = 'Saved';
			},
			error: (m, e) => {
				//console.log("ERROR!", e)
				this.scope.updateError = e.responseText;
			},
		});
	},
	scramblePassword: function(e) {
		e.preventDefault();
		if (confirm('Are you sure you want to scramble the password for: '
								+this.user.get('username')+'?')) {
			this.scope.updateError = null;
			this.scope.updateSuccess = null;
			this.user.save({password: false}, {patch: true, wait: true,
				success: function() {
					//console.log("YAY!", arguments)
					this.scope.updateSuccess = 'Saved';
				},
			});
		}
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
	delUser: function() {
		if (confirm('Are you sure you want to delete '+
			this.user.get('username')+'?')) {
			this.user.destroy();
			Doorbot.Router.navigate('/admin', {trigger: true});
		}
	},
});
