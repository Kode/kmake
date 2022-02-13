"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportBmp = exports.exportPng24 = exports.exportPng = exports.exportIcns = exports.exportIco = void 0;
const log = require("kmake/log");
const exec = require("kmake/exec");
const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const Project_1 = require("kmake/Project");
function run(from, to, width, height, format, background, callback) {
    const exe = path.resolve(Project_1.Project.koreDir !== '' ? Project_1.Project.koreDir : 'Kinc', 'Tools', 'kraffiti', 'kraffiti' + exec.sys());
    let params = ['from=' + from, 'to=' + to, 'format=' + format, 'keepaspect'];
    if (width > 0)
        params.push('width=' + width);
    if (height > 0)
        params.push('height=' + height);
    if (background !== undefined)
        params.push('background=' + background.toString(16));
    let child = cp.spawn(exe, params);
    child.stdout.on('data', (data) => {
        // log.info('kraffiti stdout: ' + data);
    });
    child.stderr.on('data', (data) => {
        log.error('kraffiti stderr: ' + data);
    });
    child.on('error', (err) => {
        log.error('kraffiti error: ' + err);
    });
    child.on('close', (code) => {
        if (code !== 0)
            log.error('kraffiti exited with code ' + code);
        callback();
    });
}
function findIcon(icon, from) {
    if (icon && fs.existsSync(path.join(from, icon)))
        return path.join(from, icon);
    if (fs.existsSync(path.join(from, 'icon.png')))
        return path.join(from, 'icon.png');
    else
        return path.join(__dirname, '..', 'kraffiti', 'icon.png');
}
async function exportIco(icon, to, from) {
    return new Promise(resolve => {
        run(findIcon(icon, from.toString()), to.toString(), 0, 0, 'ico', undefined, resolve);
    });
}
exports.exportIco = exportIco;
async function exportIcns(icon, to, from) {
    return new Promise(resolve => {
        run(findIcon(icon, from.toString()), to.toString(), 0, 0, 'icns', undefined, resolve);
    });
}
exports.exportIcns = exportIcns;
async function exportPng(icon, to, width, height, background, from) {
    return new Promise(resolve => {
        run(findIcon(icon, from.toString()), to.toString(), width, height, 'png', background, resolve);
    });
}
exports.exportPng = exportPng;
async function exportPng24(icon, to, width, height, background, from) {
    return new Promise(resolve => {
        run(findIcon(icon, from.toString()), to.toString(), width, height, 'png24', background, resolve);
    });
}
exports.exportPng24 = exportPng24;
async function exportBmp(icon, to, width, height, background, from) {
    return new Promise(resolve => {
        run(findIcon(icon, from.toString()), to.toString(), width, height, 'bmp', background, resolve);
    });
}
exports.exportBmp = exportBmp;
//# sourceMappingURL=Icon.js.map