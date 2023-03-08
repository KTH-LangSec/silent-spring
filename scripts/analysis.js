const fs = require('fs');
const parse = require('csv-parse/lib/sync')
const { execSync } = require('child_process');
const path = require('path');

const codeql = 'codeql'

function ExistsDb(dbPath) {
  return fs.existsSync(dbPath);
}

function RemoveDb(dbPath) {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)){
    fs.mkdirSync(dbDir);
  }

  if (fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    console.error("Not deleted the DB " + dbPath);
    return false;
  }

  return true;
}

function round2(num) {
  return Math.round(num * 100) / 100
}

function round1(num) {
  return Math.round(num * 10) / 10
}


function GetDependence0(serverSideDir, libDir) {
  const packagePath = path.join(serverSideDir, libDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath));
  const dependencies = Object.keys(packageJson.dependencies);
  if (dependencies.length == 0) {
    console.error(`Skip analysing ${libDir}: No dependencies in package.json`);
    return undefined;
  }

  if (dependencies.length > 1) {
    console.error(`Skip analysing ${libDir}: ${dependencies.length} dependencies in package.json`);
    return undefined;
  }

  return dependencies[0];
}

function GetJSLoC(sourceDir, includeModules) {
  try {
    const cloc = "cloc";
    const output = execSync(
      `${cloc} --include-lang=JavaScript,TypeScript --timeout 15 -json ` +
      (includeModules ? '' : '--exclude-dir=node_modules ') +
      sourceDir
    ).toString()

    return JSON.parse(output).SUM.code;
  } catch(error) {
    return undefined;
  }
}

function CreateDb(dbPath, sourceDir, options = {}) {
  const defaultLgtmIndexFilters = `include:/
exclude:**/*.min.js
exclude:**/*-min.js
exclude:**/*.mjs
exclude:**/compress/`
  let env = {
    LGTM_INDEX_FILTERS: defaultLgtmIndexFilters
  }

  if (options.includeTypeScript === false) {
    env.LGTM_INDEX_FILTERS += '\nexclude:**/*.ts'
  }

  if (options.includeNodeModules === false) {
    env.LGTM_INDEX_FILTERS += '\nexclude:node_modules\nexclude:**/node_modules/typescript/'
  }

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)){
    fs.mkdirSync(dbDir);
  }

  execSync(
    `${codeql} database create ${dbPath} --source-root ${sourceDir} --language=javascript`, 
    { env }
  );
}

function AnalyzeDbRaw(dbPath, queryPath, options = {}) {
  try {
    const outputPath = options.outputPath || "./output.csv";
    const libPath = options.libPath || "../codeql/ql";
    const codeqlPath = options.codeql || codeql;

    if (!options.outputPath && fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    if (!fs.existsSync(outputPath)) {
      //var result = execSync(`${codeql} query run --database=${dbPath} --search-path=${libPath} -- ${queryPath}`).toString();
      //codeql database analyze db\\js-tests.db js-queries\\PrototypePolluting.ql --format=csv --output=test.csv --search-path=codeql
      execSync(`${codeqlPath} database analyze ${dbPath} ${queryPath} --search-path=${libPath} --format=csv --output=${outputPath} --timeout=1200 --threads=0 --ram=10024 --rerun --quiet`);
    }

    const rows = parse(fs.readFileSync(outputPath), {
      columns: false,
      skip_empty_lines: true
    });

    if (!options.outputPath) {
      fs.unlinkSync(outputPath);
    }

    return rows;
  }
  catch(err) {
    console.error();
    console.error(`Error analyzing ${dbPath} by ${queryPath} (analyzing DB):`);
    console.error(err);
    return new Set();
  }
}

function AnalyzeDb(dbPath, queryPath, options = {}) {
  const rows = AnalyzeDbRaw(dbPath, queryPath, options);

  return new Set(rows
    .map(row => {
      const l = row.length;
      const fileName = row[l - 5].trim()
        .replace(/^\/+/g, '');     // trim the started character `/`
      const n1 = row[l - 4];
      const n2 = row[l - 3];
      const n3 = row[l - 2];
      const n4 = row[l - 1];
      return `${fileName}:${n1}:${n2}:${n3}:${n4}`;
    }));
}

function AnalyzeDb4Gadgets(dbPath, queryPath, options = {}) {
  const rows = AnalyzeDbRaw(dbPath, queryPath, options);

  return rows
    .flatMap(row => {
      const l = row.length;
      const messages = row[l - 6].trim();
      return messages        
        .split('\n')
        .map(m => m.trim())
        .map(m => {
          const sourceAndSink = m.match(/^(.+) -> \[.*\] -> (.+)$/);

          const sourceRaw = sourceAndSink[1];
          const sourceGroups = sourceRaw.match(/^\[\[\"(.+)\"\|\"[^\"\]]*\"\]\] \((.+)\)/)
          const source = `${sourceGroups[1]} (${sourceGroups[2]})`

          const sinkRaw = sourceAndSink[2];
          const sink = sinkRaw.match(/^\[\[\"(.+)\"\|\"[^\"\]]*\"\]\]/)[1]

          return {
            source,
            sink
          };
        })
    });
}

function IsSuccessful(result, expectedResult) {
  const falseNegativeCases = [...expectedResult].filter(item => !result.has(item));
  return falseNegativeCases.length == 0;
}

function SimpleReport(result, expectedResult) {
  const falseNegativeCases = [...expectedResult].filter(item => !result.has(item));
  const falsePositiveCases = [...result].filter(item => !expectedResult.has(item));

  console.info();
  if (falseNegativeCases.length == 0) {
    console.info(`SUCCESS (${expectedResult.size})`);
  }
  else {
    console.error("FAIL");
    console.info(`False Nagatives Cases (${falseNegativeCases.length}):`)
    falseNegativeCases.forEach(item => {
      console.info(item);
    });

    console.info();
  }

  if (falsePositiveCases.length > 0) {
    console.info(`False Positive Cases (${falsePositiveCases.length}):`)

    falsePositiveCases.forEach(item => {
      console.info(`${item}`);
    });
  }


  console.info("---------------------------------------------------")
}

//////////////////////////////////////////
// Expected data format: 
// {
//   libName: libDir,
//   queryName: "PrototypePolluting.ql",
//   result,
//   expectedResult
// };
function MarkdownReport1(data) {
  console.info();
  console.info();
  console.info();

  // HEADER
  console.info("Library            | True positive | False positive");
  console.info("-------------------|---------------|---------------");

  data.forEach(libData => {
    const result = libData.result;
    const expectedResult = libData.expectedResult;
    const falseNegativeCases = [...expectedResult].filter(item => !result.has(item));
    const falsePositiveCases = [...result].filter(item => !expectedResult.has(item));

    let row = `${libData.libName.replace(/(_lib)$/, '')} | `;
    if (falseNegativeCases.length == 0 && expectedResult.size > 0) {
      // https://github.com/ikatyang/emoji-cheat-sheet/blob/master/README.md
      if (libData.queryName.endsWith('AnyFuncArgIsSource.ql')) {
        row += `:confused:`;
      }
      else {
        row += `:tada:`; 
      }

      row += `${libData.queryName} (${expectedResult.size}/${expectedResult.size}) | `;
    }
    else {
      row += `:sos: ${libData.queryName} (${expectedResult.size - falseNegativeCases.length}/${expectedResult.size})<br>`;
      if (falseNegativeCases.length > 0) {
        row += `**False Negative Cases:**`;
        falseNegativeCases.forEach(c => {
          row += `<br>${falseNegativeCases}`;
        });
      }

      row += ` | `;
    }

    if (falsePositiveCases.length == 0) {
      row += `:white_check_mark:`;
    }
    else {
      row += `:monocle_face: *${falsePositiveCases.length} case(s):*`;
      
      var summary = {};
      falsePositiveCases.forEach(item => {
        var fileName = item.split(':')[0];
        if (summary[fileName] === undefined) {
          summary[fileName] = 1;
        }
        else {
          summary[fileName]++;
        }
      });
  
      Object.entries(summary).sort().forEach(item => {
        row += `<br>${item[0].replace(/^(node_modules)/, '')} (${item[1]})`;
      });
    }
  
    console.info(row);
  });

  console.info();
}

function MarkdownHeaderReport(path, dataOnly) {
  fs.writeFileSync(path, BuildHeader(dataOnly) + '\n');
}

function MarkdownBaselineHeaderReport(path) {
  fs.writeFileSync(path, BuildBaselineHeader() + '\n');
}

function MarkdownODGenHeaderReport(path, dataOnly) {
  fs.writeFileSync(path, BuildODGenHeader(dataOnly) + '\n');
}

function MarkdownAppHeaderReport(path) {
  fs.writeFileSync(path, BuildAppHeader() + '\n');
}

function MarkdownGadgetHeaderReport(path) {
  fs.writeFileSync(path, BuildGadgetHeader() + '\n');
}


function MarkdownRowReport(path, libData) {
  fs.appendFileSync(path, BuildRow(libData) + '\n');
}

function MarkdownBaselineRowReport(path, libData) {
  fs.appendFileSync(path, BuildBaselineRow(libData) + '\n');
}

function MarkdownODGenRowReport(path, libData) {
  fs.appendFileSync(path, BuildODGenRow(libData) + '\n');
}

function MarkdownAppRowReport(path, data) {
  fs.appendFileSync(path, BuildAppRow(data) + '\n');
}

function MarkdownGadgetRowReport(path, data) {
  fs.appendFileSync(path, BuildGadgetRow(data) + '\n');
}

//////////////////////////////////////////
// Expected data format: 
// {
//   libName: libDir,
//   exportFuncFalseNegativeCount,
//   exportFuncFalsePositiveCount,
//   anyFuncFalseNegativeCount,
//   anyFuncFalsePositiveCount
// }
function MarkdownFooterReport(path, summary, intervalSec) {
  fs.appendFileSync(path, BuildFooter(summary, intervalSec) + '\n');
}

function MarkdownBaselineFooterReport(path, summary, intervalSec) {
  fs.appendFileSync(path, BuildBaselineFooter(summary, intervalSec) + '\n');
}

function MarkdownBaselineFooterReport(path, summary, intervalSec) {
  fs.appendFileSync(path, BuildBaselineFooter(summary, intervalSec) + '\n');
}

function MarkdownODGenFooterReport(path, summary, intervalSec) {
  fs.appendFileSync(path, BuildODGenFooter(summary, intervalSec) + '\n');
}


//////////////////////////////////////////
// Expected data format: 
// {
//   libName: libDir,
//   expectedResult,
//   exportFuncResult,
//   anyFuncResult
// };
function MarkdownReport2(data, intervalSec) {
  console.info();
  console.info();
  console.info();

  // HEADER
  console.info(BuildHeader());

  data.forEach(libData => {
    console.info(BuildRow(libData));
  });

  console.info(BuildFooter(data, intervalSec));
  console.info();
}

function BuildHeader(dataOnly) {
  if (!dataOnly)
    return "Package        | Exported Func <br/> Priority <br/> TP | Exported Func <br/> Priority <br/> FP | Any Func <br/> Priority <br/> TP | Any Func <br/> Priority <br/> FP | Exported Func <br/> General <br/> TP | Exported Func <br/> General <br/> FP | Any Func <br/> General <br/> TP | Any Func <br/> General <br/> FP \n" +
           "---------------|---------------------------------------|---------------------------------------|----------------------------------|----------------------------------|--------------------------------------|--------------------------------------|---------------------------------|----------------------------------";
  else
    return "Package        | Exported Func <br/> Priority | Any Func <br/> Priority | Exported Func <br/> General | Any Func <br/> General \n" +
           "---------------|------------------------------|-------------------------|-----------------------------|------------------------";
}

function BuildBaselineHeader() {
  return "Package        | ...Assignment.ql <br/> TP | ...Assignment.ql <br/> FP | ...Function.ql <br/> TP | ...Function.ql <br/> FP | ...MergeCall.ql <br/> TP | ...MergeCall.ql <br/> FP \n" +
         "---------------|---------------------------|---------------------------|-------------------------|-------------------------|--------------------------|--------------------------";
}

function BuildODGenHeader(dataOnly) {
  if (!dataOnly)
    return "Package        |   TP   |   FP  |    Timeout     |\n" +
           "---------------|--------|-------|----------------|";
  else
    return "Package        |   Detected Cases  |    Timeout     |\n" +
           "---------------|-------------------|----------------|";
}


function BuildAppHeader() {
  return "App           |  Total  | Sinks \n" +
         "--------------|---------|-------";
}

function BuildGadgetHeader() {
  return "Property      | Sources | Sinks |\n" +
         "--------------|---------|-------|";
}


function precision(tp, fp) {
  return tp / (tp + fp) * 100;
}

function recall(tp, fn) {
  return tp / (tp + fn) * 100
}

function BuildTotalTPColumn(summary, resultProp) {
  const total = summary.length;
  let tpLibs = summary.reduce(
    (sum, item) => sum + (item[resultProp].FalseNegativeCount == 0 ? 1 : 0), 0);

  let tp = summary.reduce(
    (sum, item) => sum + (item[resultProp].TruePositiveCount), 0);
  let fn = summary.reduce(
    (sum, item) => sum + (item[resultProp].FalseNegativeCount), 0);
  
  return `${tpLibs}/${total} libs<br>TP: ${tp} FN: ${fn}<br>${round2(recall(tp, fn))} % recall`
}

function BuildTotalFPColumn(summary, resultProp) {
  let tp = summary.reduce(
    (sum, item) => sum + (item[resultProp].TruePositiveCount), 0);
  let fp = summary.reduce(
    (sum, item) => sum + (item[resultProp].FalsePositiveCount), 0);
  
  return `FP: ${fp}<br>${round2(precision(tp, fp))} % precision`
}


//////////////////////////////////////////
// Expected data format: 
// {
//   libName: libDir,
//   exportFuncFalseNegativeCount,
//   exportFuncFalsePositiveCount,
//   anyFuncFalseNegativeCount,
//   anyFuncFalsePositiveCount
// }
function BuildFooter(summary, intervalSec) {
  const total = summary.length;
  let row = `Total: ${total} libs/ ${Math.round(intervalSec / 60 / 60 * 10) / 10} hrs (${intervalSec} sec) | `;

  // High-Priority
  row += BuildTotalTPColumn(summary, 'exportFuncHighPriorityResult') + ' | ';
  row += BuildTotalFPColumn(summary, 'exportFuncHighPriorityResult') + ' | ';

  row += BuildTotalTPColumn(summary, 'anyFuncHighPriorityResult') + ' | ';
  row += BuildTotalFPColumn(summary, 'anyFuncHighPriorityResult') + ' | ';

  // Low-Priority
  row += BuildTotalTPColumn(summary, 'exportFuncResult') + ' | ';
  row += BuildTotalFPColumn(summary, 'exportFuncResult') + ' | ';

  row += BuildTotalTPColumn(summary, 'anyFuncResult') + ' | ';
  row += BuildTotalFPColumn(summary, 'anyFuncResult') + ' | ';

  return row;
}

function BuildBaselineFooter(summary, intervalSec) {
  const total = summary.length;
  let row = `Total: ${total} libs/ ${Math.round(intervalSec / 60 / 60 * 10) / 10} hrs (${intervalSec} sec) | `;

  row += BuildTotalTPColumn(summary, 'assignmentResult') + ' | ';
  row += BuildTotalFPColumn(summary, 'assignmentResult') + ' | ';

  row += BuildTotalTPColumn(summary, 'functionResult') + ' | ';
  row += BuildTotalFPColumn(summary, 'functionResult') + ' | ';

  row += BuildTotalTPColumn(summary, 'mergeCallResult') + ' | ';
  row += BuildTotalFPColumn(summary, 'mergeCallResult') + ' | ';

  return row;
}

function BuildODGenFooter(summary, intervalSec) {
  const total = summary.length;
  let row = `Total: ${total} libs/ ${Math.round(intervalSec / 60 / 60 * 10) / 10} hrs (${intervalSec} sec) | `;

  row += BuildTotalTPColumn(summary, 'assignmentResult') + ' | ';
  row += BuildTotalFPColumn(summary, 'assignmentResult') + ' | ';

  let timedOutLibs = summary.reduce((sum, item) => sum + (item.timedOut ? 1 : 0), 0);

  row += round2(timedOutLibs / total * 100) + "% libs're<br>timed out | ";

  return row;
}


function BuildRow(libData) {
    // Library column
    let row = `${libData.libName.replace(/(_lib)$/, '')}`;
    if (libData.loc) {
      row += ` (${libData.loc} LoC)`;
    }

    row += ' | ';

    if (libData.expectedResult) {
      libData.expectedResult.major = TruncateByLineNumber(libData.expectedResult.major);
      libData.expectedResult.minor = TruncateByLineNumber(libData.expectedResult.minor);
      libData.exportFuncResult = TruncateByLineNumber(libData.exportFuncResult);
      libData.exportFuncHighPriorityResult = TruncateByLineNumber(libData.exportFuncHighPriorityResult);
      libData.anyFuncResult = TruncateByLineNumber(libData.anyFuncResult);
      libData.anyFuncHighPriorityResult = TruncateByLineNumber(libData.anyFuncHighPriorityResult);

      // TP: Export Func + FP: Export Func columns
      row += BuildTruePositiveAndFalsePositiveColumns(
        libData.loc,
        libData.exportFuncHighPriorityResult, 
        libData.expectedResult.major
      );

      row += ' | ';

      row += BuildTruePositiveAndFalsePositiveColumns(
        libData.loc,
        libData.anyFuncHighPriorityResult, 
        libData.expectedResult.major
      );  
    

      row += ' | ';

      const expectedResultMinor = new Set([...libData.expectedResult.major, ...libData.expectedResult.minor])
      row += BuildTruePositiveAndFalsePositiveColumns(
        libData.loc,
        libData.exportFuncResult, 
        expectedResultMinor
      );

      row += ' | ';

      row += BuildTruePositiveAndFalsePositiveColumns(
        libData.loc,
        libData.anyFuncResult, 
        expectedResultMinor
      );

      return row;
    }
    else {
      row += [...libData.exportFuncHighPriorityResult].join('<br>');
      row += ' | ';
      row += [...libData.anyFuncHighPriorityResult].join('<br>');
      row += ' | ';
      row += [...libData.exportFuncResult].join('<br>');
      row += ' | ';
      row += [...libData.anyFuncResult].join('<br>');
      return row;
    }
}

function BuildBaselineRow(libData) {
  // Library column
  let row = `${libData.libName.replace(/(_lib)$/, '')} (${libData.loc} LoC) | `;

  if (libData.expectedResult) {
    libData.expectedResult.major = TruncateByLineNumber(libData.expectedResult.major);
    libData.expectedResult.minor = TruncateByLineNumber(libData.expectedResult.minor);
    libData.assignmentResult = TruncateByLineNumber(libData.assignmentResult);
    libData.functionResult = TruncateByLineNumber(libData.functionResult);
    libData.mergeCallResult = TruncateByLineNumber(libData.mergeCallResult);
  }

  const expectedResultMinor = new Set([...libData.expectedResult.major, ...libData.expectedResult.minor])

  // TP: ...Assignment.ql + FP: ...Assignment.ql columns
  row += BuildTruePositiveAndFalsePositiveColumns(
    libData.loc,
    libData.assignmentResult, 
    expectedResultMinor
  );

  row += ' | ';

  row += BuildTruePositiveAndFalsePositiveColumns(
    libData.loc,
    libData.functionResult, 
    expectedResultMinor
  );  

  row += ' | ';

  row += BuildTruePositiveAndFalsePositiveColumns(
    libData.loc,
    libData.mergeCallResult, 
    expectedResultMinor
  );

  return row;
}

function BuildODGenRow(libData) {
  // Library column
  let row = `${libData.libName.replace(/(_lib)$/, '')} (${libData.loc} LoC) | `;

  if (libData.expectedResult) {
    libData.expectedResult.major = TruncateByLineNumber(libData.expectedResult.major);
    libData.expectedResult.minor = TruncateByLineNumber(libData.expectedResult.minor);

    const expectedResultMinor = new Set([...libData.expectedResult.major, ...libData.expectedResult.minor])
    // TP + FP columns
    row += BuildTruePositiveAndFalsePositiveColumns(
      libData.loc,
      libData.assignmentResult, 
      expectedResultMinor
    );
  }
  else {
    row += [...libData.assignmentResult].join('<br>');
  }

  row += ' |';
  if (libData.timedOut) {
    row += '  :red_circle:  |';
  } else {
    row += ' :green_circle: |';
  }

  return row;
}

function BuildAppRow(data) {
  // Library column
  let row = `${data.libName} (${data.loc} LoC) | `;

  row += data.anyFuncHighPriorityResult.size + ' | '
  row += [...data.anyFuncHighPriorityResult].join('; ')
  return row;
}

function BuildGadgetRow(data) {
  let row = `${data.prop} | `;

  row += data.sources.size + ' | ';
  row += data.sinks.size + ' | ';

  return row;
}

function TruncateByLineNumber(set) {
  return new Set(
    [...set].map(item => {
      return TruncateStrByLineNumber(item)
    })
  )
}

const TRANCATE_REGEX = /([^:]+:\d+):\d+/;
function TruncateStrByLineNumber(item) {
  if (/^[^:]+:\d+$/.test(item))   // like `file:111`
    return item;

  const [, result] = TRANCATE_REGEX.exec(item);
  return result;
}

function BuildTruePositiveAndFalsePositiveColumns(loc, result, expectedResult) {
  const falseNegativeCases = [...expectedResult].filter(item => !result.has(item));
  const falsePositiveCases = [...result].filter(item => !expectedResult.has(item));

  result.FalseNegativeCount = falseNegativeCases.length;
  result.TruePositiveCount = expectedResult.size - falseNegativeCases.length;
  result.FalsePositiveCount = falsePositiveCases.length;

  let row = '';

  // TP: Export Func column
  if (falseNegativeCases.length == 0) {
    // https://github.com/ikatyang/emoji-cheat-sheet/blob/master/README.md
    row += `:white_check_mark: (${expectedResult.size}/${expectedResult.size}) `;
    row += ` | `;
  }
  else {
    if (falseNegativeCases.length == expectedResult.size) {
      row += `:sos: (0/${expectedResult.size}) `;
    }
    else {
      row += `:monocle_face: (${expectedResult.size - falseNegativeCases.length}/${expectedResult.size}) `;
    }
    
    row += ` | `;
  }

  // FP: Exported Func column
  row += `${falsePositiveCases.length}`;
  return row;
}

module.exports = {
  ExistsDb,
  RemoveDb,
  CreateDb,
  AnalyzeDb,
  AnalyzeDb4Gadgets,
  IsSuccessful,
  SimpleReport,
  MarkdownReport1,
  MarkdownReport2,
  MarkdownHeaderReport,
  MarkdownRowReport,
  MarkdownFooterReport,
  MarkdownBaselineHeaderReport,
  MarkdownBaselineRowReport,
  MarkdownBaselineFooterReport,
  MarkdownODGenHeaderReport,
  MarkdownODGenRowReport,
  MarkdownODGenFooterReport,
  MarkdownAppHeaderReport,
  MarkdownAppRowReport,
  MarkdownGadgetHeaderReport,
  MarkdownGadgetRowReport,
  GetDependence0,
  GetJSLoC,
  TruncateByLineNumber,
  TruncateStrByLineNumber,
  recall,
  precision,
  round2,
  round1
};
