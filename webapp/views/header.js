
require('styles/header.css');

module.exports = Backbone.View.extend({
	id: 'Header',
	template: `
		<a href="#">
			<span>Doorbot</span>
			<span rv-if="orgName">- { orgName }</span>
		</a>
		<a href="#login" class="pull-right">{ user.attributes.username }</a>
	`,
	render: function() {
		this.scope = {
			user: Doorbot.User,
			orgName: Doorbot.AppConfig.OrgName,
		};
		this.$el.html(this.template);
		Rivets.bind(this.$el, this.scope);
		return this;
	},
});
