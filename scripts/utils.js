const fs = require('fs');
const path = require('path');

function resolveLibDirs(paths, root) {
  return paths
    .map(p => {
      if (!fs.existsSync(p)) {
        p = path.join(root, p);
        if (!fs.existsSync(p)) {
          return undefined;
        }
      }

      if (fs.lstatSync(p).isFile()) {
        p = path.dirname(p);
      }

      return path.resolve(p);
    })
    .filter(p => p != undefined);
}

function extractLibDirs(paths, root) {
  return resolveLibDirs(paths, root)
    .map(p => path.basename(p));
}

function findLibDirs(root) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(dirEx => dirEx.isDirectory())
    .filter(dirEx =>    // find *.PoC.expected files
      fs.readdirSync(path.join(root, dirEx.name), { withFileTypes: true })
        .filter(fileEx => fileEx.isFile())
        .filter(fileEx => fileEx.name.endsWith('.PoC.expected'))
        .some(fileEx => // check that *.PoC.expected files are not empty
          fs.readFileSync(path.join(root, dirEx.name, fileEx.name), {encoding:'utf8'}).toString()
            .split(/\r?\n/)
            .map(row => row.trim())
            .some(row => row != '')))
    .map(dirEx => dirEx.name);
}

const STACK_LINE_REGEX = /([^\0 !$`"'&*\(\)\[\]+;]+:\d+:\d+)/;
const FILE_AND_LINE_REGEX = /([^\0 !$`"'&*\(\)\[\]+:;]+:\d+):\d+/;
function EnableProtoPollutedMock(callback, expectedResult = "yes") {
  Object.defineProperty(
    Object.prototype,
    "polluted",
    {
      enumerable: false,  // should be false to cover debt@0.0.4
      configurable: true, 
      get() {
        return this._polluted
      },
      set(value) {
        this._polluted = value;
        if (this != Object.prototype)
          return;

        if (value === undefined || expectedResult === undefined)
          return;

        let err;
      
        try {
          throw new Error();
        } catch (error) {
          err = error;
        }
      
        try {
          const stacks = err.stack.split('\n');

          let index = 2;
          let groups;
          while (
            (groups = STACK_LINE_REGEX.exec(stacks[index++])) === null &&
            index < stacks.length
          );

          if (groups !== null) {
            const [, targetCodeLine] = groups;
            // console.info(`DONE ${index - 1}: ${targetCodeLine}`);
            callback(
              targetCodeLine,
              value.toString() != expectedResult.toString() // if it's NOT an expected value, then it's a MINOR case
            );
          }

          // stacks.forEach(x => {
          //   console.info(x);
          // });
        } catch (error) {
          console.error(error);
        }  
      }
    }
  );

  Object.prototype.hasOwnProperty = function(v) {
    if (this === Object.prototype && v === 'polluted') {
      return Object.hasOwn(this, '_polluted');
    }

    return Object.hasOwn(this, v);
  }
}

function DisableProtoPollutedMock() {
  delete ({}).__proto__.polluted;
  delete ({}).__proto__._polluted;
}

function dumpIfNeeded(pocFilePath, targetCodeLine, minor) {
  const parsedPath = path.parse(pocFilePath);
  const targetCodeLineUnified = path
    .relative(parsedPath.dir, targetCodeLine)
    .replace(/\\/g, "/");

  const postfix = minor ? ".ext.expected" : ".expected";
  let expectedFilePath = path.join(
    parsedPath.dir, 
    parsedPath.name + postfix);
  if (fs.existsSync(expectedFilePath)) {
    const firstLine = readFirstLine(expectedFilePath);
    if (firstLine) {
      const groups = FILE_AND_LINE_REGEX.exec(targetCodeLineUnified);
      if (groups !== null) {
        const [, fileAndLine] = groups;
        if (firstLine.startsWith(fileAndLine)) {
          // the .PoC.expected file exists and contains the similar line
          // so do nothing
          return;
        }
        else {
          // the .PoC.expected file exists and contains the different first line
          // store a new target to the separate file
          expectedFilePath += "_";
        }
      }
    }
  }

  fs.writeFileSync(expectedFilePath, targetCodeLineUnified);
}

 function fileIsEmpty(path) {
  return !fs.readFileSync(path, {encoding:'utf8'})
    .toString()
    .split(/\r?\n/)
    .map(row => row.trim())
    .some(row => row != '');
}

 function readFirstLine(path) {
  return fs.readFileSync(path, {encoding:'utf8'})
    .toString()
    .split(/\r?\n/)
    .map(row => row.trim())
    .filter(row => row != '')[0];
}

module.exports = {
  fileIsEmpty,
  readFirstLine,
  resolveLibDirs,
  extractLibDirs,
  findLibDirs,
  EnableProtoPollutedMock,
  DisableProtoPollutedMock,
  dumpIfNeeded
}