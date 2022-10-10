/**
* @module blindfold
*/

if (typeof exports === 'undefined') {
  this.blindfold = blindfold;
} else {
  module.exports = blindfold;
}

/**
* Get or Set a value from a dot syntax string
* #blindfold
* @param {object} base - object to use as context for property search
* @param {string} path - dot-syntax path to traverse in search of value
* @param {object} value - value to set on resolved property
*/
function blindfold(base, path, value) {
  var ctx = base = base || this;

  if (typeof path !== 'string') {
    throw new TypeError('The `path` argument must be a string');
  }

  path = path.split('.');

  for (var i = 0; i < path.length; i++) {
    if (typeof base === 'undefined' || base === null) {
      return base;
    }

    if (value && i === path.length - 1) {
      base[path[i]] = value;
    }

    base = base[path[i]];
  }

  if (typeof base === 'function') {
    path.pop();

    if (path.length) {
      base = base.bind(blindfold(ctx, path.join('.')));
    } else {
      base = base.bind(ctx);
    }
  }

  return base;
};
