const {
  AnalyzeDb4Gadgets,
  MarkdownGadgetHeaderReport,
  MarkdownGadgetRowReport,
  GetDependence0,
  GetJSLoC
} = require("./analysis");
const { extractLibDirs } = require("./utils");
const fs = require('fs');
const path = require('path');

// Parse command-line
// see https://github.com/tj/commander.js or https://www.npmjs.com/package/minimist

var argv = require('minimist')(process.argv.slice(2), {
  alias: { l: 'limit' }
});

const dbPath="../db-app/node_github_lib"
const queryDir="../codeql/js-queries"
const reportPath="../raw-data/nodejs-gadgets.md"
const dataDir="../raw-data/nodejs"

console.info(`Run at ${new Date().toLocaleString()}`);
let timestamp = Date.now();

MarkdownGadgetHeaderReport(reportPath);

const properties = [
  // "cwd",                      // + | 
  // "detached",                 // -
  // "uid",                      // +
  // "gid",                      // +
  // "shell",                    // + | +
  // "argv0",                    // +
  // "windowsHide",              // -
  // "windowsVerbatimArguments", // -
  // "env",                      // + | +
  // "NODE_V8_COVERAGE",         // + | 
  // "timeout",                  // - |
  // "killSignal",               // + |
  // "input",                    // + | +
  // "output",                   // - |
  // "errmap",                   // -

  // "main",                     // +? ModuleWrap, resolve, internalModuleReadJSON, _compileFunction, but all calls via the main package loading 
  // "1",                        // ? 1345 results (see _compileFunction in loader.js:1073)
  // "2",                        // - 141 results (url.js:253)
  // "encoding",                 // - 213 results
  // "signal",                   // -
  // "href",                     // +? ESM resolver
  // "errno",                    // - 8 results
  // "error",                    // -? 33 results included _compileFunction and resolve, but all looks like FPs
  // "loaded",                   // - 0 results
  // "NODE_V8_COVERAGE",         // +
  // "cachedData",               // + _compileFunction

  // "nullable",                     // - 0 results
  // "name",                         // -? 404 results (makeContext?)
  // "origin",                       // -? (makeContext?, HTTP2?)
  // "codeGeneration",               // -? (makeContext?)
  // "microtaskMode",                // -? (makeContext?)
  // "filename",                     // + _compileFunction
  // "cachedData",                   // + _compileFunction
  // "contextName",                  // -? (makeContext?)
  // "contextOrigin",                // -? (makeContext?)
  // "contextCodeGeneration",         // -? (makeContext?)
  //"timeout"                     // +? 47 results (we can pollute options.timeout in runInThisContext())
  "contextExtensions"
]

const originalQuery = fs.readFileSync(path.join(queryDir, "PrototypePollutingGadget.ql"), "utf-8");
const modifiedQuery = path.join(queryDir, "PrototypePollutingGadgetMod.ql");

const data = properties.map(prop => {
  //const loc = GetJSLoC(sourcePath, true);

  if (fs.existsSync(modifiedQuery)) {
    fs.unlinkSync(modifiedQuery);
  }

  fs.writeFileSync(modifiedQuery, originalQuery.replace('%PROP%', prop))

  try {
    console.info(`Analyzing ${dbPath} ...`);
    const result = AnalyzeDb4Gadgets(
      dbPath, 
      modifiedQuery,
      { outputPath: path.join(dataDir, `${prop}.out`) }
    );

    const sources = new Set(result.map(r => r.source));
    fs.writeFileSync(
      path.join(dataDir, `${prop}.sources`),
      [...sources].join('\n')
    );
    
    const sinks = new Set(result.map(r => r.sink));
    fs.writeFileSync(
      path.join(dataDir, `${prop}.sinks`),
      [...sinks].join('\n')
    );
    
    let data = {
      prop,
      sources,
      sinks
    }

    MarkdownGadgetRowReport(reportPath, data);
    return result;
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
