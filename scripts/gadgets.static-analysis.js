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

const dbPath="../db/nodejs"
const sourcePath="../benchmark-nodejs/lib"
const queryDir="../codeql/js-queries"
const propertiesPath="../raw-data/gadgets.dynamic-analysis.csv"
const reportPath="../raw-data/gadgets.static-analysis.md"
const dataDir="../raw-data/gadgets.tmp/"

if (!fs.existsSync(dataDir)){
  fs.mkdirSync(dataDir);
}

const properties = fs.readFileSync(propertiesPath).split("\n");

console.info(`Run the analysis of ${properties.lenght} properties at ${new Date().toLocaleString()}`);
let timestamp = Date.now();

MarkdownGadgetHeaderReport(reportPath);

if (!ExistsDb(dbPath)) {
  try {
    console.info(`Creating DB ...`);
    CreateDb(dbPath, sourcePath, {
      includeTypeScript: true,
      includeNodeModules: true
    });
  }
  catch(err) {
    console.error();
    console.error(`Skip analysing (creating DB):`);
    console.error(err);
    process.exit(0);
  }
}

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
