const esprima = require("esprima");
const estraverse = require("estraverse");
const fs = require("fs");
const walkSync = require('walk-sync');

const PATH = "../benchmark-npm-packages";

let files = fs.readdirSync(`${PATH}`);

let totalMains = 0, totalRelatives = 0, totalCps = 0;

for (let i = 0; i < files.length; i++) {
    let targetDir = `${PATH}/${files[i]}`;    
    let hasMain = true, hasRelative = false, hasCp = false;      
    try {    
    let jsFiles = walkSync(targetDir);      
    for (let j = 0; j < jsFiles.length; j++) {
        if (jsFiles[j].indexOf("package.json") != -1) {
            let jsonFile = JSON.parse(fs.readFileSync(`${targetDir}/${jsFiles[j]}`).toString());
            if (!jsonFile.main)
                hasMain = false;            
        }
        if (jsFiles[j].indexOf("test") != -1)
            continue;
        try {
            let content = fs.readFileSync(`${targetDir}/${jsFiles[j]}`).toString();
            let ast = esprima.parse(content);            
            // console.log(ast);
            if (hasRelativeRequire(ast))
                hasRelative = true;
            if (hasCpMethods(ast))
                hasCp = true;
        } catch(e) {                        
        }
    }
    } catch(e) {}
    if (!hasMain)
        totalMains++
    if (hasRelative)
        totalRelatives++;
    if (hasCp)
        totalCps++;
    console.log(`${files[i]}: main - ${hasMain}, hasRelative - ${hasRelative}, hasCpMethods - ${hasCp}`)
}

console.log('Total:')
console.log(`Packages with no main - ${totalMains}; packages have relative 'require' - ${totalRelatives}; packages have 'child_process' methods - ${totalCps}.`);

function hasRelativeRequire(ast) {
    let result = false;
    estraverse.traverse(ast, {
        enter: function (node, parent) {            
            if (node.type === 'CallExpression' && node.callee.name === "require") {
                if (node.arguments[0].value.indexOf("./") !== -1)
                result = true;        
            }
        }
    });
    return result;
}

function hasCpMethods(ast) {
    let cpMethods = false, cpReq = false;
    estraverse.traverse(ast, {
        enter: function (node, parent) {            
            if (node.type === 'CallExpression' && node.callee.name === "require") {
                if (node.arguments[0].value.indexOf("child_process") !== -1)
                cpReq = true;        
            }
            if (node.type === 'MemberExpression' 
                && (node.property.name === "spawn" 
                || node.property.name === "spawnSync"
                || node.property.name === "exec"
                || node.property.name === "execSync")
                ) {
                cpMethods = true;        
            }
        }
    });
    return cpMethods && cpReq;
}   