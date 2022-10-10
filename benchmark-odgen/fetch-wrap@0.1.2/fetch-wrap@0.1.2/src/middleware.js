/*
 a module with common built-in middleware

 usage:
   var fetchWrap = require('fetch-wrap');
   var middleware = require('fetch-wrap/middleware');
   var fetch = fetchWrap(fetch, [
     middleware.logger(),
     middleware.receiveJson()
   ]);
*/

var fetchWrap = require('./main');
var dateReviver = require('./date-reviver');
var merge = fetchWrap.merge;

/*
  applies sets of default options based on url patterns
  fetchOptions is an array (applied in order), with this format:
  [{
    for: 'http://*.url-pattern-wildcards-are-supported.com/*',
    options: {
      headers: { Authorization: 'Token s3cr3tt0k3n' }
    }
  }]
*/
function optionsByUrlPattern(fetchOptions) {
  return function(url, options, fetch) {
    var patchedOptions = options;
    if (fetchOptions) {
      fetchOptions.forEach(function(fetchOption) {
        if (fetchOption.for && urlMatchesPattern(url, fetchOption.for)) {
          patchedOptions = fetchWrap.merge({}, fetchOption.options, patchedOptions);
        }
      });
    }
    return fetch(url, patchedOptions);
  };
}
exports.optionsByUrlPattern = optionsByUrlPattern;

/*
  logs requests
  - by default using console, specify loggerOptions.log to override
  - if loggerOptions.success successful responses are logged too
  - use loggerOptions.elapsed adds elapsed seconds as last parameter to .log
  - fetch has options.timeouts .log is called at different timeouts:
     fetch(url, { timeouts: {
       5: 'info',
       10: 'warn',
       30: 'error'
     }});
*/
function logger(loggerOptions) {
  var log = (loggerOptions && loggerOptions.log) || function(level) {
    return console[level === 'error' ? 'error' : 'log'].apply(console, arguments);
  };
  return function(url, options, fetch) {
    var method = options.method || 'GET';
    var startTime = new Date().getTime();
    function buildArgs(level, eventName, additionalArg) {
      var args = [level, '[fetch]', method, url, eventName];
      if (additionalArg !== undefined && additionalArg !== null) {
        args.push(additionalArg);
      }
      if (loggerOptions.elapsed && (eventName === 'success' || eventName === 'failed')) {
        args.push((new Date().getTime() - startTime) / 1000);
      }
      return args;
    }
    log.apply(this, buildArgs('debug', 'start'));
    var clear;
    if (options.timeouts) {
      clear = setTimeouts(options.timeouts, function(seconds, level) {
        log.apply(this, buildArgs(level, 'timeout', seconds));
      }).clear;
    }
    return fetch(url, options).then(function(result) {
      if (clear) {
        clear();
      }
      if (loggerOptions && loggerOptions.success) {
        log.apply(this, buildArgs('debug', 'success'));
      }
      return result;
    }).catch(function(err) {
      if (clear) {
        clear();
      }
      // 400-404 are expected errors, should be normally handled by app logic
      var unexpected = !err.status || err.status > 404;
      var parsedError = {
        message: err.message,
        status: err.status
      };
      log.apply(this, buildArgs(unexpected ? 'error' : 'debug', 'failed', parsedError));
      throw err;
    });
  };
}
exports.logger = logger;

/**
  completes urls using params in two ways:
  - replaces {tokens} in the url looking into option.params or defaultParams
  - any unused param in options.params is added as query string param
  - an error is thrown if a {token} couldn't be replaced, unless failIfTokenIsMissing is false
*/
function urlParams(defaultParams, failIfTokenIsMissing) {
  var failIfMissing = failIfTokenIsMissing !== false;
  return function(url, options, fetch) {
    return fetch(setUrlParams(url, options && options.params, defaultParams, failIfMissing), options);
  };
}
exports.urlParams = urlParams;

/**
  automatically JSON stringifies request body if present,
  and sets Content-Type header
*/
function sendJSON() {
  return function(url, options, fetch) {
    var patchedOptions = setHttpHeaders(options, { 'Content-Type': 'application/json' });
    return fetch(url, (patchedOptions.body && typeof patchedOptions.body === 'object')
      ? merge({}, patchedOptions, {
        body: JSON.stringify(patchedOptions.body)
      }) : patchedOptions);
  };
}
exports.sendJSON = sendJSON;

/**
  Prepare for JSON responses
  - if options.acceptHeader, sets Accept header to application/json
  - if options.reviver, reviver is used for JSON.parse, otherwise a default Date reviver is used
  - parses JSON response automatically if Content-Type is application/json
  - throws if response is an http error

  you can still get the raw result using:
    fetch(url, { returnRawResult: true })
*/
function receiveJSON(receiveOptions) {
  return function(url, options, fetch) {
    // ask for json
    var patchedOptions = receiveOptions && receiveOptions.acceptHeader
      ? setHttpHeaders(options, { 'Accept': 'application/json' }) : options;
    if (patchedOptions.returnRawResult) {
      return fetch(url, patchedOptions);
    }
    var reviver = (receiveOptions && typeof receiveOptions.reviver !== 'undefined')
      ? receiveOptions.reviver
      : dateReviver;
    return fetch(url, patchedOptions).then(function(result) {
      function resultTextHandler(text) {
        var body = text;
        if (text === undefined || text === null || text === '') {
          body = undefined;
        } else if (/application\/json/.test(result.headers.get('content-type'))) {
          // got json, parse it
          body = JSON.parse(text, reviver);
        }
        if (result.ok) {
          return body;
        }
        // http error, promise fail
        var err = new Error('http error ' + result.status + ': ' + result.statusText);
        err.fetchResult = result;
        err.status = result.status;
        err.body = body;
        throw err;
      }

      if (!result || typeof result.text !== 'function') {
        return resultTextHandler();
      }

      return result.text().then(resultTextHandler);
    });
  };
}
exports.receiveJSON = receiveJSON;

/*
  testing utilities
  - if specified, call testOptions.spy for each fetch
  - if specified testOptions.mock is used as result (if it's a function it will use function return value)
  - to set mock for different urls, you can use optionsByUrlPattern
  - any fetch not mocked throws an error, unless testOptions.failIfNoMock is false
*/
function testing(testOptions) {
  testOptions = testOptions || {};
  return function(url, options, fetch) {
    var spy = options.spy || testOptions.spy;
    if (spy) {
      spy(url, options);
    }
    var mock = options.mock || testOptions.mock;
    if (mock) {
      var data = mock;
      if (typeof data === 'function') {
        data = data(url, options);
      }
      return Promise.resolve(data);
    }
    if (testOptions.failIfNoMock !== false) {
      throw new Error('[fetch] request mock not found for: ' + url);
    }
    return fetch(url, options);
  };
}
exports.testing = testing;

function setHttpHeaders(options, headers, override) {
  if (!headers) {
    return options || {};
  }
  return override !== false
    ? merge({}, options, { headers: headers })
    : merge({}, { headers: headers }, options);
}

var ESCAPE_OPEN_CURLY_BRACKETS = '@@OPEN-CURLY-BRACKET@@';
var ESCAPE_CLOSE_CURLY_BRACKETS = '@@CLOSE-CURLY-BRACKET@@';
var ESCAPE_OPEN_CURLY_BRACKETS_REGEX = new RegExp(ESCAPE_OPEN_CURLY_BRACKETS, 'g');
var ESCAPE_CLOSE_CURLY_BRACKETS_REGEX = new RegExp(ESCAPE_CLOSE_CURLY_BRACKETS, 'g');

function setUrlParams(input, params, optionalParams, failIfParamIsMissing) {
  if (!params && !optionalParams) {
    return input;
  }
  var unusedParams = merge({}, params);
  var url = input
    .replace(/\{\{/g, ESCAPE_OPEN_CURLY_BRACKETS)
    .replace(/\}\}/g, ESCAPE_CLOSE_CURLY_BRACKETS)
    .replace(/\{([^}]+)\}/g, function(match, name) {
      var value = params && params[name];
      if (value === undefined) {
        value = optionalParams && optionalParams[name];
      } else {
        delete unusedParams[name];
      }
      if (value === undefined) {
        if (failIfParamIsMissing === false) {
          return match;
        }
        throw new Error('url param not found: ' + match);
      }
      return value;
    })
    .replace(ESCAPE_OPEN_CURLY_BRACKETS_REGEX, '{')
    .replace(ESCAPE_CLOSE_CURLY_BRACKETS_REGEX, '}');

  return addUrlQueryParams(url, unusedParams);
}

function encodeQueryParamValue(value) {
  return encodeURIComponent(value.toString());
}

function encodeQueryParam(name, value) {
  return encodeURIComponent(name) + '=' + (Array.isArray(value)
    ? value.map(encodeQueryParamValue).join('&' + name + '=')
    : encodeQueryParamValue(value));
}

function addUrlQueryParams(url, params) {
  if (!params) {
    return url;
  }
  var query = Object.keys(params)
    .filter(function(name) { return params[name] !== undefined; })
    .map(function(name) { return encodeQueryParam(name, params[name]); })
    .join('&');
  if (!query) {
    return url;
  }
  return url + ((url.indexOf('?') >= 0) ? '&' : '?') + query;
}

function urlMatchesPattern(url, pattern) {
  if (pattern === url || pattern === '*') {
    return true;
  }
  if (pattern.indexOf('*') >= 0) {
    var regex = new RegExp(pattern
      .replace(/[.()+?/]/g, function(match) { return '\\' + match; })
      .replace(/\*/g, '.*')
    );
    return regex.test(url);
  }
  return false;
}

function setTimeouts(timeouts, handler) {
  function setSingleTimeout(fn, seconds) {
    return setTimeout(function() {
      fn(seconds, timeouts[seconds]);
    }, seconds * 1000);
  };
  var handles = [];
  for (var seconds in timeouts) {
    if (timeouts.hasOwnProperty(seconds)) {
      handles.push(setSingleTimeout(handler, seconds));
    }
  }
  return {
    clear: function() {
      if (!handles) {
        return;
      }
      for (var i = 0; i < handles.length; i++) {
        clearTimeout(handles[i]);
      }
      handles = null;
    }
  };
}
