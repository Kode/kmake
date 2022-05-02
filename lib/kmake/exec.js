"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sys = void 0;
const os = require("os");
function sys() {
    if (os.platform() === 'win32') {
        return '.exe';
    }
    else {
        return '';
    }
}
exports.sys = sys;
//# sourceMappingURL=exec.js.map