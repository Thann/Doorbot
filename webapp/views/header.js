
require('../styles/header.css');

module.exports = Backbone.View.extend({
	id: 'Header',
	template: _.template(`
		<a href="#">
			<% if (orgName) { %>
				<span><%= orgName %> </span>
			<% } %>
			<span>Portal</span>
		</a>
		<% if (user.isAuthed) { %>
			<span class="pull-right">
				<% if (user.get('admin')) { %>
					<a href="#admin"><i class="fa fa-cogs" /></a>
				<% } %>
				<a href="<%= '#user/' + user.get('username') %>">
					<%= user.get('username') %>
				</a>
			</span>
		<% } %>
	`),
	initialize: function() {
		this.user =  App.User,
		this.orgName = App.AppConfig.OrgName,
		this.listenTo(this.user, 'update', this.render);
	},
	render: function() {
		this.$el.html(this.template(this));
		return this;
	},
});
