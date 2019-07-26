// Helper to validate API params
'use strict';

module.exports = function validate(params) {
	// Takes in params and returns and express validation function
	return function(request, response, done) {
		for (const section in params) {
			for (const [key, type] of Object.entries(params[section])) {
				// console.log("S:", section, "key:", key, "type:", type)
				try {
					// console.log("    -> ", request[section][key])
					if (request[section][key]) {
						const res = type(request[section][key]);
						if (isNaN(res)) throw 'invalid number';
						request[section][key] = res;
					}
				} catch(e) {
					response.status(400).send({[key]: 'invalid value'});
					return done(true);
				}
			}
		}
		done(false);
	};
};
