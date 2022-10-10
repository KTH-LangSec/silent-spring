/*
* mocha's bdd syntax is inspired in RSpec
*   please read: http://betterspecs.org/
*/
require('./util/globals');
const fetchWrap = require('../src/main');

describe('fetchWrap', function() {
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

  describe('.merge', function() {
    it('merges non objects', function() {
      const result = fetchWrap.merge(false, 32, 'hi', 'bye');
      expect(result).to.eql('bye');
    });
    it('merges multiple nested objects', function() {
      const result = fetchWrap.merge(false, {}, {
        parameters: {
          from: 1,
          options: {
            a: 1
          }
        }
      }, {
        parameters: {
          to: 3
        }
      }, {
        parameters: {
          options: null
        },
        top: 5
      });
      expect(result).to.eql({
        parameters: {
          from: 1,
          to: 3,
          options: null
        },
        top: 5
      });
    });
  });

  describe('.extend', function() {
    it('does nothing without middleware added', function() {
      const mockedFetch = mockFetch(123);
      const fetch = fetchWrap(mockedFetch, []);
      expect(fetch).to.eql(mockedFetch);
    });

    describe('modifying params', function() {
      it('url', function() {
        const mockedFetch = mockFetch(123);
        const fetch = fetchWrap(mockedFetch, [function(url, options, fetch) {
          return fetch(url.replace(/^http:/, 'https:'), options);
        }]);
        return fetch('http://localhost/fake-url').then(function(result) {
          expect(result).to.eql(123);
          expect(mockedFetch.calls).to.have.length(1);
          expect(mockedFetch.calls[0].url).to.eql('https://localhost/fake-url');
        });
      });

      it('options', function() {
        const mockedFetch = mockFetch(123);
        const fetch = fetchWrap(mockedFetch, [function(url, options, fetch) {
          options.method = 'DELETE';
          return fetch(url, options);
        }]);
        return fetch('http://localhost/fake-url', { method: 'PUT', mode: 'cors' })
          .then(function(result) {
            expect(result).to.eql(123);
            expect(mockedFetch.calls).to.have.length(1);
            expect(mockedFetch.calls[0].options).to.eql({ method: 'DELETE', mode: 'cors' });
          });
      });

      it('options (even if not specified)', function() {
        const mockedFetch = mockFetch(123);
        const fetch = fetchWrap(mockedFetch, [function(url, options, fetch) {
          options.method = 'DELETE';
          return fetch(url, options);
        }]);
        return fetch('http://localhost/fake-url').then(function(result) {
          expect(result).to.eql(123);
          expect(mockedFetch.calls).to.have.length(1);
          expect(mockedFetch.calls[0].options).to.eql({ method: 'DELETE' });
        });
      });
    });

    describe('modifying result', function() {
      it('wrap result', function() {
        const mockedFetch = mockFetch(123);
        const fetch = fetchWrap(mockedFetch, [function(url, options, fetch) {
          return fetch(url, options).then(function(result) {
            return { resultWas: result };
          });
        }]);
        return expect(fetch('http://localhost/fake-url')).to.eventually
          .deep.equal({ resultWas: 123 });
      });

      it('wrap result, ignore errors', function() {
        const mockedFetch = mockFetch(new Error('request failed'));
        const fetch = fetchWrap(mockedFetch, [function(url, options, fetch) {
          return fetch(url, options).then(function(result) {
            return { resultWas: result };
          });
        }]);
        return expect(fetch('http://localhost/fake-url')).to.eventually
          .be.rejectedWith('request failed');
      });

      it('wrap error', function() {
        const mockedFetch = mockFetch(new Error('request failed'));
        const fetch = fetchWrap(mockedFetch, [function(url, options, fetch) {
          return fetch(url, options).catch(function(err) {
            throw new Error('error was: ' + err.message);
          });
        }]);
        return expect(fetch('http://localhost/fake-url')).to.eventually
          .be.rejectedWith('error was: request failed');
      });
      it('wrap error, ignore success', function() {
        const mockedFetch = mockFetch(123);
        const fetch = fetchWrap(mockedFetch, [function(url, options, fetch) {
          return fetch(url, options).catch(function(err) {
            return { errorWas: err };
          });
        }]);
        return expect(fetch('http://localhost/fake-url')).to.eventually
          .eql(123);
      });
    });
    describe('multiple middlewares', function() {
      it('compose params and result changes', function() {
        const mockedFetch = mockFetch(123);
        const fetch = fetchWrap(mockedFetch, [function(url, options, fetch) {
          return fetch(url + '/path1', fetchWrap.merge(options, {
            headers: {
              Authorization: 'Token qwerty'
            }
          })).then(function(result) {
            return result + 'a';
          });
        }, function(url, options, fetch) {
          return fetch(url + '/path2', fetchWrap.merge(options, {
            headers: {
              'Content-Type': 'text/plain'
            }
          })).then(function(result) {
            return result + 'b';
          });
        }, function(url, options, fetch) {
          return fetch(url + '/path3', fetchWrap.merge(options, {
            headers: {
              Accept: 'application/json'
            }
          })).then(function(result) {
            return result + 'c';
          });
        }]);
        return expect(fetch('http://localhost/fake-url')).to.eventually
          .eql('123cba').then(function() {
            expect(mockedFetch.calls[0].url).to.eql('http://localhost/fake-url/path1/path2/path3');
            expect(mockedFetch.calls[0].options).to.eql({
              headers: {
                Authorization: 'Token qwerty',
                'Content-Type': 'text/plain',
                Accept: 'application/json'
              }
            });
          });
      });

      it('compose errors', function() {
        const mockedFetch = mockFetch(new Error('request failed'));
        const fetch = fetchWrap(mockedFetch, [function(url, options, fetch) {
          return fetch(url, options).catch(function(err) {
            throw new Error('oops1: ' + err.message);
          });
        }, function(url, options, fetch) {
          return fetch(url, options).catch(function(err) {
            throw new Error('oops2: ' + err.message);
          });
        }, function(url, options, fetch) {
          return fetch(url, options).catch(function(err) {
            throw new Error('oops3: ' + err.message);
          });
        }]);
        return expect(fetch('http://localhost/fake-url')).to.eventually
          .be.rejectedWith('oops1: oops2: oops3: request failed');
      });
    });
  });
});

require('./middleware');
