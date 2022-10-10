'use strict';

const _ = require('lodash');

const crypto = require('./crypto');

const DEFAULT_LIMIT = 100;
const QUOTE_REGEXP = /(\\Q|\\E)/g;

const CONFIG = {
  DEBUG: process.env.DEBUG_DB,
};

let Parse;
let db = {};
let hooks = {};
const masks = {};

let indirect = null;
let outOfBandResults = null;

let defaultController = null;
let mocked = false;
let user = null;

function debugPrint(prefix, object) {
  if (CONFIG.DEBUG) {
    console.log(['[', ']'].join(prefix), JSON.stringify(object, null, 4));
  }
}

function isOp(object) {
  return object && typeof object === 'object' && '__op' in object;
}

function isPointer(object) {
  return object && object.__type === 'Pointer';
}

function isDate(object) {
  return object && object.__type === 'Date';
}

/**
 * Deserialize an encoded query parameter if necessary
 */
function deserializeQueryParam(param) {
  if (!!param && (typeof param === 'object')) {
    if (param.__type === 'Date') {
      return new Date(param.iso);
    }
  }
  return param;
}

/**
 * Evaluates whether 2 objects are the same, independent of their representation
 * (e.g. Pointer, Object)
 */
function objectsAreEqual(obj1, obj2) {
  // Always search through array on array columns
  if (Array.isArray(obj1)) {
    if (Array.isArray(obj2)) {
      throw new Parse.Error(107, `You cannot use ${obj2} as a query parameter`);
    } else {
      return _.some(obj1, obj => objectsAreEqual(obj, obj2));
    }
  }

  // scalar values (including null/undefined)
  // Note: undefined equals null.
  // For all other objects, strict equality is applied
  if (obj1 === obj2 || (_.isNil(obj1) && _.isNil(obj2))) {
    return true;
  }

  // if any of those is null or undefined the other is not because
  // of above --> abort
  if (_.isNil(obj1) || _.isNil(obj2)) {
    return false;
  }

  // objects
  if (_.isEqual(obj1, obj2)) {
    return true;
  }

  // both pointers
  if (obj1.objectId !== undefined && obj1.objectId === obj2.objectId) {
    return true;
  }

  // both dates
  if (isDate(obj1) && isDate(obj2)) {
    return deserializeQueryParam(obj1) === deserializeQueryParam(obj2);
  }

  return false;
}


// Ensures `object` has an array at `key`. Creates array if `key` doesn't exist.
// Will throw if value for `key` exists and is not Array.
function ensureArray(object, key) {
  if (!object[key]) {
    object[key] = [];
  }
  if (!Array.isArray(object[key])) {
    throw new Error("Can't perform array operation on non-array field");
  }
}

const MASKED_UPDATE_OPS = new Set(['AddRelation', 'RemoveRelation']);

/**
 * Update Operators.
 *
 * Params:
 *    object - object on which to operate
 *    key   - value to be modified in bound object.
 *    value - operator value, i.e. `{__op: "Increment", amount: 1}`
 */
const UPDATE_OPERATORS = {
  Increment: (object, key, value) => {
    if (object[key] === undefined) {
      object[key] = 0;
    }
    object[key] += value.amount;
  },
  Add: (object, key, value) => {
    ensureArray(object, key);
    value.objects.forEach(el => {
      object[key].push(el);
    });
  },
  AddUnique: (object, key, value) => {
    ensureArray(object, key);
    const array = object[key];
    value.objects.forEach(el => {
      if (!_.some(array, e => objectsAreEqual(e, el))) {
        array.push(el);
      }
    });
  },
  Remove: (object, key, value) => {
    ensureArray(object, key);
    const array = object[key];
    value.objects.forEach(el => {
      _.remove(array, item => objectsAreEqual(item, el));
    });
  },
  Delete: (object, key) => {
    delete object[key];
  },
  AddRelation: (object, key, value) => {
    ensureArray(object, key);
    const relation = object[key];
    value.objects.forEach(pointer => {
      if (!_.some(relation, e => objectsAreEqual(e, pointer))) {
        relation.push(pointer);
      }
    });
  },
  RemoveRelation: (object, key, value) => {
    ensureArray(object, key);
    const relation = object[key];
    value.objects.forEach(item => {
      _.remove(relation, pointer => objectsAreEqual(pointer, item));
    });
  },
};

function getCollection(collection) {
  if (!db[collection]) {
    db[collection] = {};
  }
  return db[collection];
}

function getMask(collection) {
  if (!masks[collection]) {
    masks[collection] = new Set();
  }
  return masks[collection];
}

/**
 * Clears the MockDB and any registered hooks.
 */
function cleanUp() {
  db = {};
  hooks = {};
}

/**
 * Registers a hook on a class denoted by className.
 *
 * @param {string} className The name of the class to register hook on.
 * @param {string} hookType One of 'beforeSave', 'afterSave', 'beforeDelete', 'afterDelete'
 * @param {function} hookFn Function that will be called with `this` bound to hydrated model.
 *                          Must return a promise.
 *
 * @note Only supports beforeSave, beforeDelete, and afterSave at the moment.
 */
function registerHook(className, hookType, hookFn) {
  if (!hooks[className]) {
    hooks[className] = {};
  }

  hooks[className][hookType] = hookFn;
}

/**
 * Retrieves a previously registered hook.
 *
 * @param {string} className The name of the class to get the hook on.
 * @param {string} hookType One of 'beforeSave', 'afterSave', 'beforeDelete', 'afterDelete'
 */
function getHook(className, hookType) {
  if (hooks[className] && hooks[className][hookType]) {
    return hooks[className][hookType];
  }
  return undefined;
}

function mockUser(_user) {
  user = _user;
}

function makeRequestObject(original, model, useMasterKey) {
  return {
    installationId: 'parse-mockdb',
    master: useMasterKey,
    object: model,
    original,
    user,
  };
}

// Destructive. Takes data for update operation and removes all atomic operations.
// Returns the extracted ops.
function extractOps(data) {
  const ops = {};

  _.forIn(data, (attribute, key) => {
    if (isOp(attribute)) {
      ops[key] = attribute;
      delete data[key];
    }
  });

  return ops;
}

// Destructive. Applies all the update `ops` to `data`.
// Throws on unknown update operator.
function applyOps(data, ops, className) {
  debugPrint('OPS', ops);
  _.forIn(ops, (value, key) => {
    const operator = value.__op;

    if (operator in UPDATE_OPERATORS) {
      UPDATE_OPERATORS[operator](data, key, value, className);
    } else {
      throw new Error(`Unknown update operator: ${key}`);
    }

    if (MASKED_UPDATE_OPS.has(operator)) {
      getMask(className).add(key);
    }
  });
}

// Batch requests have the API version included in path
function normalizePath(path) {
  return path.replace('/1/', '');
}

const SPECIAL_CLASS_NAMES = {
  roles: '_Role',
  users: '_User',
  push: '_Push',
};

/**
 * Given a class name and a where clause, returns DB matches by applying
 * the where clause (recursively if nested)
 */
function recursivelyMatch(className, where) {
  debugPrint('MATCH', { className, where });
  const collection = getCollection(className);
  // eslint-disable-next-line no-use-before-define
  const matches = _.filter(_.values(collection), queryFilter(where));
  debugPrint('MATCHES', { matches });
  return _.cloneDeep(matches); // return copies instead of originals
}

// according to the js sdk api documentation parse uses the following radius of the earth
const RADIUS_OF_EARTH_KM = 6371.0;
const RADIUS_OF_EARTH_MILES = 3958.8;
// the parse rest guide says that the maximum distance is 100 miles if no explicit maximum
// is provided; here we already convert this distance into radians
const DEFAULT_MAX_DISTANCE = 100 / RADIUS_OF_EARTH_MILES;

/**
 * Operators for queries
 *
 * Params:
 *    operand - the value on which the query operator is applied
 *    value - operator value, i.e. the number 30 in `age: {$lt: 30}`
 */
const QUERY_OPERATORS = {
  $exists: (operand, value) => !!operand === value,
  $in: (operand, values) => _.some(values, value => objectsAreEqual(operand, value)),
  $nin: (operand, values) => _.every(values, value => !objectsAreEqual(operand, value)),
  $eq: (operand, value) => objectsAreEqual(operand, value),
  $ne: (operand, value) => !objectsAreEqual(operand, value),
  $lt: (operand, value) => operand < value,
  $lte: (operand, value) => operand <= value,
  $gt: (operand, value) => operand > value,
  $gte: (operand, value) => operand >= value,
  $regex: (operand, value) => {
    const regex = _.clone(value.$regex).replace(QUOTE_REGEXP, '');
    return (new RegExp(regex, value.$options).test(operand));
  },
  $select: (operand, value) => {
    const foreignKey = value.key;
    const query = value.query;
    const matches = recursivelyMatch(query.className, query.where);
    const objectMatches = _.filter(matches, match => match[foreignKey] === operand);
    return objectMatches.length;
  },
  $inQuery: (operand, query) => {
    const matches = recursivelyMatch(query.className, query.where);
    return _.find(matches, match => operand && match.objectId === operand.objectId);
  },
  $all: (operand, value) =>
    _.every(value, obj1 => _.some(operand, obj2 => objectsAreEqual(obj1, obj2))),
  $relatedTo: (operand, value) => {
    const object = value.object;
    const className = object.className;
    const id = object.objectId;
    const relatedKey = value.key;
    const relations = getCollection(className)[id][relatedKey] || [];
    // What is going on here?  nothing is returned here?
    // TODO: could use a unit test to help document what's supposed to happen here
    if (indirect) {
      // Grab the className from the first relation item in order to set the class
      // correctly on the way out
      outOfBandResults = {};
      if (relations && relations.length > 0) {
        outOfBandResults.className = relations[0].className;
      }
      outOfBandResults.matches = relations.reduce((results, relation) => {
        // eslint-disable-next-line no-use-before-define
        const matches = recursivelyMatch(relations[0].className, {
          objectId: relation.objectId,
        });
        return results.concat(matches);
      }, []);
    } else {
      return objectsAreEqual(relations, operand);
    }
    return undefined;
  },
  $nearSphere: (operand, value, additionalArgs) => {
    let maxDistance = additionalArgs.maxDistanceInRadians;

    if (_.isNil(maxDistance)) {
      maxDistance = DEFAULT_MAX_DISTANCE;
    }

    return new Parse.GeoPoint(operand).radiansTo(new Parse.GeoPoint(value)) <= maxDistance;
  },
  // ignore these additional parameters for the $nearSphere op
  $maxDistance: () => true,
  $maxDistanceInRadians: () => true,
  $maxDistanceInKilometers: () => true,
  $maxDistanceInMiles: () => true,
};

function evaluateObject(object, whereParams, key) {
  const nestedKeys = key.split('.');
  if (nestedKeys.length > 1) {
    for (let i = 0; i < nestedKeys.length - 1; i++) {
      if (!object[nestedKeys[i]]) {
        // key not found
        return false;
      }
      object = object[nestedKeys[i]];
      key = nestedKeys[i + 1];
    }
  }

  if (typeof whereParams === 'object' && !Array.isArray(whereParams) && whereParams) {
    // Handle objects that actually represent scalar values
    if (isPointer(whereParams) || isDate(whereParams)) {
      return QUERY_OPERATORS.$eq.apply(null, [object[key], whereParams]);
    }

    if (key in QUERY_OPERATORS) {
      return QUERY_OPERATORS[key].apply(null, [object, whereParams]);
    }

    if ('$regex' in whereParams) {
      return QUERY_OPERATORS.$regex.apply(null, [object[key], whereParams]);
    }

    // $maxDistance... is not an operator for itself but just an additional parameter
    // for the $nearSphere operator, so we have to fetch this value in advance.
    const args = {};
    if (whereParams) {
      args.maxDistanceInRadians = whereParams.$maxDistance || whereParams.$maxDistanceInRadians;
      if ('$maxDistanceInKilometers' in whereParams) {
        args.maxDistanceInRadians = whereParams.$maxDistanceInKilometers / RADIUS_OF_EARTH_KM;
      } else if ('$maxDistanceInMiles' in whereParams) {
        args.maxDistanceInRadians = whereParams.$maxDistanceInMiles / RADIUS_OF_EARTH_MILES;
      }
    }

    // Process each key in where clause to determine if we have a match
    return _.reduce(whereParams, (matches, value, constraint) => {
      const keyValue = deserializeQueryParam(object[key]);
      const param = deserializeQueryParam(value);

      // Constraint can take the form form of a query operator OR an equality match
      if (constraint in QUERY_OPERATORS) {  // { age: {$lt: 30} }
        return matches && QUERY_OPERATORS[constraint].apply(
          null,
          [keyValue, param, args]
        );
      }
      // { age: 30 }
      return matches && QUERY_OPERATORS.$eq.apply(null, [keyValue[constraint], param]);
    }, true);
  }

  return QUERY_OPERATORS.$eq.apply(null, [object[key], whereParams]);
}


/**
 * Returns a function that filters query matches on a where clause
 */
function queryFilter(where) {
  if (where.$or) {
    return object =>
      _.reduce(where.$or, (result, subclause) => result ||
        queryFilter(subclause)(object), false);
  }

  // Go through each key in where clause
  return object => _.reduce(where, (result, whereParams, key) => {
    const match = evaluateObject(object, whereParams, key);
    return result && match;
  }, true);
}

function handleRequest(method, path, body) {
  const explodedPath = normalizePath(path).split('/');
  const start = explodedPath.shift();
  const className = start === 'classes' ? explodedPath.shift() : SPECIAL_CLASS_NAMES[start];

  const request = {
    method,
    className,
    data: body,
    objectId: explodedPath.shift(),
  };

  try {
    // eslint-disable-next-line no-use-before-define
    return HANDLERS[method](request);
  } catch (e) {
    return Promise.reject(e);
  }
}

function respond(status, response) {
  return {
    status,
    response,
  };
}

/**
 * Batch requests have the following form: {
 *  requests: [
 *      { method, path, body },
 *   ]
 * }
 */
function handleBatchRequest(unused1, unused2, data) {
  const requests = data.requests;
  const getResults = requests.map(request => {
    const method = request.method;
    const path = request.path;
    const body = request.body;
    return handleRequest(method, path, body)
      .then(result => Promise.resolve({ success: result.response }));
  });

  return Promise.all(getResults).then(results => respond(200, results));
}

/**
 * Given an object, a pointer, or a JSON representation of a Parse Object,
 * return a fully fetched version of the Object.
 */
function fetchObjectByPointer(pointer) {
  const collection = getCollection(pointer.className);
  const storedItem = collection[pointer.objectId];

  if (storedItem === undefined) {
    return undefined;
  }

  return Object.assign(
    { __type: 'Object', className: pointer.className },
    _.cloneDeep(storedItem)
  );
}

/**
 * Recursive function that traverses an include path and replaces pointers
 * with fully fetched objects
 */
function includePaths(object, pathsRemaining) {
  debugPrint('INCLUDE', { object, pathsRemaining });
  const path = pathsRemaining.shift();
  const target = object && object[path];

  if (target) {
    if (Array.isArray(target)) {
      object[path] = target.map(item => {
        if (item.className) {
          // This is a pointer or an object
          const fetched = fetchObjectByPointer(item);
          includePaths(fetched, _.cloneDeep(pathsRemaining));
          return fetched;
        }
        return item;
      });
    } else {
      if (object[path].__type === 'Pointer') {
        object[path] = fetchObjectByPointer(target);
      }
      includePaths(object[path], pathsRemaining);
    }
  }

  return object;
}

/**
 * Given a set of matches of a GET query (e.g. find()), returns fully
 * fetched Parse Objects that include the nested objects requested by
 * Parse.Query.include()
 */
function queryMatchesAfterIncluding(matches, includeClause) {
  if (!includeClause) {
    return matches;
  }

  const includeClauses = includeClause.split(',');
  matches = _.map(matches, match => {
    for (let i = 0; i < includeClauses.length; i++) {
      const paths = includeClauses[i].split('.');
      match = includePaths(match, paths);
    }
    return match;
  });

  return matches;
}

/**
 * Sort query results if necessary
 */
function sortQueryresults(matches, order) {
  const orderArray = order.split(',').map(k => {
    let dir = 'asc';
    let key = k;

    if (k.charAt(0) === '-') {
      key = k.substring(1);
      dir = 'desc';
    }

    return [item => deserializeQueryParam(item[key]), dir];
  });

  const keys = orderArray.map(_.first);
  const orders = orderArray.map(_.last);

  return _.orderBy(matches, keys, orders);
}

/**
 * Handles a GET request (Parse.Query.find(), get(), first(), Parse.Object.fetch())
 */
function handleGetRequest(request) {
  const objId = request.objectId;
  const className = request.className;
  if (objId) {
    // Object.fetch() query
    const collection = getCollection(className);
    const currentObject = collection[objId];
    if (!currentObject) {
      return Promise.resolve(respond(404, {
        code: 101,
        error: 'object not found for update',
      }));
    }
    let match = _.cloneDeep(currentObject);

    if (match) {
      const toOmit = Array.from(getMask(className));
      match = _.omit(match, toOmit);
    }

    return Promise.resolve(respond(200, match));
  }
  const data = request.data;
  indirect = data.redirectClassNameForKey;
  let matches = recursivelyMatch(className, data.where);
  let matchesClassName = '';
  if (indirect) {
    matches = outOfBandResults.matches;
    if (outOfBandResults.className) {
      matchesClassName = outOfBandResults.className;
    }
  }

  if (request.data.count) {
    return Promise.resolve(respond(200, { count: matches.length }));
  }

  matches = queryMatchesAfterIncluding(matches, data.include);

  const toOmit = Array.from(getMask(className));
  matches = matches.map((match) => _.omit(match, toOmit));

  // TODO: Can we just call toJSON() in order to avoid this?
  matches.forEach(match => {
    if (match.createdAt) {
      match.createdAt = match.createdAt.toJSON();
    }
    if (match.updatedAt) {
      match.updatedAt = match.updatedAt.toJSON();
    }
  });

  // sort results if necessary
  if (data.order && data.order.length > 0 && matches.length > 0) {
    matches = sortQueryresults(matches, data.order);
  }

  const limit = data.limit || DEFAULT_LIMIT;
  const startIndex = data.skip || 0;
  const endIndex = startIndex + limit;
  const response = { results: matches.slice(startIndex, endIndex) };

  // Add the class name for the outgoing objects to the response if sepcified
  if (matchesClassName.length > 0) {
    response.className = matchesClassName;
  }

  return Promise.resolve(respond(200, response));
}

/**
 * Executes a registered hook with data provided.
 *
 * Hydrates the data into an instance of the class named by `className` param and binds it to the
 * function to be run.
 *
 * @param {string} className The name of the class to get the hook on.
 * @param {string} hookType One of 'beforeSave', 'afterSave', 'beforeDelete', 'afterDelete'
 * @param {Object} data The Data that is to be hydrated into an instance of className class.
 */
function runHook(className, hookType, data) {
  let hook = getHook(className, hookType);
  if (hook) {
    const hydrate = (rawData) => {
      const modelData = Object.assign({}, rawData, { className });
      const modelJSON = _.mapValues(modelData,
        // Convert dates into JSON loadable representations
        value => ((value instanceof Date) ? value.toJSON() : value)
      );
      return Parse.Object.fromJSON(modelJSON);
    };
    const model = hydrate(data, className);
    hook = hook.bind(model);

    const collection = getCollection(className);
    let original;
    if (collection[model.id]) {
      original = hydrate(collection[model.id]);
    }
    // TODO Stub out Parse.Cloud.useMasterKey() so that we can report the correct 'master'
    // value here.
    return hook(makeRequestObject(original, model, false)).then((beforeSaveOverrideValue) => {
      debugPrint('HOOK', { beforeSaveOverrideValue });

      // Unlike BeforeDeleteResponse, BeforeSaveResponse might specify
      let objectToProceedWith = model;
      if (hookType === 'beforeSave' && beforeSaveOverrideValue) {
        objectToProceedWith = beforeSaveOverrideValue.toJSON();
      }

      return Promise.resolve(objectToProceedWith);
    });
  }
  return Promise.resolve(data);
}

function getChangedKeys(originalObject, updatedObject) {
  if (originalObject === updatedObject) {
    return [];
  }
  return _.reduce(updatedObject, (result, value, key) => {
    if (!_.isEqual(originalObject[key], value)) {
      result.push(key);
    }
    return result;
  }, []);
}

/**
 * Handles a POST request (Parse.Object.save())
 */
function handlePostRequest(request) {
  const className = request.className;
  const collection = getCollection(className);

  let newObject;
  return runHook(className, 'beforeSave', request.data).then(result => {
    const changedKeys = getChangedKeys(request.data, result);

    const newId = crypto.newObjectId();
    const now = new Date();

    const ops = extractOps(result);

    newObject = Object.assign(
      result,
      { objectId: newId, createdAt: now, updatedAt: now }
    );

    applyOps(newObject, ops, className);
    const toOmit = ['updatedAt'].concat(Array.from(getMask(className)));
    const toPick = Object.keys(ops).concat(changedKeys);

    collection[newId] = newObject;

    const response = Object.assign(
      _.cloneDeep(_.omit(_.pick(result, toPick), toOmit)),
      { objectId: newId, createdAt: result.createdAt.toJSON() }
    );

    return Promise.resolve(respond(201, response));
  }).then((result) => {
    runHook(className, 'afterSave', newObject);
    return result;
  });
}

function handlePutRequest(request) {
  const className = request.className;
  const collection = getCollection(className);
  const objId = request.objectId;
  const currentObject = collection[objId];
  const now = new Date();
  const data = request.data || {};

  const ops = extractOps(data);

  if (!currentObject) {
    return Promise.resolve(respond(404, {
      code: 101,
      error: 'object not found for put',
    }));
  }

  const updatedObject = Object.assign(
    _.cloneDeep(currentObject),
    data,
    { updatedAt: now }
  );

  applyOps(updatedObject, ops, className);
  const toOmit = ['createdAt', 'objectId'].concat(Array.from(getMask(className)));

  return runHook(className, 'beforeSave', updatedObject).then(result => {
    const changedKeys = getChangedKeys(updatedObject, result);

    collection[request.objectId] = updatedObject;
    const response = Object.assign(
      _.cloneDeep(_.omit(_.pick(result, Object.keys(ops).concat(changedKeys)), toOmit)),
      { updatedAt: now.toJSON() }
    );
    return Promise.resolve(respond(200, response));
  }).then((result) => {
    runHook(className, 'afterSave', updatedObject);
    return result;
  });
}

function handleDeleteRequest(request) {
  const collection = getCollection(request.className);
  const objToDelete = collection[request.objectId];

  return runHook(request.className, 'beforeDelete', objToDelete).then(() => {
    delete collection[request.objectId];
    return Promise.resolve(respond(200, {}));
  });
}

const HANDLERS = {
  GET: handleGetRequest,
  POST: handlePostRequest,
  PUT: handlePutRequest,
  DELETE: handleDeleteRequest,
};

const MockRESTController = {
  request: (method, path, data, options) => {
    let result;
    if (path === 'batch') {
      debugPrint('BATCH', { method, path, data, options });
      result = handleBatchRequest(method, path, data);
    } else {
      debugPrint('REQUEST', { method, path, data, options });
      result = handleRequest(method, path, data);
    }

    return result.then(finalResult => {
      // Status of database after handling request above
      debugPrint('DB', db);
      debugPrint('RESPONSE', finalResult.response);
      return Promise.resolve(finalResult.response);
    });
  },
  ajax: () => {
    /* no-op */
  },
};

/**
 * Mocks a Parse API server, by intercepting requests and storing/querying data locally
 * in an in-memory DB.
 */
function mockDB(parseModule) {
  Parse = parseModule;
  if (!mocked) {
    defaultController = Parse.CoreManager.getRESTController();
    mocked = true;
    Parse.CoreManager.setRESTController(MockRESTController);
  }
}

/**
 * Restores the original RESTController.
 */
function unMockDB() {
  if (mocked) {
    Parse.CoreManager.setRESTController(defaultController);
    mocked = false;
  }
}

const MockDB = {
  mockDB,
  unMockDB,
  cleanUp,
  registerHook,
  mockUser,
};

module.exports = MockDB;
