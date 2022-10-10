
const parser = require("yargs-parser");
parser("--foo.__proto__.polluted yes", { 
  array: ["foo.__proto__.polluted"]
});

// the line 585 isn't explaitable because 
// if o[key] === undefined is false for Object.prototype, then checkAllAliases(key, flags.bools) is true for the same key from Object.prototype
