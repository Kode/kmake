"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyDirSync = exports.ensureDirSync = exports.chmodSync = exports.copyFileSync = exports.closeSync = exports.writeSync = exports.openSync = exports.readFileSync = exports.writeFileSync = exports.statSync = exports.readdirSync = exports.existsSync = void 0;
const fs_1 = require("fs");
Object.defineProperty(exports, "copyFileSync", { enumerable: true, get: function () { return fs_1.copyFileSync; } });
Object.defineProperty(exports, "existsSync", { enumerable: true, get: function () { return fs_1.existsSync; } });
Object.defineProperty(exports, "readdirSync", { enumerable: true, get: function () { return fs_1.readdirSync; } });
Object.defineProperty(exports, "statSync", { enumerable: true, get: function () { return fs_1.statSync; } });
Object.defineProperty(exports, "writeFileSync", { enumerable: true, get: function () { return fs_1.writeFileSync; } });
Object.defineProperty(exports, "readFileSync", { enumerable: true, get: function () { return fs_1.readFileSync; } });
Object.defineProperty(exports, "openSync", { enumerable: true, get: function () { return fs_1.openSync; } });
Object.defineProperty(exports, "writeSync", { enumerable: true, get: function () { return fs_1.writeSync; } });
Object.defineProperty(exports, "closeSync", { enumerable: true, get: function () { return fs_1.closeSync; } });
Object.defineProperty(exports, "chmodSync", { enumerable: true, get: function () { return fs_1.chmodSync; } });
const path = require("path");
function ensureDirSync(dir) {
    const parent = path.normalize(path.join(dir, '..'));
    if (!(0, fs_1.existsSync)(parent)) {
        ensureDirSync(parent);
    }
    if (!(0, fs_1.existsSync)(dir)) {
        (0, fs_1.mkdirSync)(dir);
    }
}
exports.ensureDirSync = ensureDirSync;
function copyDirSync(from, to) {
    ensureDirSync(to);
    const files = (0, fs_1.readdirSync)(from);
    for (const file of files) {
        const stat = (0, fs_1.statSync)(path.join(from, file));
        if (stat.isDirectory()) {
            copyDirSync(path.join(from, file), path.join(to, file));
        }
        else {
            (0, fs_1.copyFileSync)(path.join(from, file), path.join(to, file));
        }
    }
}
exports.copyDirSync = copyDirSync;
//# sourceMappingURL=fsextra.js.map