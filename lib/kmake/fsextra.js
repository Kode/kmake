"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copySync = exports.ensureDirSync = exports.closeSync = exports.writeSync = exports.openSync = exports.readFileSync = exports.writeFileSync = exports.statSync = exports.readdirSync = exports.existsSync = void 0;
const fs_1 = require("fs");
Object.defineProperty(exports, "existsSync", { enumerable: true, get: function () { return fs_1.existsSync; } });
Object.defineProperty(exports, "readdirSync", { enumerable: true, get: function () { return fs_1.readdirSync; } });
Object.defineProperty(exports, "statSync", { enumerable: true, get: function () { return fs_1.statSync; } });
Object.defineProperty(exports, "writeFileSync", { enumerable: true, get: function () { return fs_1.writeFileSync; } });
Object.defineProperty(exports, "readFileSync", { enumerable: true, get: function () { return fs_1.readFileSync; } });
Object.defineProperty(exports, "openSync", { enumerable: true, get: function () { return fs_1.openSync; } });
Object.defineProperty(exports, "writeSync", { enumerable: true, get: function () { return fs_1.writeSync; } });
Object.defineProperty(exports, "closeSync", { enumerable: true, get: function () { return fs_1.closeSync; } });
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
function copySync(from, to, options) {
    // TODO
}
exports.copySync = copySync;
//# sourceMappingURL=fsextra.js.map