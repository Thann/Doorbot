module.exports = {
	AuthError: function() {
		this.code = 401;
	},
	UserError: function() {
		this.code = 400;
	},
	HandledError: function() {},
}
