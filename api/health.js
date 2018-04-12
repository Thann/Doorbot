// Healthcheck
'use strict';

module.exports = function(app) {
	app.get('/health', function(req, res) {
		res.status(204).end();
	});
};

