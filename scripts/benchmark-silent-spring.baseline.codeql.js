const {
  ExistsDb,
  RemoveDb,
  CreateDb,
  AnalyzeDb,
  IsSuccessful,
  SimpleReport,
  MarkdownReport2,
  MarkdownBaselineHeaderReport,
  MarkdownBaselineRowReport,
  MarkdownBaselineFooterReport,
  GetDependence0,
  GetJSLoC
} = require("./analysis");
const { ParseExpectedResult } = require("./utils.poc-parsing");
const { extractLibDirs } = require("./utils");
const fs = require('fs');
const path = require('path');

// Parse command-line
// https://www.npmjs.com/package/minimist

var argv = require('minimist')(process.argv.slice(2), {
  alias: { l: 'limit' }
});

const serverSideDir="../benchmark-silent-spring";
const dbDir="../db";
const queryDir="../codeql/ql-baseline/javascript/ql/src/Security/CWE-915";
const reportPath="../raw-data/benchmark-silent-spring.baseline.codeql.md"

//argv._ = ["class_transformer_lib"] // for debug

let libDirs = argv._ && argv._.length > 0
  ? extractLibDirs(argv._, serverSideDir)
  : fs.readdirSync(serverSideDir, { withFileTypes: true })
      .filter(dirEx => dirEx.isDirectory())
      .filter(dirEx =>    // find *.PoC.expected files
        fs.readdirSync(path.join(serverSideDir, dirEx.name), { withFileTypes: true })
          .filter(fileEx => fileEx.isFile())
          .filter(fileEx => fileEx.name.endsWith('.PoC.expected'))
          .some(fileEx => // check that *.PoC.expected files are not empty
            fs.readFileSync(path.join(serverSideDir, dirEx.name, fileEx.name), {encoding:'utf8'}).toString()
              .split(/\r?\n/)
              .map(row => row.trim())
              .some(row => row != '')))
      .map(dirEx => dirEx.name);

if (argv.limit) {
  libDirs = libDirs.slice(0, argv.limit);
}

console.info(`Run at ${new Date().toLocaleString()}`);
let timestamp = Date.now();

const dumpInFile = true; //argv._ && argv._.length > 0 ? false : true;
if (dumpInFile) {
  MarkdownBaselineHeaderReport(reportPath);
}

const data = libDirs.map(libDir => {
  const dbPath = path.join(dbDir, libDir);
  const sourcePath = path.join(serverSideDir, libDir);
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
    const expectedResult = ParseExpectedResult(sourcePath);
    console.info(`    PrototypePollutingAssignment.ql`);
    const assignmentResult = AnalyzeDb(dbPath, path.join(queryDir, "PrototypePollutingAssignment.ql"));
    console.info(`    PrototypePollutingFunction.ql`);
    const functionResult = AnalyzeDb(dbPath, path.join(queryDir, "PrototypePollutingFunction.ql"));
    console.info(`    PrototypePollutingMergeCall.ql`);
    const mergeCallResult = AnalyzeDb(dbPath, path.join(queryDir, "PrototypePollutingMergeCall.ql"));
    const libData = {
        loc,
        libName: libDir,
        expectedResult,
        assignmentResult,
        functionResult,
        mergeCallResult,
    };

    if (dumpInFile) {
      MarkdownBaselineRowReport(reportPath, libData);
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

if (dumpInFile) {
  MarkdownBaselineFooterReport(reportPath, data, intervalSec);
}
else {
  //MarkdownReport2(data, intervalSec);
}

console.info(`Finish the analysis ${Math.round(intervalSec / 60 / 60 * 10) / 10} hrs (${intervalSec} sec) at ${new Date().toLocaleString()}`);
