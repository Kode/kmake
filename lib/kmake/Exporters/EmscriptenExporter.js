"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmscriptenExporter = void 0;
const Exporter_1 = require("kmake/Exporters/Exporter");
const fs = require("kmake/fsextra");
const path = require("path");
const CompileCommandsExporter_1 = require("kmake/Exporters/CompileCommandsExporter");
const MakeExporter_1 = require("kmake/Exporters/MakeExporter");
const NinjaExporter_1 = require("kmake/Exporters/NinjaExporter");
const Icon = require("kmake/Icon");
class EmscriptenExporter extends Exporter_1.Exporter {
    constructor(project, options) {
        super(options);
        this.compileCommands = new CompileCommandsExporter_1.CompilerCommandsExporter(options);
        let linkerFlags = '-static-libgcc -static-libstdc++';
        if (project.targetOptions.emscripten.threads) {
            linkerFlags += ' -pthread';
        }
        linkerFlags += ' -sTOTAL_MEMORY=134217728 ';
        linkerFlags += ' --preload-file ' + this.debugDirName(project);
        this.make = new MakeExporter_1.MakeExporter(options, 'emcc', 'em++', 'em++', '', '', linkerFlags, '.html');
        this.ninja = new NinjaExporter_1.NinjaExporter(options, 'emcc', 'em++', 'em++', '', '', linkerFlags, '.html');
    }
    debugDirName(project) {
        let name = project.getDebugDir();
        name = name.replace(/\\/g, '/');
        if (name.endsWith('/')) {
            name = name.substr(0, name.length - 1);
        }
        if (name.lastIndexOf('/') >= 0) {
            name = name.substr(name.lastIndexOf('/') + 1);
        }
        return name;
    }
    async exportSolution(project, from, to, platform, vrApi, options) {
        let outputPath = path.resolve(to, options.buildPath);
        fs.ensureDirSync(outputPath);
        fs.copyDirSync(path.resolve(from, this.debugDirName(project)), path.resolve(outputPath, this.debugDirName(project)));
        this.make.exportSolution(project, from, to, platform, vrApi, options);
        this.ninja.exportSolution(project, from, to, platform, vrApi, options);
        this.compileCommands.exportSolution(project, from, to, platform, vrApi, options);
        await Icon.exportIco(project.icon, path.resolve(outputPath, 'favicon.ico'), from, true);
    }
}
exports.EmscriptenExporter = EmscriptenExporter;
//# sourceMappingURL=EmscriptenExporter.js.map