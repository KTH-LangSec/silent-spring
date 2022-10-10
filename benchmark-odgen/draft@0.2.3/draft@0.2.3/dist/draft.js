!function (global) {

/**
 * hasOwnProperty.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (has.call(require.modules, path)) return path;
  }

  if (has.call(require.aliases, index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!has.call(require.modules, from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return has.call(require.modules, localRequire.resolve(path));
  };

  return localRequire;
};
require.register("draft/index.js", Function("exports, require, module",
"/**\n * Module dependencies\n */\n\nvar define = Object.defineProperty\n  , freeze = Object.freeze\n  , isFrozen = Object.isFrozen\n  , isArray = Array.isArray\n  , toString = Object.prototype.toString\n\n/**\n * Exports\n */\n \nmodule.exports = draft;\ndraft.Draft  = Draft;\ndraft.Schema = Schema\ndraft.Tree   = Tree;\ndraft.Type   = Type;\ndraft.Model  = Model;\n\n\n/**\n * Merges two or more objects together. Also performs deep merging\n *\n * @see http://stackoverflow.com/a/383245/1408668\n * @api private\n * @param {Object} object \n * @param {Object} objectN\n */\n\nfunction merge(obj1, obj2) {\n\n  for (var p in obj2) {\n    try {\n      // Property in destination object set; update its value.\n      if ( obj2[p].constructor==Object ) {\n        obj1[p] = merge(obj1[p], obj2[p]);\n\n      } else {\n        obj1[p] = obj2[p];\n\n      }\n\n    } catch(e) {\n      // Property in destination object not set; create it and set its value.\n      obj1[p] = obj2[p];\n\n    }\n  }\n\n  return obj1;\n}\n\n\n/**\n * Checks whether the input is a plain object\n *\n * @api private\n * @param {Mixed} input\n */\n\nfunction isPlainObject (input) {\n  if (input !== null && typeof input === 'object' && input.constructor === Object) return true;\n  else return false;\n}\n\n\n/**\n * Checks whether the input is a function\n *\n * @api private\n * @param {Mixed} input\n */\n\nfunction isFunction (input) {\n  return (typeof input === 'function');\n}\n\n/**\n * Checks whether the input is a boolean\n *\n * @api private\n * @param {Mixed} input\n */\n\nfunction isBoolean (input) {\n  return (typeof input === 'boolean');\n}\n\n\n/**\n * Checks whether the input is a undefined\n *\n * @api private\n * @param {Mixed} input\n */\n\nfunction isUndefined (input) {\n  return (typeof input === 'undefined');\n}\n\n\n/**\n * Checks whether the input is a null\n *\n * @api private\n * @param {Mixed} input\n */\n\nfunction isNull (input) {\n  return (input === null);\n}\n\n\n/**\n * Checks whether the input is a string\n *\n * @api private\n * @param {Mixed} input\n */\n\nfunction isString (input) {\n  return (typeof input === 'string');\n}\n\n\n/**\n * Checks whether the input is a NaN\n *\n * @api private\n * @param {Mixed} input\n */\n\nfunction isTrueNaN (input) {\n  return (isNaN(input) && input !== NaN && typeof input === 'number');\n}\n\n\n/**\n * Converts an array like object to an array\n *\n * @api private\n * @param {Mixed} input\n */\n\nfunction toArray (input) {\n  return Array.prototype.slice.call(arguments, 0);\n}\n\n\n/**\n * CHecks whether a given input is in an array\n *\n * @api private\n * @param {Array} array\n * @param {Mixed} needle\n */\n\nfunction inArray (array, needle) {\n  return !!~array.indexOf(needle);\n}\n\n\n/**\n * Draft object\n *\n * @api public\n * @constructor Draft\n * @param {Object} descriptor\n * @param {Object} options\n */\n\nfunction Draft (descriptor, options) {\n  this.schema = new Schema(descriptor, options);\n  this.Model  = this.schema.createModel();\n}\n\n\n/**\n * @namespace draft\n * @api public\n * @function draft\n * @param {Object} descriptor\n * @param {Object} options\n */\n\nfunction draft (descriptor, options) {\n  return (new Draft(descriptor, options)).Model;\n}\n\n/**\n * Creates a schema\n *\n * @api public\n * @function draft.createSchema\n * @param {Object} descriptor\n * @param {Object} options\n */\n\ndraft.createSchema = function (descriptor, options) {\n  return new Schema(descriptor, options);\n}\n\n\n/**\n * Creates a model from a schema\n *\n * @api public\n * @function draft.createModel\n * @param {Schema} schema\n * @param {Object} options\n */\n\ndraft.createModel = function (schema, options) {\n  if (! (schema instanceof Schema)) \n    throw new TypeError(\"draft.createModel expects an instance of Schema. Got '\"+ typeof schema +\"'\");\n  else return schema.createModel(options);\n}\n\n\n/**\n * Creats an object schema\n *\n * @constructor Schema\n * @api public\n * @param {Object} descriptor\n * @param {Object} options\n */\n\nfunction Schema (descriptor, options) {\n  var self = this\n  // we must use plain objects\n  if (typeof descriptor !== 'undefined' && !isPlainObject(descriptor)) \n    throw new TypeError(\"Schema only expects an object as a descriptor. Got '\"+ typeof descriptor +\"'\");\n  // create tree instance with an empty object\n  this.tree = new Tree({});\n  // add descriptor to tree\n  this.add(descriptor);\n  // attach options\n  this.options = merge({ strict : true}, isPlainObject(options)? options : {});\n}\n\n\n/**\n * Adds an object to the schema tree\n *\n * @api public\n * @function Schema#add\n * @see Tree#add\n */\nSchema.prototype.add = function () {\n  this.tree.add.apply(this.tree, arguments);\n};\n\n\n/**\n * Creates a static function for the created model\n *\n * @api public\n * @function Schema#.static\n * @param {String} name\n * @param {Function} func\n */\n\nSchema.prototype.static = function (name, func) {\n  if (isPlainObject(name)) {\n    for (func in name) {\n      this.static(func, name[func]);\n    }\n  }\n  else {\n    if (!isString(name)) throw new TypeError(\"Schema#static exepects a string identifier as a function name\");\n    else if (!isFunction(func)) throw new TypeError(\"Schema#static exepects a function as a handle\");\n    this.add(name, { type: Function, static: true, value: func });\n  }\n};\n\n\n/**\n * Creates a constructor from the defined schema\n *\n * @api public\n * @function Schema#createModel\n * @param {Object} options\n */\n\nSchema.prototype.createModel = Schema.prototype.toModel = function (options, proto) {\n  var self = this\n  options = (isPlainObject(options))? options : {};\n  var instances = []\n  /**\n   * Private implementation of model\n   */\n  function InstanceModel () { \n    instances.push(this);\n    return Model.apply(this, arguments); \n  }\n  // set incoming prototype first\n  if (typeof proto === 'object') {\n    InstanceModel.prototype = proto;\n    InstanceModel.prototype.__proto__ = Object.create(Model.prototype);\n  }\n  else {\n    InstanceModel.prototype = Object.create(Model.prototype);\n  }\n  // reset constructor\n  InstanceModel.prototype.constructor = InstanceModel;\n  // attach schema instance\n  InstanceModel.prototype.schema = this;\n  // attach instances\n  InstanceModel.prototype.instances = instances;\n  // sugar to not use the 'new' operator\n  InstanceModel.create = function (data, schema) { return new this(data, schema); }.bind(InstanceModel);\n  // only scan top level\n  for (var item in this.tree) {\n    // prevent overrides\n    if (!isUndefined(InstanceModel[item])) continue;\n    // it must be defined and have a valid function value\n    if (this.tree[item].static === true && !isUndefined(this.tree[item].value)) {\n      InstanceModel[item] = (isFunction(this.tree[item].value))? this.tree[item].value.bind(InstanceModel) : this.tree[item].value;\n    }\n  }\n\n  // if the user wants to alloq modifications  \n  if (options.freeze !== false) freeze(InstanceModel);\n  return InstanceModel\n};\n\n\n/**\n  * Accepts an object of data and passes it to the\n  * Model constructor from the Schema instance\n  *\n  * @api public\n  * @function Schema#new\n  * @param {Object} data\n  */\n\nSchema.prototype.new = function (data) {\n  var model = this.createModel();\n  return new model(data);\n};\n\n\n/**\n * Creates an object tree for a schema.\n * This is used for aggregating types\n *\n * @constructor Tree\n * @api public\n * @param {Object} descriptor\n * @param {Object} options\n */\n\nfunction Tree (descriptor, options) {\n  var self = this\n  // ensure we have an object\n  if (!isArray(descriptor) && descriptor !== undefined && descriptor !== null && !isPlainObject(descriptor))\n    throw new TypeError(\"Tree only expects a descriptor\");\n  else this.add(descriptor);\n\n  if (isPlainObject(options) && options.array === true) {\n    var array = []\n    array.__proto__ = this;\n    array.type = new Type(options.type)\n    return array;\n  }\n}\n\n\n\n/**\n * Adds a key to the tree on a given parent tree. \n * Defaults to 'this' as the parent if one is not provided.\n *\n * @api public\n * @function Tree#add\n * @param {Tree} parent\n * @param {String} key\n * @param {Object} descriptor\n */\n\nTree.prototype.add = function (parent, key, descriptor) {\n  // are they just passing in an object as one big descriptor?\n  if (typeof parent === 'object' && arguments.length === 1) {\n    for (var prop in parent) {\n      this.add(this, prop, parent[prop]);\n    }\n  }\n  else {\n    parent = (parent instanceof Tree || isString(parent))? parent : this;\n    // is this a reference to a child tree?\n    if (parent instanceof Tree) {\n      if (isPlainObject(descriptor)) {\n        if (isFunction(descriptor.type)) {\n          parent[key] = new Type(descriptor.type, descriptor);\n        }\n        else {\n          parent[key] = new Tree(descriptor);\n        }\n      }\n      else if (isFunction(descriptor)) {\n        parent[key] = new Type(descriptor);\n      }\n      else if (isArray(descriptor)) {\n        if (descriptor.length && isFunction(descriptor[0])) {\n          parent[key] = new Tree(null, { array: true, type: descriptor[0] });\n        }\n        else {\n          parent[key] = [];\n        }\n      }\n    }\n    else if (isString(parent) && key) {\n      descriptor = key\n      key = parent;\n      this.add(this, key, descriptor);\n    }\n  }\n};\n\n\n/**\n * Creates a Type used in a Tree instance for a \n * Schema instance. It is meant to provide methods\n * for validation and coercion.\n *\n * @constructor Type\n * @api public\n * @param {Function} Constructor\n */\n\nfunction Type (Constructor, descriptor) {\n  // ensure creation of Type\n  if (!(this instanceof Type)) return new Type(Constructor, descriptor);\n  // ensure descriptor object\n  descriptor = (typeof descriptor === 'object')? descriptor : {};\n  if (!isFunction(Constructor)) throw new TypeError(\"Type only expects a function\");\n  // set the constructor for reference\n  this.Constructor = Constructor;\n  // remove type property from the descriptor if it was set there\n  delete descriptor.type;\n  // check for getter\n  if (isFunction(descriptor.get)) (this.get = descriptor.get) && delete descriptor.get;\n  // check for setter\n  if (isFunction(descriptor.set)) (this.set = descriptor.set) && delete descriptor.set;\n  // check if the values of this property are enumerable\n  if (isArray(descriptor.enum)) (this.enum = descriptor.enum) && delete descriptor.enum;\n  // check if strict mode\n  if (isBoolean(descriptor.strict)) (this.strict = descriptor.strict) && delete descriptor.strict;\n  // check if static\n  if (isBoolean(descriptor.static)) (this.static = descriptor.static) && delete descriptor.static;\n  // check if has set value\n  if (descriptor.value) (this.value = descriptor.value) && delete descriptor.value;\n  // check if has validator\n  if (isFunction(descriptor.validator)) (this.validator = descriptor.validator) && delete descriptor.validator;\n  // check if has default\n  if (descriptor.default) {\n    if (Constructor !== Function && 'function' === typeof descriptor.default) {\n      this.default = descriptor.default();\n    } else {\n      this.default = descriptor.default;\n    }\n\n    delete descriptor.default;\n  }\n}\n\n\n/**\n * Returns a string representation of a Type instance\n */\n\nType.prototype.toString = function () {\n  return '[object Type]';\n};\n\n\n/**\n * Return original constructor let it handle valueOf\n */\n\nType.prototype.valueOf = function () {\n  return this.Constructor.valueOf();\n};\n\n\n/**\n * Default getter that coerces a value\n *\n * @api public\n * @function Type#get\n * @param {Mixed} value\n */\n\nType.prototype.get = function (value) {\n  return this.coerce(value);\n};\n\n\n/**\n * Default setter that coerces a value\n *\n * @api public\n * @function Type#set\n * @param {Mixed} value\n */\n\nType.prototype.set = function (value) {\n  return this.coerce(value);\n};\n\n\n/**\n * Validates a defined type. \n * It performs instance of checks on values that are not primitive.\n * Primitive inputs are validated with a 'typeof' check\n *\n * @api public\n * @function Type#validate\n * @param {Mixed} input\n */\n\nType.prototype.validate = function (input) {\n  var Constructor\n  // validate with validator first if present\n  if (isFunction(this.validator) && !this.validator(input)) return false;\n  // if not strict mode then we don't need to validate anything\n  if (this.strict === false) return true;\n  // if its an object and the type constructor is\n  // not an object then validate that it is an \n  // actual instance of the type constructor \n  if (typeof input === 'object' && this.Constructor !== Object)\n    return (input instanceof this.Constructor);\n  // check for enumerated values\n  if (isArray(this.enum)) {\n    return inArray(this.enum, input);\n  }\n  // check input for primitive types\n  switch (typeof input) {\n    case 'string':   Constructor = String;   break;\n    case 'function': Constructor = Function; break;\n    case 'boolean':  Constructor = Boolean;  break;\n    case 'object':   Constructor = Object;   break;\n    case 'number':   Constructor = Number;   break;\n  }\n  // compare Type Constructor with input Constructor\n  return this.Constructor === Constructor;\n};\n\n\n/**\n * Coerces a given input with the set Constructor type\n *\n * @api public\n * @function Type#coerce\n * @param {Mixed} input\n */\n\nType.prototype.coerce = function (input) {\n  try { return this.Constructor(input); }\n  catch (e) { return input; }\n};\n\n\n/**\n * Base constructor for all created Model instances\n *\n * @constructor Model\n * @api public\n * @param {Object} data\n */\n\nfunction Model (data, schema) {\n  if (! (this instanceof Model)) return new Model(data, schema);\n  define(this, 'schema', {\n    enumerable : false,\n    writable : false,\n    configurable : false,\n    value: (schema instanceof Schema)? schema : this.schema\n  });\n  \n  var self = this\n  /** internal memory **/\n  var table = {};\n  // ensure an object if not undefined\n  if (data !== undefined && typeof data !== 'object') throw new TypeError(\"Model expects an object. Got '\"+ typeof data +\"'\");\n  // ensure the schema set\n  if (!this.schema || !(this.schema instanceof Schema)) throw new TypeError(\".schema hasn't been set\");\n\n  var build = function (data, tree, object) {\n    tree = (tree instanceof Tree)? tree : self.schema.tree;\n    object = (typeof object === 'object')? object : this;\n    for (var prop in data) {\n      // encapsulate each iteration in a scope\n      !function (prop) {\n        // if not in tree, return and continue on\n        if (!tree[prop]) return;\n        // if the property is an object, check if the tree property\n        // is a Tree instance object too\n        if (typeof data[prop] === 'object' && tree[prop] instanceof Tree) {\n          // define setter for object\n          define(data[prop], 'set', {\n            writable : false,\n            enumerable : false,\n            configurable : false,\n            value : function (value) {\n              object[prop] = value; \n            }\n          });\n          // define getter for object\n          define(data[prop], 'get', {\n            writable : false,\n            enumerable : false,\n            configurable : false,\n            value : function () { return object[prop] }\n          });\n\n          build(data[prop], tree[prop], object[prop]);\n        }\n        // we've reached some kind of scalar value \n        // that exists in the schema tree and the object\n        else {\n          object[prop] = data[prop];\n        }\n      }.call(this, prop);\n    }\n  }.bind(this);\n  // overload refresh method on prototype\n  var refresh = function () {\n    if (isFrozen(this)) return false;\n    var defineFromTree = function (tree, scope, table) {\n      var item\n      for (item in tree) {\n        !function (item) {\n          if (tree[item] === null || typeof tree[item] !== 'object') return;\n          // we don't want this as a possible field\n          if (tree[item].static) return\n          // it must be an instance of Type\n          if (tree[item] instanceof Type) {\n            // only set on plain objects\n            if (!isArray(scope)) {\n              // if it doesn't exist in the internal table\n              // then set it to undefined\n              table[item] = table[item] || undefined;\n              // create descriptor for property item on scope\n              // from tree descriptor\n              define(scope, item, {\n                configurable : false,\n                enumerable : true,\n                get : function () { \n                  return table[item]? tree[item].get(table[item]) : undefined; \n                },\n                set : function (value) {\n                  if (isFunction(tree[item].validate) && tree[item].validate(value)) {\n                    table[item] = tree[item].set(value);\n                    return table[item];\n                  } else { \n                    return false;\n                  }\n                }\n              });\n            }\n\n            if (!isUndefined(tree[item].default)) {\n              scope[item] = tree[item].default;\n            }\n          }\n          // if it is a tree instance then we need\n          // to do a recursive call to define the\n          // descriptors needed for the object\n          else if (tree[item] instanceof Tree || isArray(tree[item])) {\n            table[item] =  isArray(tree[item])? [] : {};\n\n            if (isArray(tree[item])) {\n              define(scope, item, {\n                configurable: false,\n                enumerable : true,\n                writable: false,\n                value: table[item]\n              });\n            }\n            else {\n              define(scope, item, {\n                configurable: false,\n                enumerable : true,\n                writable : false,\n                value : {}\n              });\n            }\n\n            define(scope[item], 'get', {\n              configurable: false,\n              enumerable: false,\n              writable: false,\n              value: function (key) { return table[item][key]; }\n            });\n\n            define(scope[item], 'set', {\n              configurable: false,\n              enumerable: false,\n              writable: false,\n              value: function (value) { \n                table[item][key] = value; \n                return table[item];\n              }\n            });\n\n            // overload array methods\n            if (isArray(tree[item])) {\n              [\n                'concat', 'every', 'filter', 'forEach', 'indexOf', 'join', 'lastIndexOf', 'map', 'pop',\n                'push', 'reduce', 'reduceRight', 'reverse', 'shift', 'slice', 'some', 'sort', 'splice',\n                'toString', 'unshift', 'valueOf'\n              ].map(function (method) {\n                if (isFunction([][method])) {\n                  define(scope[item], method, {\n                    configurable: false,\n                    enumerable: false,\n                    writable: false,\n                    value: function (value) {\n                      if (value !== undefined) {\n                        if (tree[item].type instanceof Type && isFunction(tree[item].type.validate)) {\n                          if (tree[item].type.validate(value)) {\n                            return [][method].apply(table[item], arguments)\n                          }\n                          else {\n                            return false;\n                          }\n                        }\n                        else {\n                          return [][method].apply(table[item], arguments)\n                        }\n                      }\n                      else {\n                        return [][method].apply(table[item], arguments);\n                      }\n                    }.bind(null)\n                  });\n                }\n              });\n            }\n\n            // recursive call to define descriptors\n            defineFromTree.call(self, tree[item], scope[item], table[item]);\n          }\n        }.call(self, item);\n      }\n      \n      if (this.schema.options.strict && scope !== this) \n        freeze(scope)\n    }.bind(this);\n    // define\n    defineFromTree(self.schema.tree, this, table);\n    // free if in strict mode\n    if (this.schema.options.strict) freeze(this);\n  };\n  // overload set method on prototype\n  define(this, 'set', {\n    configurable : false,\n    enumerable : false,\n    writable : true,\n    value : function (key, value) {\n      return this[key] = value;\n    }\n   });\n\n  define(this, 'get', {\n    configurable : false,\n    enumerable : false,\n    writable : false,\n    value : function (key) {\n      return table[key]\n    }\n   });\n\n  define(this, 'refresh', {\n    configurable : false,\n    enumerable : false,\n    writable : false,\n    value : refresh\n   });\n\n  define(this, 'toObject', {\n    configurable: false,\n    enumerable : false,\n    writable : false,\n    value : function () {\n      return table;\n    }\n  });\n\n  define(this, 'toJSON', {\n    configurable: false,\n    enumerable : false,\n    writable : false,\n    value : function () {\n      return table;\n    }\n  });\n\n  // call a refresh to init schema\n  this.refresh();\n  // set  data\n  data && build(data);\n}\n\n\nModel.prototype._events;\nModel.prototype.domain;\n\n/**\n * A reference to the schema instance for the model\n *\n * @api public\n * @property {Schema} schema\n */\n\n\nModel.prototype.schema;\n\n\n/**\n * Refreshes the state of the model based on its schema\n *\n * @api public\n * @function Model#refresh\n * @interface \n */\n\nModel.prototype.refresh = function () {};\n\n\n/**\n * Sets data on the model based on the schema\n *\n * @api public\n * @function Model#set\n * @interface \n */\n\nModel.prototype.set = function () {};\n\n\n/**\n * Returns a plain object representation of the model\n *\n * @api public\n * @function Model#toObject\n * @interface \n */\n\nModel.prototype.toObject = function () {};\n\n\n/**\n * Called with JSON.stringify\n *\n * @api public\n * @function Model#toJSON\n * @interface \n */\n\nModel.prototype.toJSON = function () {};\n\n\n/**\n * Returns a string representation of a Model instance\n *\n * @api public\n * @function Model#toString\n * @interface \n */\n\nModel.prototype.toString = function () { return '[object Model]'; };\n\n\n/**\n * Returns a value representation of a Model instance\n *\n * @api public\n * @function Model#valueOf\n * @interface \n */\n\nModel.prototype.valueOf = function () { return this.toObject(); };\n\n//@ sourceURL=draft/index.js"
));
require.alias("draft/index.js", "draft/index.js");

	if (typeof module === "object" && typeof module.exports === "object") {
		module.exports = require('draft');
	} 
	else {
		if (typeof define === "function" && define.amd) {
			define("draft", [], function () { return require('draft'); });
		}
		else if ( typeof window === "object" && typeof window.document === "object" ) {
			window.draft = require('draft');
		}
	}
}();