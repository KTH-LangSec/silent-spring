let wrench = require("wrench");
const {Parser} = require("acorn")
let estraverse = require("estraverse");
let fs = require("fs");

const nodeSrcPath = "../benchmark-nodejs"

function analyzeProps(targetDir) {
    let files = wrench.readdirSyncRecursive(targetDir);
    let props = new Set();
    files = files.filter((file) => file.match(/.*\.js$/)); 
    console.log(files.length)
    for (let i = 0; i < files.length; i++) {
        // console.log(`${i} ${props.size}`);
        let file = files[i];
        try {
            let ast = Parser.parse(fs.readFileSync(`${targetDir}/${file}`).toString());
            estraverse.traverse(ast, {
                enter: function (node, parent) {
                    if (node.type == 'MemberExpression') {
                        if (node.property.type === "Identifier")
                            return props.add(node.property.name);
                        if (node.property.type === "Literal")
                            return props.add(node.property.value);
                    }
                }
            });
        } catch(e) {
            console.log(e);
            // best effort
        }
    }
    return Array.from(props);
}

const props = analyzeProps(nodeSrcPath)
console.log("Total properties: " + props.length)
fs.writeFileSync("../raw-data/nodejs-properties.json", JSON.stringify(props));