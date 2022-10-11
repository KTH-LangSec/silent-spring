const {
  ExistsDb,
  RemoveDb,
  CreateDb,
  ParseExpectedResult,
  AnalyzeDb,
  IsSuccessful,
  SimpleReport,
  MarkdownReport2,
  MarkdownHeaderReport,
  MarkdownRowReport,
  MarkdownFooterReport,
  GetDependence0,
  GetJSLoC
} = require("./analysis");
const { extractLibDirs } = require("./utils");
const fs = require('fs');
const path = require('path');

// Parse command-line
// https://www.npmjs.com/package/minimist

var argv = require('minimist')(process.argv.slice(2), {
  alias: { l: 'limit' }
});

const serverSideDir="../benchmark-odgen";
const dbDir="../db";
const queryDir="../codeql/js-queries";
const reportPath="../raw-data/benchmark-odgen.codeql.md"

//argv._ = ["dot_object_lib"] // for debug
//argv.limit = 1;

let libDirs = argv._ && argv._.length > 0
  ? extractLibDirs(argv._, serverSideDir)
  : findLibDirs(serverSideDir);

if (argv.limit) {
  libDirs = libDirs.slice(0, argv.limit);
}

console.info(`Run at ${new Date().toLocaleString()}`);
let timestamp = Date.now();

const dumpInFile = argv._ && argv._.length > 0 ? false : true;
if (dumpInFile) {
  MarkdownHeaderReport(reportPath, true);
}

const data = libDirs.map(libDir => {
  const dbPath = path.join(dbDir, libDir);
  const sourcePath = path.join(serverSideDir, libDir, libDir);
  const loc = GetJSLoC(sourcePath, true);
  if (!ExistsDb(dbPath)) {
    try {
      console.info(`Creating DB ${libDir} ...`);
      CreateDb(dbPath, sourcePath, {
        includeTypeScript: false,
        includeNodeModules: true
      });
    }
    catch(err) {
      console.error();
      console.error(`Skip analysing ${libDir} (creating DB):`);
      console.error(err);
      return undefined;
    }
  }

  try {
    console.info(`Analyzing ${dbPath} ...`);
    const expectedResult = undefined; //ParseExpectedResult(expectedResultPath);
    console.info(`    PrototypePolluting.ql`);
    const exportFuncResult = AnalyzeDb(dbPath, path.join(queryDir, "PrototypePolluting.ql"));
    console.info(`    PrototypePollutingHighPriority.ql`);
    const exportFuncHighPriorityResult = AnalyzeDb(dbPath, path.join(queryDir, "PrototypePollutingHighPriority.ql"));
    console.info(`    PrototypePollutingAnyFuncArgIsSource.ql`);
    const anyFuncResult = AnalyzeDb(dbPath, path.join(queryDir, "PrototypePollutingAnyFuncArgIsSource.ql"));
    console.info(`    PrototypePollutingAnyFuncArgIsSourceHighPriority.ql`);
    const anyFuncHighPriorityResult = AnalyzeDb(dbPath, path.join(queryDir, "PrototypePollutingAnyFuncArgIsSourceHighPriority.ql"));
    const libData = {
        loc,
        libName: libDir,
        expectedResult,
        exportFuncResult,
        exportFuncHighPriorityResult,
        anyFuncResult,
        anyFuncHighPriorityResult
    };

    if (dumpInFile) {
      MarkdownRowReport(reportPath, libData);
    }

    return libData;
  }
  catch(err) {
    console.error();
    console.error(`Skip analyzing ${libDir} (analyzing DB):`);
    console.error(err);
    return undefined;
  }
})
.filter(libData => libData != undefined);

let intervalSec = Math.round((Date.now() - timestamp) / 1000);

// if (dumpInFile) {
//   MarkdownFooterReport(reportPath, data, intervalSec);
// }
// else {
//   MarkdownReport2(data, intervalSec);
// }

console.info(`Finish the analysis ${Math.round(intervalSec / 60 / 60 * 10) / 10} hrs (${intervalSec} sec) at ${new Date().toLocaleString()}`);

function findLibDirs(root) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(dirEx => dirEx.isDirectory())
    .map(dirEx => dirEx.name);
}
