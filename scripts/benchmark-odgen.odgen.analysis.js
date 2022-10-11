const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const {
  MarkdownODGenHeaderReport,
  MarkdownODGenRowReport,
  MarkdownODGenFooterReport,
  GetJSLoC
} = require('./analysis');
const { ParseExpectedResult } = require("./utils.poc-parsing");
const { extractLibDirs } = require("./utils");
const output = require('fs-extra/lib/output');

var argv = require('minimist')(process.argv.slice(2), {
  alias: { l: 'limit' }
});

const odgenDir = '/root/projs/ODGen'; 
const odgenPath = path.join(odgenDir, 'odgen.py');
const ppStuffDir = '/root/projs/silent-spring';
const serverSideDir = path.join(ppStuffDir, 'benchmark-odgen');;
const reportPath = path.join(ppStuffDir, 'raw-data', 'benchmark-odgen.odgen.md');


//argv._ = ["deep_defaults_lib"] //["dot_object_lib"] // for debug

let libDirs = argv._ && argv._.length > 0
  ? extractLibDirs(argv._, serverSideDir)
  : findLibDirs(serverSideDir);

if (argv.limit) {
  libDirs = libDirs.slice(0, argv.limit);
}

async function main() {
  console.info(`Run at ${new Date().toLocaleString()}`);
  let timestamp = Date.now();

  MarkdownODGenHeaderReport(reportPath);

  async function Analyze(libDir) {
    try {
      const sourcePath = path.join(serverSideDir, libDir, libDir);
      // const expectedResultPath = 
      //   path.join(
      //     serverSideDir,
      //     libDir,
      //     fs.readdirSync(path.join(serverSideDir, libDir), { withFileTypes: true })
      //       .filter(fileEx => fileEx.isFile())
      //       .filter(fileEx => fileEx.name.endsWith('.PoC.expected'))[0]
      //       .name);

      const loc = GetJSLoC(sourcePath, true);

      console.info(`Analyzing ${libDir} ...`);
      const expectedResult = undefined;//ParseExpectedResult(expectedResultPath);

      // Run ODGen
      // python3 /root/projs/ODGen/odgen.py /root/projs/prototype-pollution-stuff/server-side-libs/controlled_merge_lib -ma -t proto_pollution --timeout 30 > out.txt 2>&1
      const odgen = spawn(
        'python3', [
          odgenPath, 
          //path.join(odgenDir, 'tests/packages/prototype_pollution/pp.js'),
          sourcePath,
          '-ma',
          '-t', 'proto_pollution',
          '--timeout', '600'
        ]
      );

      let timedOut = false;
      const resultLines = new Set();
      odgen.stdout.on('data', (data) => {
        //console.log(`stdout: ${data}`);
        const output = data.toString();
        if (output.includes('timed out,')) {
          timedOut = true;
        }

        const parsedResult = output.matchAll(/Prototype pollution detected[^\(]*\(Line (\d*)\)/gm);
        for (const [,ppLine] of parsedResult) {
          resultLines.add(ppLine);
        }
      });

      let parserState = "waiting";
      const result = new Set();
      odgen.stderr.on('data', (data) => {
        //console.log(`stderr: ${data}`);
        const output = data.toString();
        if (output.includes('timed out,')) {
          timedOut = true;
        }

        for (const part of output.split(" \u001B\[0m\n")) {
          if (parserState == "waiting") {    
            if (part.includes("Attack Path")) {
              parserState = "attack";
            }
          }

          if (parserState == "attack") {
            const parsedResult = [...part.matchAll(/\$FilePath\$([^\n]+)\nLine (\d+)[^\n]*\n$/g)];
            if (parsedResult != null && parsedResult.length != 0) {
              if (parsedResult.length != 1) {
                throw new Error('Parsed more than one result of PP sink:\n' + part);
              }

              
              const fileName = parsedResult[0][1];
              const fileLine = parsedResult[0][2];
              const fileInfo = `${fileName.replace(sourcePath + '/', '')}:${fileLine}`;
              console.log(fileInfo);
              result.add(fileInfo);
            }

            parserState = "waiting";
          } 
        }
      });

      await new Promise( (resolve) => {
        odgen.on('close', resolve)
      })

      // check result consistency
      if (result.size != resultLines.size) {
        console.error(`Inconsistence result size (${result.size}, ${resultLines.size})`)
      }

      for (const line of result) {
        if (!resultLines.has(line.split(':')[1])) {
          console.error(`Inconsistence lines, resultLines does NOT have the line ${line}`)
        }
      }

      const libData = {
        loc,
        libName: libDir,
        timedOut,
        expectedResult,
        assignmentResult: result
      };

      MarkdownODGenRowReport(reportPath, libData);
      return libData;
    }
    catch(error) {
      console.error(error);
      return undefined;
    }
  }

  let data = [];
  for (const libDir of libDirs) {
    const libResult = await Analyze(libDir);
    if (libResult != undefined) {
      data.push(libResult);
    }
  }

  // const data = await Promise.all(libDirs.map(???)
  // .filter(libData => libData != undefined));

  let intervalSec = Math.round((Date.now() - timestamp) / 1000);
  MarkdownODGenFooterReport(reportPath, data, intervalSec);
  console.info(`Finish the analysis ${Math.round(intervalSec / 60 / 60 * 10) / 10} hrs (${intervalSec} sec) at ${new Date().toLocaleString()}`);
}

function findLibDirs(root) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(dirEx => dirEx.isDirectory())
    .map(dirEx => dirEx.name);
}


main();
