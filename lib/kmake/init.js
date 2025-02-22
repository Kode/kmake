"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const fs = require("fs");
const path = require("path");
function run(name, from) {
    const projectfile = 'kfile.js';
    if (!fs.existsSync(path.join(from, projectfile))) {
        fs.writeFileSync(path.join(from, projectfile), 'let project = new Project(\'New Project\');\n'
            + '\n'
            + 'await project.addProject(\'Kore\');\n'
            + '\n'
            + 'project.addFile(\'Sources/**\');\n'
            + 'project.setDebugDir(\'Deployment\');\n'
            + '\n'
            + 'project.flatten();\n'
            + '\n'
            + 'resolve(project);\n', { encoding: 'utf8' });
    }
    if (!fs.existsSync(path.join(from, 'Sources'))) {
        fs.mkdirSync(path.join(from, 'Sources'));
    }
    let friendlyName = name;
    friendlyName = friendlyName.replace(/ /g, '_');
    friendlyName = friendlyName.replace(/-/g, '_');
    if (!fs.existsSync(path.join(from, 'Sources', 'main.c'))) {
        let mainsource = '\n'
            + 'int kickstart(int argc, char** argv) {\n'
            + '\treturn 0;\n'
            + '}\n';
        fs.writeFileSync(path.join(from, 'Sources', 'main.c'), mainsource, { encoding: 'utf8' });
    }
    if (!fs.existsSync(path.join(from, 'Deployment'))) {
        fs.mkdirSync(path.join(from, 'Deployment'));
    }
}
exports.run = run;
//# sourceMappingURL=init.js.map