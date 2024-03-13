"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WasmExporter = void 0;
const Exporter_1 = require("kmake/Exporters/Exporter");
const CompileCommandsExporter_1 = require("kmake/Exporters/CompileCommandsExporter");
const MakeExporter_1 = require("kmake/Exporters/MakeExporter");
const NinjaExporter_1 = require("kmake/Exporters/NinjaExporter");
class WasmExporter extends Exporter_1.Exporter {
    constructor(options) {
        super(options);
        this.compileCommands = new CompileCommandsExporter_1.CompilerCommandsExporter(options);
        const compiler = 'clang';
        const compilerFlags = '--target=wasm32 -nostdlib -matomics -mbulk-memory';
        this.make = new MakeExporter_1.MakeExporter(options, compiler, compiler, compilerFlags, compilerFlags, '--target=wasm32 -nostdlib -matomics -mbulk-memory "-Wl,--import-memory,--shared-memory"', '.wasm');
        this.ninja = new NinjaExporter_1.NinjaExporter(options, compiler, compiler, compilerFlags, compilerFlags, '--target=wasm32 -nostdlib -matomics -mbulk-memory "-Wl,--import-memory,--shared-memory"', '.wasm');
    }
    async exportSolution(project, from, to, platform, vrApi, options) {
        this.make.exportSolution(project, from, to, platform, vrApi, options);
        this.ninja.exportSolution(project, from, to, platform, vrApi, options);
        this.compileCommands.exportSolution(project, from, to, platform, vrApi, options);
    }
}
exports.WasmExporter = WasmExporter;
//# sourceMappingURL=WasmExporter.js.map