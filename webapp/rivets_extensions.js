
// === Formatters ===

Rivets.formatters.gt = function(value, arg) {
	return value > arg;
};

Rivets.formatters.gte = function(value, arg) {
	return value >= arg;
};

Rivets.formatters.lt = function(value, arg) {
	return value < arg;
};

Rivets.formatters.lte = function(value, arg) {
	return value <= arg;
};

Rivets.formatters.eq = function(value, arg) {
	return value === arg;
};

Rivets.formatters.ne = function(value, arg) {
	return value !== arg;
};

Rivets.formatters.and = function(value, arg) {
	return value && arg;
};

Rivets.formatters.or = function(value, arg) {
	return value || arg;
};

Rivets.formatters.length = function(value) {
	return value && value.length;
};

Rivets.formatters.max_len = function(value, arg) {
	if (value.length > arg)
		return value.slice(0, arg);
};

// Concatenate or add
Rivets.formatters['+'] = function(value, arg) {
	return value + arg;
};

const { DateTime } = require('luxon');
Rivets.formatters.luxon = function(value, arg) {
	return DateTime
		.fromSQL(value, {zone: 'UTC'})
		.setZone('local')
		.toLocaleString(arg && DateTime[arg] || DateTime.DATETIME_FULL);
};

// Allows rv-each-* to work on objects..
// Borrowed from: https://github.com/mikeric/rivets/issues/105
Rivets.formatters.to_a = function(value) {
	const newValue = [];
	_.forEach(value, function(v, k) {
		newValue.push({key: k, value: v});
	});
	return newValue;
};

// === HTML formatters ===

// Escape special html characters to prevent injection. (use this first)
Rivets.formatters.htmlEscape = function(value) {
	return Boolean(value) && value.replace(/[<>]/g, function(char) {
		switch (char) {
		case '<':
			return '&lt;';
		case '>':
			return '&gt;';
		}
	}) || '';
	//TODO: should this be more complete?
};
