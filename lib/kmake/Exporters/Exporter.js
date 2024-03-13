"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exporter = void 0;
const fs = require("kmake/fsextra");
const path = require("path");
const log = require("kmake/log");
var WriteMode;
(function (WriteMode) {
    WriteMode[WriteMode["None"] = 0] = "None";
    WriteMode[WriteMode["File"] = 1] = "File";
    WriteMode[WriteMode["Stdout"] = 2] = "Stdout";
})(WriteMode || (WriteMode = {}));
class Exporter {
    constructor(options) {
        this.writeMode = WriteMode.None;
        this.outFile = 0;
        this.outString = null;
    }
    writeFile(file) {
        this.writeMode = WriteMode.File;
        this.outFile = fs.openSync(file, 'w');
        this.outString = null;
    }
    writeStdout() {
        this.writeMode = WriteMode.Stdout;
        this.outString = '';
        this.outFile = 0;
    }
    closeFile() {
        fs.closeSync(this.outFile);
        this.outFile = 0;
        this.outString = null;
        this.writeMode = WriteMode.None;
    }
    closeStdout() {
        this.outString = null;
        this.outFile = 0;
        this.writeMode = WriteMode.None;
    }
    p(line = '', indent = 0) {
        let tabs = '';
        for (let i = 0; i < indent; ++i) {
            tabs += '\t';
        }
        if (this.writeMode === WriteMode.Stdout) {
            log.info(tabs + line);
        }
        else if (this.writeMode === WriteMode.File) {
            let data = Buffer.from(tabs + line + '\n');
            fs.writeSync(this.outFile, data, 0, data.length, null);
        }
        else {
            throw 'Writing while not actually writing';
        }
    }
    nicePath(from, to, filepath) {
        let absolute = filepath;
        if (!path.isAbsolute(absolute)) {
            absolute = path.resolve(from, filepath);
        }
        return path.relative(to, absolute);
    }
    async exportSolution(project, from, to, platform, vrApi, options) {
        return new Promise((resolve, reject) => {
            reject('Called an abstract function');
        });
    }
}
exports.Exporter = Exporter;
//# sourceMappingURL=Exporter.js.map