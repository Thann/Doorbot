// AdminPanel

module.exports = Backbone.View.extend({
	id: 'AdminPanel',
	className: 'container',
	template: _.template(`
		<div class="settings panel panel-default">
			<div class="panel-heading" data-toggle="collapse" data-target=".settings .panel-collapse">
				<div class="panel-title">
					Site Settings:
				</div>
			</div>
			<div class="panel-collapse collapse">
				<div class="panel-body">
					<table>
						<form class="public">
							<% for (const [key, val] of Object.entries(settings.attributes)) { %>
								<tr>
									<td><%- key %></td>
									<td><input value="<%- val %>"></td>
								</tr>
							<% } %>
						</form>
						<form class="private">
							<% for (const [key, val] of Object.entries(privateSettings.attributes)) { %>
								<tr>
									<td><%- key %></td>
									<td><input value="<%- val %>"></td>
								</tr>
							<% } %>
						</form>
					</table>
				</div>
				<div class="panel-footer">
					<input type="submit" value="Update" class="update btn btn-light">
					<div class="error"><%- settingsError %></div>
				</div>
			</div>
		</div>

		<div class="doors panel panel-default">
			<div class="panel-heading" data-toggle="collapse" data-target=".doors .panel-collapse">
				<div class="panel-title">
					Doors:
					<a class="toggle new fa fa-plus"></a>
				</div>
			</div>
			<div class="panel-collapse collapse show">
				<div class="panel-body">
					<% if (creatingDoor) { %>
						<form>
							<input type="text" name="name" placeholder="Name" required>
							<input type="submit" class="new btn btn-light" value="Create">
							<div class="error"><%- doorError %></div>
						</form>
					<% } %>
					<% for (const door of doors.models) { %>
						<div>
							<span><%- door.get('id') %></span>.
							<a href="#door/<%- door.id %>"><%- door.get('name')%></a>
							<% if (door.get('available')) { %>
								<span class="fa fa-check-circle"></span>
							<% } else { %>
								<span><%- door.get('token') %></span>
							<% } %>
						</div>
					<% } %>
				</div>
			</div>
		</div>

		<div class="invites panel panel-default">
			<div class="panel-heading" data-toggle="collapse" data-target=".invites .panel-collapse">
				<div class="panel-title">
					Invites:
					<a class="toggle new fa fa-plus"></a>
				</div>
			</div>
			<div class="panel-collapse collapse" class="<%- showInvites? 'show': '' %>">
				<div class="panel-body">
					<% if (creatingInvite) { %>
						<form>
							#TODO: edit invite permissions
							<div class="error"><%- inviteError %></div>
						</form>
					<% } %>
					<ol>
						<% for (const invite of invites && invites.models || []) { %>
							<li>
								<span><%- invite.get('admin_username') %></span>
								<span><%- lux(invite.get('date'), 'DATETIME_SHORT') %></span>
								<span><%- (invite.get('token')||'').slice(0, 8) %></span>
								<a target="_blank"
									href="<%- inviteMailto + invite.get('token') %>">
									[Send Email]
								</a>
							</li>
						<% } %>
					</ol>
				</div>
			</div>
		</div>

		<div class="users panel panel-default">
			<div class="panel-heading" data-toggle="collapse" data-target=".users .panel-collapse">
				<div class="panel-title">
					Users:
					<a class="toggle new fa fa-plus"></a>
				</div>
			</div>

			<div class="panel-collapse collapse show">
				<div class="panel-body">
					<% if (creatingUser) { %>
						<form>
							<input type="text" name="name" placeholder="Name" required>
							<input type="submit" class="new btn btn-light" value="Create">
							<div class="error"><%- userError %></div>
						</form>
					<% } %>
					<% for (const user of users && users.models || []) { %>
						<div>
							<a href="#user/<%- user.get('username') %>">
								<%- user.get('username') %></a>
							<span><%- user.get('password') %></span>
							<% for (const service of user.get('services') || []) { %>
								<span class="comma"><%- service.name %></span>
							<% } %>
							<% if (user.get('password') && user.id > 1) { %>
								<a target="_blank"
									href="<%- mailto + user.get('username') + ' ' + user.get('password') + mail2%>">
									[Send Email]
								</a>
							<% } %>
						</div>
					<% } %>
				</div>
			</div>
		</div>
	`),
	events: {
		'click .doors .new': 'createDoor',
		'click .users .new': 'createUser',
		'click .invites .new': 'createInvite',
		'click .settings .update': 'updateSettings',
	},
	initialize: function() {
		if (!App.User.has(App.Permissions.ADMIN)) {
			return App.Router.navigate('', {trigger: true});
		}

		this.settings = App.Settings;
		this.doors = new (Backbone.Collection.extend({
			url: '/api/v1/doors',
		}))();

		this.users = new (Backbone.Collection.extend({
			url: '/api/v1/users',
		}))();

		this.privateSettings = new (Backbone.Model.extend({
			url: '/api/v1/site/private_settings',
		}))();

		this.invites = new (Backbone.Collection.extend({
			url: '/api/v1/site/invites',
		}))();

		for (const model of [
			this.doors, this.users, this.privateSettings, this.invites]) {
			this.listenTo(model, 'sync', () => {
				this.render();
			});
		}

		this.users.fetch();
		this.doors.fetch();
		this.invites.fetch();
		this.privateSettings.fetch();
	},
	settingsError: null,
	creatingDoor: null,
	creatingUser: null,
	creatingInvite: null,
	showInvites: null,
	render: function() {
		// console.log("RENDER MAIN:", App.User.get('admin'))
		Object.assign(this, {
			mailto: "mailto:?subject=Doorbot&body=Hey! you've been setup on the door. Visit " +
				window.location.toString().replace(window.location.hash, '') +
				' and sign-in with the username and password:%0D%0A%0D%0A',
			mail2: "   (case-sensitive)%0D%0A%0D%0ADon't forget to update your password =]",
			inviteMailto: "mailto:?subject=Doorbot&body=Hey! you've been invited to Doorbot," +
				' click here to create a user: ' +
				window.location.toString().replace(window.location.hash, '') + '#token/',
		});
		this.$el.html(this.template(this));
		return this;
	},
	createDoor: function(e) {
		if (e) {
			e.preventDefault();
			if (this.$('.doors .panel-collapse.show').length) {
				e.stopPropagation();
			} else if (this.creatingDoor) {
				//TODO: delayFocus?
				setTimeout(_.bind(function() {
					this.$('.doors input[name]').focus();
				}, this));
				return;
			}
		}

		if (this.$(e.currentTarget).hasClass('toggle')) {
			this.creatingDoor = !this.creatingDoor;
			this.doorError = undefined;
			if (this.creatingDoor) {
				setTimeout(() => {
					this.$('.doors input[name]').focus();
				});
			}
		} else {
			// console.log('CREEATING DOOR');
			this.doors.create({
				name: this.$('.doors form [name="name"]').val(),
			}, {wait: true,
				success: _.bind(function() {
					console.log('DOOR CREATE DONE!', this.doors);
					this.creatingDoor = false;
				}, this),
				error: _.bind(function(m, resp) {
					console.warn('DOOR CREATE ERR!', resp.responseText);
					this.doorError = resp.responseText;
				}, this),
			});
		}
	},
	//TODO: door_panel
	// editDoor: function(e) {
	// 	var id = $(e.currentTarget).data('id');
	// 	if (!this.editingDoor) {
	// 		this.editingDoor = id;
	// 		self.error = undefined;
	// 	} else {
	// 		var door = this.doors.find({id: id});
	// 		// door.sync(null, this, {url: door.url()+'/open', method: 'PO
	// 	}
	// },
	// deleteDoor: function(e) {
	// 	this.doors.find({id: this.$(e.currentTarget).data('id')}).destroy();
	// },
	createInvite: function(e) {
		// if (e) {
		// 	e.preventDefault();
		// 	if (this.$('.invites .panel-collapse.in').length) {
		// 		e.stopPropagation();
		// 	} else if (this.creatingInvite) {
		// 		//TODO: delayFocus?
		// 		setTimeout(_.bind(function() {
		// 			this.$('.invites input[name]').focus();
		// 		}, this));
		// 		return;
		// 	}
		// }

		// if (this.$(e.currentTarget).hasClass('toggle')) {
		// 	this.creatingInvite = !this.creatingUser;
		// 	this.inviteError = undefined;
		// 	if (this.creatingInvite) {
		// 		setTimeout(_.bind(function() {
		// 			this.$('.invites input[name]').focus();
		// 		}, this));
		// 	}
		// } else {
		this.invites.create({
			permissions: this.$('.invites form [name="permissions"]').val(),
		}, {wait: true,
			success: _.bind(function() {
				console.log('INVITE CREATE DONE!', this.doors);
				this.showInvites = true;
				this.creatingInvite = false;
			}, this),
			error: _.bind(function(m, resp) {
				console.warn('INVITE CREATE ERR!', resp.responseText);
				this.inviteError = resp.responseText;
			}, this),
		});
		// }
	},
	createUser: function(e) {
		if (e) {
			e.preventDefault();
			if (this.$('.users .panel-collapse.show').length) {
				e.stopPropagation();
			} else if (this.creatingUser) {
				//TODO: delayFocus?
				setTimeout(_.bind(function() {
					this.$('.users input[name]').focus();
				}, this));
				return;
			}
		}

		if (this.$(e.currentTarget).hasClass('toggle')) {
			this.creatingUser = !this.creatingUser;
			this.userError = undefined;
			if (this.creatingUser) {
				setTimeout(_.bind(function() {
					this.$('.users input[name]').focus();
				}, this));
			}
		} else {
			this.users.create({
				username: this.$('.users form [name="name"]').val(),
			}, {wait: true,
				success: _.bind(function(m) {
					console.log('USER CREATE DONE!', arguments);
					this.creatingUser = false;
					App.Router.navigate('/user/'+m.get('username'),
						{trigger: true});
				}, this),
				error: _.bind(function(m, resp) {
					console.warn('USER CREATE ERR!', resp.responseText);
					this.userError = resp.responseText;
				}, this),
			});
		}
	},
	updateSettings: function() {
		const publicSettings = this.$('.settings form.public');
		const privateSettings = this.$('.settings form.private');

		//TODO:
		console.log('publicSettings', publicSettings);
		console.log('privateSettings', privateSettings);
	},
});
