var dateRegex = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d*))?(Z|([+-])(\d{2}):?(\d{2}))?$/;

// use as 2nd parameter for JSON.parse to revive Date instances
module.exports = function dateReviver(key, value) {
  if (typeof value === 'string') {
    var parts = dateRegex.exec(value);
    if (parts) {
      return new Date(Date.UTC(+parts[1], +parts[2] - 1, +parts[3], +parts[4],
        +parts[5], +parts[6] || 0, +(parts[7] || 0)));
    }
  }
  return value;
};
