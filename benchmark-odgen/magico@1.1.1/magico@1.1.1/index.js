'use strict';

/*!
 * Module variables
 */

var SEPERATOR = /\[['"]?|\.|['"]?\]/;
var STRING_DETECTOR = '[object String]';
var ARRAY_DETECTOR = '[object Array]';

/*!
 * Get object string tag
 */
var objToString = Object.prototype.toString;

/*!
 * Check if an object is a string
 */

function isString (str) {
  return objToString.call(str) === STRING_DETECTOR;
}

/*!
 * Check if an object is an array
 */

function isArray (str) {
  return objToString.call(str) === ARRAY_DETECTOR;
}

/*!
 * Check if a string is a positive integer
 */

function isPositiveInteger (obj) {
  if (isString(obj)) {
    return /^(0|[1-9]\d*)$/.test(obj);
  } else {
    return (obj >>> 0) === obj;
  }
}

function isNil (obj) {
  return obj !== obj || obj === undefined || obj === null;
}

/*!
 * Remove falsy values from an array
 */
function compact (array) {
  array = array || [];
  return array.filter(function(el) {
    return el === 0 || Boolean(el).valueOf();
  });
}

/*!
 * Coerce an object for specific action: `get`, `set`, `remove`, `exists`
 */

function coerce (type, obj, path, value) {
  if (isNil(path)) return;

  // Turn positive integer into string
  if (isPositiveInteger(path)) path = String(path);

  // Parse string path into an array
  if (isString(path)) {
    path = compact(path.trim().split(SEPERATOR));
  }

  // Return if path is invalid
  if (!path || !isArray(path) || path.length === 0) return;

  // Copy array for future use
  path = path.slice();

  // Shift the first path value
  var key = path.shift();

  // Return `undefined` if obj is `NaN` or `null` or `undefined`
  if (isNil(obj)) return;

  switch (type) {
    case 'get':
      if (path.length === 0) {
        return obj[key];
      }
      break;
    case 'set':
      if (path.length) {
        if (typeof obj[key] === 'undefined') {
          obj[key] = {};
        }

        if (isNil(obj[key])) return false;
      } else {
        obj[key] = value;
        return true;
      }
      break;
    case 'remove':
      if (path.length === 0) {

        if (isArray(obj) && isPositiveInteger(key)) {
          key = Number(key);

          if (obj.length - 1 < key) return false;

          obj.splice(key, 1);
        } else {
          if (!Object.hasOwnProperty.call(obj, key)) return false;

          delete obj[key];
        }

        return true;
      }
      break;
    case 'exists':
      if (path.length === 0) {
        if (isArray(obj) && isPositiveInteger(key)) {
          key = Number(key);
          return obj.length - 1 >= key;
        } else {
          return Object.hasOwnProperty.call(obj, key);
        }
      }
      break;
    default:
      return;
  }

  return coerce(type, obj[key], path, value);
}

/**
 * ### Magico (object)
 *
 * @param {Object} object to which will be wrapped for later use
 * @name Magico
 * @api public
 */
function Magico(obj) {
  if (!(this instanceof Magico)) return new Magico(obj);

  this._obj = obj;
}

/**
 * ### Magico.wrap (object)
 *
 * @param {Object} object to which will be wrapped for later use
 * @name Magico.wrap
 * @return Magico instance
 * @api public
 */

Magico.wrap = function (obj) {
  return Magico(obj);
};

/**
 * ### Magico.set (object, path, value)
 *
 * @param {Object} object to which will be wrapped for later use
 * @param {String | Array} path to which will use to access object
 * @param {Object} value to which will be set
 * @name Magico.set
 * @return {Boolean} whether the value is set or not
 * @api public
 */

Magico.set = function (obj, path, value) {
  return !!coerce('set', obj, path, value);
};

/**
 * ### Magico.get (object, path)
 *
 * @param {Object} object to which will be wrapped for later use
 * @param {String | Array} path to which will use to access object
 * @name Magico.get
 * @return {Object} the value of properties
 * @api public
 */

Magico.get = function (obj, path) {
  return coerce('get', obj, path);
};

/**
 * ### Magico.exists (object, path)
 *
 * @param {Object} object to which will be wrapped for later use
 * @param {String | Array} path to which will use to access object
 * @name Magico.exists
 * @return {Boolean} the value of path exists or not
 * @api public
 */

Magico.exists = function (obj, path) {
  return !!coerce('exists', obj, path);
};

/**
 * ### Magico.remove (object, path, value)
 *
 * @param {Object} object to which will be wrapped for later use
 * @param {String | Array} path to which will use to access object
 * @param {Object} value to which will be remove
 * @name Magico.remove
 * @return {Boolean} whether the value is removed or not
 * @api public
 */

Magico.remove = function (obj, path) {
  return !!coerce('remove', obj, path);
};

/**
 * ### Magico.access
 *
 * @name Magico.access
 * @return {Object} return an instance for specific path
 * @api public
 */
Magico.access = function (obj, path) {
  return Magico(Magico.get(obj, path));
};

/**
 * ### Magico.prototype.set (path, value)
 *
 * @param {String | Array} path to which will use to access object
 * @param {Object} value to which will be set
 * @name Magico.prototype.set
 * @return {Boolean} whether the value is set or not
 * @api public
 */

Magico.prototype.set = function (path, value) {
  return Magico.set(this._obj, path, value);
};

/**
 * ### Magico.prototype.get (path)
 *
 * @param {String | Array} path to which will use to access object
 * @name Magico.prototype.get
 * @return {Object} the value of properties
 * @api public
 */

Magico.prototype.get = function (path) {
  return Magico.get(this._obj, path);
};

/**
 * ### Magico.prototype.exists (path)
 *
 * @param {String | Array} path to which will use to access object
 * @name Magico.prototype.exists
 * @return {Boolean} the value of path exists or not
 * @api public
 */

Magico.prototype.exists = function (path) {
  return Magico.exists(this._obj, path);
};

/**
 * ### Magico.prototype.remove (path, value)
 *
 * @param {String | Array} path to which will use to access object
 * @param {Object} value to which will be remove
 * @name Magico.prototype.remove
 * @return {Boolean} whether the value is removed or not
 * @api public
 */

Magico.prototype.remove = function (path) {
  return Magico.remove(this._obj, path);
};

/**
 * ### Magico.prototype.toObject
 *
 * @name Magico.prototype.toObject
 * @return {Object} the changed object
 * @api public
 */

Magico.prototype.toObject = function () {
  return this._obj;
};

/**
 * ### Magico.prototype.access
 *
 * @name Magico.prototype.access
 * @return {Object} return an instance for specific path
 * @api public
 */

Magico.prototype.access = function (path) {
  return Magico.access(this._obj, path);
};

// Export Magico function
module.exports = Magico;
