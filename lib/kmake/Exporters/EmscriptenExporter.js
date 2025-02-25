"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmscriptenExporter = void 0;
const Exporter_1 = require("kmake/Exporters/Exporter");
const Options_1 = require("kmake/Options");
const GraphicsApi_1 = require("kmake/GraphicsApi");
const fs = require("kmake/fsextra");
const path = require("path");
const CompileCommandsExporter_1 = require("kmake/Exporters/CompileCommandsExporter");
const MakeExporter_1 = require("kmake/Exporters/MakeExporter");
const NinjaExporter_1 = require("kmake/Exporters/NinjaExporter");
class EmscriptenExporter extends Exporter_1.Exporter {
    constructor(project, options) {
        super(options);
        this.compileCommands = new CompileCommandsExporter_1.CompilerCommandsExporter(options);
        let linkerFlags = '-static-libgcc -static-libstdc++';
        if (project.targetOptions.emscripten.threads) {
            linkerFlags += ' -pthread';
        }
        if (project.targetOptions.emscripten.threads) {
            linkerFlags += ' -pthread';
        }
        linkerFlags += ' -s TOTAL_MEMORY=134217728 ';
        if (Options_1.Options.graphicsApi === GraphicsApi_1.GraphicsApi.WebGPU) {
            linkerFlags += '-s USE_WEBGPU=1 ';
        }
        linkerFlags += ' -o index.html --preload-file ' + this.debugDirName(project);
        this.make = new MakeExporter_1.MakeExporter(options, 'emcc', 'emcc', '', '', linkerFlags, '.html', this.libsLine);
        this.ninja = new NinjaExporter_1.NinjaExporter(options, 'emcc', 'emcc', '', '', linkerFlags, '.html', this.libsLine);
    }
    libsLine(project) {
        let libs = '';
        for (let lib of project.getLibs()) {
            if (lib.startsWith('USE_')) {
                libs += ' -s' + lib;
            }
            else {
                libs += ' -l' + lib;
            }
        }
        return libs;
    }
    libsNinjaLine(project) {
        let libs = '';
        for (let lib of project.getLibs()) {
            if (lib.startsWith('USE_')) {
                libs += ' -s' + lib;
            }
            else {
                libs += ' -l' + lib;
            }
        }
        return libs;
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
    }
}
exports.EmscriptenExporter = EmscriptenExporter;
//# sourceMappingURL=EmscriptenExporter.js.map