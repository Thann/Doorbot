
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
  return value == arg;
};

Rivets.formatters.ne = function(value, arg) {
  return value != arg;
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

// Concatenate or add
Rivets.formatters['+'] = function(value, arg) {
  return value + arg;
};

// Allows rv-each-* to work on objects..
// Borrowed from: https://github.com/mikeric/rivets/issues/105
Rivets.formatters.to_a = function(value) {
  var new_value = [];
  _.forEach(value, function(v, k) {
    new_value.push({key: k, value: v});
  });
  return new_value;
};

// === HTML formatters ===

// Escape special html characters to prevent injection. (use this first)
Rivets.formatters.htmlEscape = function(value) {
  return !!value && value.replace(/[<>]/g, function(char) {
    switch (char) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
    }
  }) || '';
  //TODO: should this be more complete?
};
