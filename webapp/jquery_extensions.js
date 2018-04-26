
const $ = require('jquery');

// Like serializeArray, but useful
$.fn.serializeObject = function() {
	const o = {};
	const a = this.serializeArray();

	$.each(a, function() {
		if (o[this.name] !== undefined) {
			if (!o[this.name].push) {
				o[this.name] = [o[this.name]];
			}

			o[this.name].push(this.value || '');
		} else {
			o[this.name] = this.value || '';
		}
	});

	return o;
};

