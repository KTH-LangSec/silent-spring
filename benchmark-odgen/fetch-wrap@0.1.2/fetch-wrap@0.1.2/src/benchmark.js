var Benchmark = require('benchmark');
var suite = new Benchmark.Suite();

const fetchExtend = require('./main');
const middleware = require('./middleware');

const http = require('http');
const port = process.env.PORT || 8080;

const fetch = require('fetch-ponyfill')().fetch;

const logBuffer = [];
const extendedFetch = fetchExtend(fetch, [
  middleware.urlParams({
    host: 'localhost'
  }),
  middleware.optionsByUrlPattern([
    {
      for: 'http://localhost*',
      options: {
        headers: {
          'Authorization': 'Token 1234'
        }
      }
    }
  ]),
  middleware.sendJSON(),
  middleware.receiveJSON(),
  middleware.logger({
    log: function() {
      // log to memory buffer
      logBuffer.push(arguments);
    }
  })
]);

// add tests
suite.add('fetch GET json', function(deferred) {
  fetch('http://localhost:8080/test', {
    headers: {
      Authorization: 'Token 1234'
    },
    timeouts: {
      '1': 'warn'
    }
  })
    .then(function(response) {
      if (response.ok) {
        return response.json();
      }
    }).then(validateResult).then(function() {
      deferred.resolve();
    });
}, { defer: true })
  .add('extended fetch GET json', function(deferred) {
    extendedFetch('http://{host}:8080/test')
      .then(validateResult)
      .then(function() {
        deferred.resolve();
      });
  }, { defer: true })

// add listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
    process.exit(0);
  });

function validateResult(result) {
  if (!result || !result.name === 'john') {
    throw new Error('invalid result');
  }
  return result;
}

const server = http.createServer(function(req, res) {
  var token = req.headers && req.headers.authorization;
  if (token !== 'Token 1234') {
    console.log(req.headers);
    throw new Error('auth failed' + token);
  }
  res.setHeader('Content-Type', 'application/json');
  res.end('{"name":"john"}');
});
server.listen(port, function() {
  // run async
  suite.run({ 'async': false });
});
