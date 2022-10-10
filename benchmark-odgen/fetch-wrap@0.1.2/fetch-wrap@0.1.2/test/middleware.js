/*
* mocha's bdd syntax is inspired in RSpec
*   please read: http://betterspecs.org/
*/
require('./util/globals');
const fetchWrap = require('../src/main');
const middleware = require('../src/middleware');

describe('fetchWrap/middleware', function() {
  function mockFetch(result) {
    const calls = [];
    const mockedFetch = function mockedFetch(url, options) {
      const call = { url: url, options: options };
      calls.push(call);
      return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
    };
    mockedFetch.calls = calls;
    return mockedFetch;
  };

  describe('#optionsByUrlPattern', function() {
    it('adds an option to a matching url', function() {
      const mockedFetch = mockFetch(123);
      const fetch = fetchWrap(mockedFetch, [
        middleware.optionsByUrlPattern([{
          for: 'http://localhost/*',
          options: {
            headers: {
              Authorization: 'Token qwerty'
            }
          }
        }])
      ]);
      return fetch('http://localhost/fake-url').then(function(result) {
        expect(mockedFetch.calls[0].options).to.eql({
          headers: {
            Authorization: 'Token qwerty'
          }
        });
      });
    });
    it('doesn\'t affect unmatching url', function() {
      const mockedFetch = mockFetch(123);
      const fetch = fetchWrap(mockedFetch, [
        middleware.optionsByUrlPattern([{
          for: 'http://localhost/*',
          options: {
            headers: {
              Authorization: 'Token qwerty'
            }
          }
        }])
      ]);
      return fetch('http://somedomain.com/fake-url').then(function(result) {
        expect(mockedFetch.calls[0].options).to.eql({});
      });
    });
  });

  describe('#logger', function() {
    function serialize() {
      return Array.prototype.slice.call(arguments).map(function(item) {
        if (typeof item === 'object') {
          return JSON.stringify(item);
        }
        return item;
      }).join(' ');
    }
    it('logs request and success', function() {
      const mockedFetch = mockFetch(123);
      const output = [];
      const fetch = fetchWrap(mockedFetch, [
        middleware.logger({
          success: true,
          log: function() { output.push(serialize.apply(this, arguments)); }
        })
      ]);
      return fetch('http://localhost/fake-url').then(function(result) {
        expect(output).to.eql([
          'debug [fetch] GET http://localhost/fake-url start',
          'debug [fetch] GET http://localhost/fake-url success'
        ]);
      });
    });
    it('logs request and error', function() {
      const mockedFetch = mockFetch(new Error('request failed'));
      const output = [];
      const fetch = fetchWrap(mockedFetch, [
        middleware.logger({
          log: function() { output.push(serialize.apply(this, arguments)); }
        })
      ]);
      return fetch('http://localhost/fake-url').catch(function(err) {
        /* swallow error */
        err = null;
      }).then(function(result) {
        expect(output).to.eql([
          'debug [fetch] GET http://localhost/fake-url start',
          'error [fetch] GET http://localhost/fake-url failed {"message":"request failed"}'
        ]);
      });
    });
    it('logs multiple timeouts', function() {
      const mockedFetch = mockFetch(new Promise(function(resolve) {
        // take 1 second to respond
        setTimeout(function() {
          resolve(123);
        }, 400);
      }));
      const output = [];
      const fetch = fetchWrap(mockedFetch, [
        middleware.logger({
          log: function() { output.push(serialize.apply(this, arguments)); }
        })
      ]);
      return fetch('http://localhost/fake-url', {
        timeouts: {
          0.1: 'warn',
          0.3: 'error'
        }
      }).then(function(result) {
        expect(output).to.eql([
          'debug [fetch] GET http://localhost/fake-url start',
          'warn [fetch] GET http://localhost/fake-url timeout 0.1',
          'error [fetch] GET http://localhost/fake-url timeout 0.3'
        ]);
      });
    });
    it('doesn\'t log timeouts after success', function() {
      const mockedFetch = mockFetch(new Promise(function(resolve) {
        // take 1 second to respond
        setTimeout(function() {
          resolve(123);
        }, 200);
      }));
      const output = [];
      const fetch = fetchWrap(mockedFetch, [
        middleware.logger({
          success: true,
          log: function() { output.push(serialize.apply(this, arguments)); }
        })
      ]);
      return fetch('http://localhost/fake-url', {
        timeouts: {
          0.1: 'warn',
          0.3: 'error'
        }
      }).then(function(result) {
        expect(output).to.eql([
          'debug [fetch] GET http://localhost/fake-url start',
          'warn [fetch] GET http://localhost/fake-url timeout 0.1',
          'debug [fetch] GET http://localhost/fake-url success'
        ]);
      });
    });
    it('doesn\'t log timeouts after error', function() {
      const mockedFetch = mockFetch(new Promise(function(resolve, reject) {
        // take 1 second to respond
        setTimeout(function() {
          reject(new Error('request failed'));
        }, 200);
      }));
      const output = [];
      const fetch = fetchWrap(mockedFetch, [
        middleware.logger({
          success: true,
          log: function() { output.push(serialize.apply(this, arguments)); }
        })
      ]);
      return expect(fetch('http://localhost/fake-url', {
        timeouts: {
          0.1: 'warn',
          0.3: 'error'
        }
      })).to.eventually.be.rejectedWith('request failed').then(function() {
        expect(output).to.eql([
          'debug [fetch] GET http://localhost/fake-url start',
          'warn [fetch] GET http://localhost/fake-url timeout 0.1',
          'error [fetch] GET http://localhost/fake-url failed {"message":"request failed"}'
        ]);
      });
    });
    it('logs elapsed', function() {
      const mockedFetch = mockFetch(123);
      const output = [];
      const fetch = fetchWrap(mockedFetch, [
        middleware.logger({
          success: true,
          elapsed: true,
          log: function(...args) {
            if (typeof args[args.length - 1] === 'number') {
              output.push(serialize.apply(this, args.slice(0, -1)), args[args.length - 1]);
              return;
            }
            output.push(serialize.apply(this, arguments));
          }
        })
      ]);
      return fetch('http://localhost/fake-url').then(function(result) {
        expect(output.slice(0, -1)).to.eql([
          'debug [fetch] GET http://localhost/fake-url start',
          'debug [fetch] GET http://localhost/fake-url success'
        ]);
        expect(output[2]).to.be.gte(0);
        expect(output[2]).to.be.lt(0.5);
      });
    });
  });

  describe('#urlParams', function() {
    it('fills url tokens', function() {
      const mockedFetch = mockFetch(123);
      const fetch = fetchWrap(mockedFetch, [
        middleware.urlParams({
          id: 57,
          section: 'settings'
        })
      ]);
      return fetch('http://localhost/users/{id}/{section}').then(function(result) {
        expect(mockedFetch.calls[0].url).to.eql(
          'http://localhost/users/57/settings'
        );
      });
    });
    it('fills with additional params', function() {
      const mockedFetch = mockFetch(123);
      const fetch = fetchWrap(mockedFetch, [
        middleware.urlParams({
          id: 57
        })
      ]);
      return fetch('http://localhost/users/{id}/{section}', {
        params: {
          section: 'notifications',
          token: 1234,
          'email': 'john@smith.com'
        }
      }).then(function(result) {
        expect(mockedFetch.calls[0].url).to.eql(
          'http://localhost/users/57/notifications?token=1234&email=john%40smith.com'
        );
      });
    });
    it('fails if token couldn\'t be replaced', function() {
      const mockedFetch = mockFetch(123);
      const fetch = fetchWrap(mockedFetch, [
        middleware.urlParams({
          id: 57
        })
      ]);
      return expect(fetch('http://localhost/users/{id}/{section}', {
        params: {
          token: 1234,
          'email': 'john@smith.com'
        }
      })).to.eventually.be.rejectedWith('url param not found: {section}');
    });
    it('double curly brackets is the way to use curly bracket in the url', function() {
      const mockedFetch = mockFetch(123);
      const fetch = fetchWrap(mockedFetch, [
        middleware.urlParams({
          id: 57
        })
      ]);
      return fetch('http://localhost/users/{id}/{{section}}').then(function(result) {
        expect(mockedFetch.calls[0].url).to.eql(
          'http://localhost/users/57/{section}'
        );
      });
    });
    it('fail is missing can be disabled', function() {
      const mockedFetch = mockFetch(123);
      const fetch = fetchWrap(mockedFetch, [
        middleware.urlParams({
          id: 57
        }, false)
      ]);
      return expect(fetch('http://localhost/users/{id}/{section}', {
        params: {
          token: 1234,
          'email': 'john@smith.com'
        }
      })).to.eventually.eql(123);
    });
  });

  describe('#sendJSON', function() {
    it('sends body as JSON', function() {
      const mockedFetch = mockFetch(123);
      const fetch = fetchWrap(mockedFetch, [
        middleware.sendJSON()
      ]);
      return fetch('http://localhost/users', {
        method: 'POST',
        body: {
          name: 'john'
        }
      }).then(function() {
        expect(mockedFetch.calls[0].options).to.eql({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: '{"name":"john"}'
        });
      });
    });
  });

  describe('#receiveJSON', function() {
    it('receives JSON responses', function() {
      const mockedFetch = mockFetch({
        ok: true,
        headers: {
          get: function(name) {
            if (name === 'content-type') {
              return 'application/json';
            }
          }
        },
        text: function() {
          return Promise.resolve('{"name":"john","birthdate":"1936-03-01T00:00:00.000Z"}');
        }
      });
      const fetch = fetchWrap(mockedFetch, [
        middleware.receiveJSON()
      ]);
      return fetch('http://localhost/users').then(function(result) {
        expect(result).to.eql({
          name: 'john',
          birthdate: new Date(Date.UTC(1936, 2, 1))
        });
      });
    });
    it('fails on http errors', function() {
      const mockedFetch = mockFetch({
        ok: false,
        status: 403,
        statusText: 'Not Authorized'
      });
      const fetch = fetchWrap(mockedFetch, [
        middleware.receiveJSON()
      ]);
      return expect(fetch('http://localhost/users')).to.eventually
        .be.rejectedWith('http error 403: Not Authorized');
    });
  });

  describe('#testing', function() {
    it('fails if not mocked', function() {
      const mockedFetch = mockFetch(123);
      const fetch = fetchWrap(mockedFetch, [
        middleware.testing({
        })
      ]);
      return expect(fetch('http://localhost/users', { method: 'PUT' }))
        .to.eventually.be.rejectedWith('[fetch] request mock not found for: http://localhost/users');
    });
    it('can mock the response', function() {
      const mockedFetch = mockFetch(123);
      const fetch = fetchWrap(mockedFetch, [
        middleware.testing({
          mock: 321
        })
      ]);
      return fetch('http://localhost/users', { method: 'PUT' })
        .then(function(result) {
          expect(result).to.eql(321);
        });
    });
    it('can spy requests', function() {
      const mockedFetch = mockFetch(123);
      const spyLog = [];
      const fetch = fetchWrap(mockedFetch, [
        middleware.testing({
          spy: function() {
            spyLog.push(Array.prototype.slice.apply(arguments));
          },
          mock: 321
        })
      ]);
      return fetch('http://localhost/users', { method: 'PUT' })
        .then(function(result) {
          expect(spyLog).to.eql([
            ['http://localhost/users', { method: 'PUT' }]
          ]);
        });
    });
  });
});
