const {
  ExistsDb,
  RemoveDb,
  CreateDb,
  ParseExpectedResult,
  AnalyzeDb,
  IsSuccessful,
  MarkdownAppRowReport,
  MarkdownAppHeaderReport,
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

const serverSideDir="../benchmark-popular-apps";
const dbDir="../db-app";
const queryDir="../codeql/js-queries";
const reportPath="../raw-data/benchmark-popular-apps.codeql.md"

// list apps:
// argv._ = [
//   //"cli", 
//   "parse-server"
// ]

let libDirs = argv._ && argv._.length > 0
  ? extractLibDirs(argv._, serverSideDir)
  : fs.readdirSync(serverSideDir, { withFileTypes: true })
      .filter(dirEx => dirEx.isDirectory())
      .map(dirEx => dirEx.name);

if (argv.limit) {
  libDirs = libDirs.slice(0, argv.limit);
}

console.info(`Run at ${new Date().toLocaleString()}`);
let timestamp = Date.now();

MarkdownAppHeaderReport(reportPath);

const data = libDirs.map(libDir => {
  const dbPath = path.join(dbDir, libDir);
  const sourcePath = path.join(serverSideDir, libDir);
  const loc = GetJSLoC(sourcePath, true);
  if (!ExistsDb(dbPath)) {
    try {
      console.info(`Creating DB ${libDir} ...`);
      CreateDb(dbPath, sourcePath, {
        includeTypeScript: true,
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
    console.info(`    PrototypePollutingAnyFuncArgIsSourceHighPriority.ql`);
    const anyFuncHighPriorityResult = AnalyzeDb(
      dbPath, 
      path.join(queryDir, "PrototypePollutingAnyFuncArgIsSourceHighPriority.ql"),
      { outputPath: path.join(dbDir, `${libDir}-priority.out`) }
    );
    
    const libData = {
        loc,
        libName: libDir,
        anyFuncHighPriorityResult
    };

    MarkdownAppRowReport(reportPath, libData);
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

//MarkdownFooterReport(reportPath, data, intervalSec);

console.info(`Finish the analysis ${Math.round(intervalSec / 60 / 60 * 10) / 10} hrs (${intervalSec} sec) at ${new Date().toLocaleString()}`);
