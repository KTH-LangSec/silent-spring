/**
 * Module dependencies
 */

var define = Object.defineProperty
  , freeze = Object.freeze
  , isFrozen = Object.isFrozen
  , isArray = Array.isArray
  , toString = Object.prototype.toString

/**
 * Exports
 */
 
module.exports = draft;
draft.Draft  = Draft;
draft.Schema = Schema
draft.Tree   = Tree;
draft.Type   = Type;
draft.Model  = Model;


/**
 * Merges two or more objects together. Also performs deep merging
 *
 * @see http://stackoverflow.com/a/383245/1408668
 * @api private
 * @param {Object} object 
 * @param {Object} objectN
 */

function merge(obj1, obj2) {

  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if ( obj2[p].constructor==Object ) {
        obj1[p] = merge(obj1[p], obj2[p]);

      } else {
        obj1[p] = obj2[p];

      }

    } catch(e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];

    }
  }

  return obj1;
}


/**
 * Checks whether the input is a plain object
 *
 * @api private
 * @param {Mixed} input
 */

function isPlainObject (input) {
  if (input !== null && typeof input === 'object' && input.constructor === Object) return true;
  else return false;
}


/**
 * Checks whether the input is a function
 *
 * @api private
 * @param {Mixed} input
 */

function isFunction (input) {
  return (typeof input === 'function');
}

/**
 * Checks whether the input is a boolean
 *
 * @api private
 * @param {Mixed} input
 */

function isBoolean (input) {
  return (typeof input === 'boolean');
}


/**
 * Checks whether the input is a undefined
 *
 * @api private
 * @param {Mixed} input
 */

function isUndefined (input) {
  return (typeof input === 'undefined');
}


/**
 * Checks whether the input is a null
 *
 * @api private
 * @param {Mixed} input
 */

function isNull (input) {
  return (input === null);
}


/**
 * Checks whether the input is a string
 *
 * @api private
 * @param {Mixed} input
 */

function isString (input) {
  return (typeof input === 'string');
}


/**
 * Checks whether the input is a NaN
 *
 * @api private
 * @param {Mixed} input
 */

function isTrueNaN (input) {
  return (isNaN(input) && input !== NaN && typeof input === 'number');
}


/**
 * Converts an array like object to an array
 *
 * @api private
 * @param {Mixed} input
 */

function toArray (input) {
  return Array.prototype.slice.call(arguments, 0);
}


/**
 * CHecks whether a given input is in an array
 *
 * @api private
 * @param {Array} array
 * @param {Mixed} needle
 */

function inArray (array, needle) {
  return !!~array.indexOf(needle);
}


/**
 * Draft object
 *
 * @api public
 * @constructor Draft
 * @param {Object} descriptor
 * @param {Object} options
 */

function Draft (descriptor, options) {
  this.schema = new Schema(descriptor, options);
  this.Model  = this.schema.createModel();
}


/**
 * @namespace draft
 * @api public
 * @function draft
 * @param {Object} descriptor
 * @param {Object} options
 */

function draft (descriptor, options) {
  return (new Draft(descriptor, options)).Model;
}

/**
 * Creates a schema
 *
 * @api public
 * @function draft.createSchema
 * @param {Object} descriptor
 * @param {Object} options
 */

draft.createSchema = function (descriptor, options) {
  return new Schema(descriptor, options);
}


/**
 * Creates a model from a schema
 *
 * @api public
 * @function draft.createModel
 * @param {Schema} schema
 * @param {Object} options
 */

draft.createModel = function (schema, options) {
  if (! (schema instanceof Schema)) 
    throw new TypeError("draft.createModel expects an instance of Schema. Got '"+ typeof schema +"'");
  else return schema.createModel(options);
}


/**
 * Creats an object schema
 *
 * @constructor Schema
 * @api public
 * @param {Object} descriptor
 * @param {Object} options
 */

function Schema (descriptor, options) {
  var self = this
  // we must use plain objects
  if (typeof descriptor !== 'undefined' && !isPlainObject(descriptor)) 
    throw new TypeError("Schema only expects an object as a descriptor. Got '"+ typeof descriptor +"'");
  // create tree instance with an empty object
  this.tree = new Tree({});
  // add descriptor to tree
  this.add(descriptor);
  // attach options
  this.options = merge({ strict : true}, isPlainObject(options)? options : {});
}


/**
 * Adds an object to the schema tree
 *
 * @api public
 * @function Schema#add
 * @see Tree#add
 */
Schema.prototype.add = function () {
  this.tree.add.apply(this.tree, arguments);
};


/**
 * Creates a static function for the created model
 *
 * @api public
 * @function Schema#.static
 * @param {String} name
 * @param {Function} func
 */

Schema.prototype.static = function (name, func) {
  if (isPlainObject(name)) {
    for (func in name) {
      this.static(func, name[func]);
    }
  }
  else {
    if (!isString(name)) throw new TypeError("Schema#static exepects a string identifier as a function name");
    else if (!isFunction(func)) throw new TypeError("Schema#static exepects a function as a handle");
    this.add(name, { type: Function, static: true, value: func });
  }
};


/**
 * Creates a constructor from the defined schema
 *
 * @api public
 * @function Schema#createModel
 * @param {Object} options
 */

Schema.prototype.createModel = Schema.prototype.toModel = function (options, proto) {
  var self = this
  options = (isPlainObject(options))? options : {};
  var instances = []
  /**
   * Private implementation of model
   */
  function InstanceModel () { 
    instances.push(this);
    return Model.apply(this, arguments); 
  }
  // set incoming prototype first
  if (typeof proto === 'object') {
    InstanceModel.prototype = proto;
    InstanceModel.prototype.__proto__ = Object.create(Model.prototype);
  }
  else {
    InstanceModel.prototype = Object.create(Model.prototype);
  }
  // reset constructor
  InstanceModel.prototype.constructor = InstanceModel;
  // attach schema instance
  InstanceModel.prototype.schema = this;
  // attach instances
  InstanceModel.prototype.instances = instances;
  // sugar to not use the 'new' operator
  InstanceModel.create = function (data, schema) { return new this(data, schema); }.bind(InstanceModel);
  // only scan top level
  for (var item in this.tree) {
    // prevent overrides
    if (!isUndefined(InstanceModel[item])) continue;
    // it must be defined and have a valid function value
    if (this.tree[item].static === true && !isUndefined(this.tree[item].value)) {
      InstanceModel[item] = (isFunction(this.tree[item].value))? this.tree[item].value.bind(InstanceModel) : this.tree[item].value;
    }
  }

  // if the user wants to alloq modifications  
  if (options.freeze !== false) freeze(InstanceModel);
  return InstanceModel
};


/**
  * Accepts an object of data and passes it to the
  * Model constructor from the Schema instance
  *
  * @api public
  * @function Schema#new
  * @param {Object} data
  */

Schema.prototype.new = function (data) {
  var model = this.createModel();
  return new model(data);
};


/**
 * Creates an object tree for a schema.
 * This is used for aggregating types
 *
 * @constructor Tree
 * @api public
 * @param {Object} descriptor
 * @param {Object} options
 */

function Tree (descriptor, options) {
  var self = this
  // ensure we have an object
  if (!isArray(descriptor) && descriptor !== undefined && descriptor !== null && !isPlainObject(descriptor))
    throw new TypeError("Tree only expects a descriptor");
  else this.add(descriptor);

  if (isPlainObject(options) && options.array === true) {
    var array = []
    array.__proto__ = this;
    array.type = new Type(options.type)
    return array;
  }
}



/**
 * Adds a key to the tree on a given parent tree. 
 * Defaults to 'this' as the parent if one is not provided.
 *
 * @api public
 * @function Tree#add
 * @param {Tree} parent
 * @param {String} key
 * @param {Object} descriptor
 */

define(Tree.prototype, 'add', {
  enumerable: false,
  value: function (parent, key, descriptor) {
    // are they just passing in an object as one big descriptor?
    if (typeof parent === 'object' && arguments.length === 1) {
      for (var prop in parent) {
        this.add(this, prop, parent[prop]);
      }
    }
    else {
      parent = (parent instanceof Tree || isString(parent))? parent : this;
      // is this a reference to a child tree?
      if (parent instanceof Tree) {
        if (isPlainObject(descriptor)) {
          if (isFunction(descriptor.type)) {
            parent[key] = new Type(descriptor.type, descriptor);
          }
          else {
            parent[key] = new Tree(descriptor);
          }
        }
        else if (isFunction(descriptor)) {
          parent[key] = new Type(descriptor);
        }
        else if (isArray(descriptor)) {
          if (descriptor.length && isFunction(descriptor[0])) {
            parent[key] = new Tree(null, { array: true, type: descriptor[0] });
          }
          else {
            parent[key] = [];
          }
        }
      }
      else if (isString(parent) && key) {
        descriptor = key
        key = parent;
        this.add(this, key, descriptor);
      }
    }
  }
});


/**
 * Creates a Type used in a Tree instance for a 
 * Schema instance. It is meant to provide methods
 * for validation and coercion.
 *
 * @constructor Type
 * @api public
 * @param {Function} Constructor
 */

function Type (Constructor, descriptor) {
  // ensure creation of Type
  if (!(this instanceof Type)) return new Type(Constructor, descriptor);
  // ensure descriptor object
  descriptor = (typeof descriptor === 'object')? descriptor : {};
  if (!isFunction(Constructor)) throw new TypeError("Type only expects a function");
  // set the constructor for reference
  this.Constructor = Constructor;
  // remove type property from the descriptor if it was set there
  delete descriptor.type;
  // check for getter
  if (isFunction(descriptor.get)) (this.get = descriptor.get) && delete descriptor.get;
  // check for setter
  if (isFunction(descriptor.set)) (this.set = descriptor.set) && delete descriptor.set;
  // check if the values of this property are enumerable
  if (isArray(descriptor.enum)) (this.enum = descriptor.enum) && delete descriptor.enum;
  // check if strict mode
  if (isBoolean(descriptor.strict)) (this.strict = descriptor.strict) && delete descriptor.strict;
  // check if static
  if (isBoolean(descriptor.static)) (this.static = descriptor.static) && delete descriptor.static;
  // check if has set value
  if (descriptor.value) (this.value = descriptor.value) && delete descriptor.value;
  // check if has validator
  if (isFunction(descriptor.validator)) (this.validator = descriptor.validator) && delete descriptor.validator;
  // check if has default
  if (descriptor.default) {
    if (Constructor !== Function && 'function' === typeof descriptor.default) {
      this.default = descriptor.default();
    } else {
      this.default = descriptor.default;
    }

    delete descriptor.default;
  }
}


/**
 * Returns a string representation of a Type instance
 */

Type.prototype.toString = function () {
  return '[object Type]';
};


/**
 * Return original constructor let it handle valueOf
 */

Type.prototype.valueOf = function () {
  return this.Constructor.valueOf();
};


/**
 * Default getter that coerces a value
 *
 * @api public
 * @function Type#get
 * @param {Mixed} value
 */

Type.prototype.get = function (value) {
  return this.coerce(value);
};


/**
 * Default setter that coerces a value
 *
 * @api public
 * @function Type#set
 * @param {Mixed} value
 */

Type.prototype.set = function (value) {
  return this.coerce(value);
};


/**
 * Validates a defined type. 
 * It performs instance of checks on values that are not primitive.
 * Primitive inputs are validated with a 'typeof' check
 *
 * @api public
 * @function Type#validate
 * @param {Mixed} input
 */

Type.prototype.validate = function (input) {
  var Constructor
  // validate with validator first if present
  if (isFunction(this.validator) && !this.validator(input)) return false;
  // if not strict mode then we don't need to validate anything
  if (this.strict === false) return true;
  // if its an object and the type constructor is
  // not an object then validate that it is an 
  // actual instance of the type constructor 
  if (typeof input === 'object' && this.Constructor !== Object)
    return (input instanceof this.Constructor);
  // check for enumerated values
  if (isArray(this.enum)) {
    return inArray(this.enum, input);
  }
  // check input for primitive types
  switch (typeof input) {
    case 'string':   Constructor = String;   break;
    case 'function': Constructor = Function; break;
    case 'boolean':  Constructor = Boolean;  break;
    case 'object':   Constructor = Object;   break;
    case 'number':   Constructor = Number;   break;
  }
  // compare Type Constructor with input Constructor
  return this.Constructor === Constructor;
};


/**
 * Coerces a given input with the set Constructor type
 *
 * @api public
 * @function Type#coerce
 * @param {Mixed} input
 */

Type.prototype.coerce = function (input) {
  try { return this.Constructor(input); }
  catch (e) { return input; }
};


/**
 * Base constructor for all created Model instances
 *
 * @constructor Model
 * @api public
 * @param {Object} data
 */

function Model (data, schema) {
  if (! (this instanceof Model)) return new Model(data, schema);
  define(this, 'schema', {
    enumerable : false,
    writable : false,
    configurable : false,
    value: (schema instanceof Schema)? schema : this.schema
  });
  
  var self = this
  /** internal memory **/
  var table = {};
  // ensure an object if not undefined
  if (data !== undefined && typeof data !== 'object') throw new TypeError("Model expects an object. Got '"+ typeof data +"'");
  // ensure the schema set
  if (!this.schema || !(this.schema instanceof Schema)) throw new TypeError(".schema hasn't been set");

  var build = function (data, tree, object) {
    tree = (tree instanceof Tree)? tree : self.schema.tree;
    object = (typeof object === 'object')? object : this;
    for (var prop in data) {
      // encapsulate each iteration in a scope
      !function (prop) {
        // if not in tree, return and continue on
        if (!tree[prop]) return;
        // if the property is an object, check if the tree property
        // is a Tree instance object too
        if (typeof data[prop] === 'object' && tree[prop] instanceof Tree) {
          // define setter for object
          define(data[prop], 'set', {
            writable : false,
            enumerable : false,
            configurable : false,
            value : function (value) {
              object[prop] = value; 
            }
          });
          // define getter for object
          define(data[prop], 'get', {
            writable : false,
            enumerable : false,
            configurable : false,
            value : function () { return object[prop] }
          });

          build(data[prop], tree[prop], object[prop]);
        }
        // we've reached some kind of scalar value 
        // that exists in the schema tree and the object
        else {
          object[prop] = data[prop];
        }
      }.call(this, prop);
    }
  }.bind(this);
  // overload refresh method on prototype
  var refresh = function () {
    if (isFrozen(this)) return false;
    var defineFromTree = function (tree, scope, table) {
      var item
      for (item in tree) {
        !function (item) {
          if (tree[item] === null || typeof tree[item] !== 'object') return;
          // we don't want this as a possible field
          if (tree[item].static) return
          // it must be an instance of Type
          if (tree[item] instanceof Type) {
            // only set on plain objects
            if (!isArray(scope)) {
              // if it doesn't exist in the internal table
              // then set it to undefined
              table[item] = table[item] || undefined;
              // create descriptor for property item on scope
              // from tree descriptor
              define(scope, item, {
                configurable : false,
                enumerable : true,
                get : function () { 
                  return table[item]? tree[item].get(table[item]) : undefined; 
                },
                set : function (value) {
                  if (isFunction(tree[item].validate) && tree[item].validate(value)) {
                    table[item] = tree[item].set(value);
                    return table[item];
                  } else { 
                    return false;
                  }
                }
              });
            }

            if (!isUndefined(tree[item].default)) {
              scope[item] = tree[item].default;
            }
          }
          // if it is a tree instance then we need
          // to do a recursive call to define the
          // descriptors needed for the object
          else if (tree[item] instanceof Tree || isArray(tree[item])) {
            table[item] =  isArray(tree[item])? [] : {};

            if (isArray(tree[item])) {
              define(scope, item, {
                configurable: false,
                enumerable : true,
                writable: false,
                value: table[item]
              });
            }
            else {
              define(scope, item, {
                configurable: false,
                enumerable : true,
                writable : false,
                value : {}
              });
            }

            define(scope[item], 'get', {
              configurable: false,
              enumerable: false,
              writable: false,
              value: function (key) { return table[item][key]; }
            });

            define(scope[item], 'set', {
              configurable: false,
              enumerable: false,
              writable: false,
              value: function (value) { 
                table[item][key] = value; 
                return table[item];
              }
            });

            // overload array methods
            if (isArray(tree[item])) {
              [
                'concat', 'every', 'filter', 'forEach', 'indexOf', 'join', 'lastIndexOf', 'map', 'pop',
                'push', 'reduce', 'reduceRight', 'reverse', 'shift', 'slice', 'some', 'sort', 'splice',
                'toString', 'unshift', 'valueOf'
              ].map(function (method) {
                if (isFunction([][method])) {
                  define(scope[item], method, {
                    configurable: false,
                    enumerable: false,
                    writable: false,
                    value: function (value) {
                      if (value !== undefined) {
                        if (tree[item].type instanceof Type && isFunction(tree[item].type.validate)) {
                          if (tree[item].type.validate(value)) {
                            return [][method].apply(table[item], arguments)
                          }
                          else {
                            return false;
                          }
                        }
                        else {
                          return [][method].apply(table[item], arguments)
                        }
                      }
                      else {
                        return [][method].apply(table[item], arguments);
                      }
                    }.bind(null)
                  });
                }
              });
            }

            // recursive call to define descriptors
            defineFromTree.call(self, tree[item], scope[item], table[item]);
          }
        }.call(self, item);
      }
      
      // if (this.schema.options.strict && scope !== this) 
      //   freeze(scope)
    }.bind(this);
    // define
    defineFromTree(self.schema.tree, this, table);
    // free if in strict mode
    if (this.schema.options.strict) freeze(this);
  };
  // overload set method on prototype
  define(this, 'set', {
    configurable : false,
    enumerable : false,
    writable : true,
    value : function (key, value) {
      return this[key] = value;
    }
   });

  define(this, 'get', {
    configurable : false,
    enumerable : false,
    writable : false,
    value : function (key) {
      return table[key]
    }
   });

  define(this, 'refresh', {
    configurable : false,
    enumerable : false,
    writable : false,
    value : refresh
   });

  define(this, 'toObject', {
    configurable: false,
    enumerable : false,
    writable : false,
    value : function () {
      return JSON.parse(JSON.stringify(table));
    }
  });

  define(this, 'toJSON', {
    configurable: false,
    enumerable : false,
    writable : false,
    value : function () {
      return JSON.parse(JSON.stringify(table));
    }
  });

  // call a refresh to init schema
  this.refresh();
  // set  data
  data && build(data);

  // handle incoming arrays
  if ('object' == typeof data) {
    for (var prop in data) {
      if (isArray(data[prop]) && isArray(this[prop])) {
        data[prop].forEach(function (v) {
          this.push(v);
        }, this[prop]);
      }
    }
  }
}


/**
 * A reference to the schema instance for the model
 *
 * @api public
 * @property {Schema} schema
 */


Model.prototype.schema;


/**
 * Refreshes the state of the model based on its schema
 *
 * @api public
 * @function Model#refresh
 * @interface 
 */

Model.prototype.refresh = function () {};


/**
 * Sets data on the model based on the schema
 *
 * @api public
 * @function Model#set
 * @interface 
 */

Model.prototype.set = function () {};


/**
 * Returns a plain object representation of the model
 *
 * @api public
 * @function Model#toObject
 * @interface 
 */

Model.prototype.toObject = function () {};


/**
 * Called with JSON.stringify
 *
 * @api public
 * @function Model#toJSON
 * @interface 
 */

Model.prototype.toJSON = function () {};


/**
 * Returns a string representation of a Model instance
 *
 * @api public
 * @function Model#toString
 * @interface 
 */

Model.prototype.toString = function () { return '[object Model]'; };


/**
 * Returns a value representation of a Model instance
 *
 * @api public
 * @function Model#valueOf
 * @interface 
 */

Model.prototype.valueOf = function () { return this.toObject(); };

