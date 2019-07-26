// Enable payements from Coinbase!
'use strict';

const site = require('../api/site');

function CoinbaseAuthPlugin() {
	console.log('COINBASE Auth:', arguments);
}

function CoinbasePaymentPlugin() {
	console.log('COINBASE Pay:', arguments);
}

module.exports = function (app) {
	if (!app.plugins['payment']) {
		app.plugins['payment'] = {};
	}
	app.plugins['payment']['coinbase'] = CoinbasePaymentPlugin;
	if (!app.plugins['oauth']) {
		app.plugins['oauth'] = {};
	}
	app.plugins['oauth']['coinbase'] = CoinbaseAuthPlugin;

	if (!site.private_settings.coinbase_id)
		site.private_settings.coinbase_id = null;
	if (!site.secrets.coinbase_key)
		site.secrets.coinbase_key = null;
};
