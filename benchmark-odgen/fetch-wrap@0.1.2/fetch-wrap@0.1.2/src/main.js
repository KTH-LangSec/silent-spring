
/*
  wraps a fetch() function with an array of middlewares,
  a middleware has the form:

  function(url, options, innerFetch) {
    // TODO: do something with url, options, or the promise results
    return innerFetch(url, options);
  }
}
*/
function extend(fetch, middleware) {
  if (!middleware || middleware.length < 1) {
    return fetch;
  }
  var innerFetch = middleware.length === 1 ? fetch : extend(fetch, middleware.slice(1));
  var next = middleware[0];
  return function extendedFetch(url, options) {
    // ensure options is always an object
    try {
      return Promise.resolve(next(url, options || {}, innerFetch));
    } catch (err) {
      return Promise.reject(err);
    }
  };
}

function isObject(obj) {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

function mergePair(target, source) {
  if (!isObject(target) || !isObject(source)) {
    return source;
  }
  for (var name in source) {
    if (source.hasOwnProperty(name)) {
      var sourceValue = source[name];
      var targetValue = target[name];
      if (isObject(targetValue) && isObject(sourceValue)) {
        mergePair(targetValue, sourceValue);
      } else {
        target[name] = source[name];
      }
    }
  }
  return target;
}

/*
  deep merge
  merges into target, all following arguments
*/
function merge(target) {
  var output = target;
  var sources = Array.prototype.slice.call(arguments, 1);
  for (var i = 0; i < sources.length; i++) {
    output = mergePair(output, sources[i]);
  }
  return output;
}

extend.merge = merge;

module.exports = extend;
