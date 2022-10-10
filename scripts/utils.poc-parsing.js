const fs = require('fs');
const path = require('path');
const { TruncateStrByLineNumber } = require('./analysis')

function ParseExpectedResult(libDirPath, prefix) {
  const expectedFilePathes = 
    fs.readdirSync(libDirPath, { withFileTypes: true })
      .filter(fileEx => fileEx.isFile())
      .filter(fileEx => fileEx.name.endsWith('.PoC.expected'))
      .map(fileEx => path.join(libDirPath, fileEx.name));

  const expectedExtensionFilePathes = 
    fs.readdirSync(libDirPath, { withFileTypes: true })
      .filter(fileEx => fileEx.isFile())
      .filter(fileEx => fileEx.name.endsWith('.PoC.ext.expected'))
      .map(fileEx => path.join(libDirPath, fileEx.name));

  function readPoCExpectedFile(filePath, prefix) {
    return fs.readFileSync(filePath, {encoding:'utf8'}).toString()
      .split(/\r?\n/)
      .map(row => {
        row = row.trim();
        if (prefix) {
          row = row.replace(prefix, '')
        }

        return row;
      })
      .filter(row => row != '')
      .map(row => TruncateStrByLineNumber(row));
  }
  
  return {
    major: new Set(expectedFilePathes.flatMap(x => readPoCExpectedFile(x, prefix))),
    minor: new Set(expectedExtensionFilePathes.flatMap(x => readPoCExpectedFile(x, prefix)))
  };
}

module.exports = {
  ParseExpectedResult
}
