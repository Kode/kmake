"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KompjutaExporter = void 0;
const Exporter_1 = require("kmake/Exporters/Exporter");
const NinjaExporter_1 = require("kmake/Exporters/NinjaExporter");
const MakeExporter_1 = require("kmake/Exporters/MakeExporter");
const CLionExporter_1 = require("kmake/Exporters/CLionExporter");
const CompileCommandsExporter_1 = require("kmake/Exporters/CompileCommandsExporter");
const fs = require("kmake/fsextra");
const path = require("path");
class KompjutaExporter extends Exporter_1.Exporter {
    constructor(options) {
        super(options);
        const cFlags = '--target=riscv64-unknown-elf -march=rv64imfdv_zvl1024b -mabi=lp64d -Os -ffreestanding -fno-builtin -ffunction-sections -fdata-sections -nostdlib -mno-relax';
        const linkerFlags = '--target=riscv64-unknown-elf -march=rv64imfdv_zvl1024b -mabi=lp64d -Os -ffreestanding -fno-builtin -ffunction-sections -fdata-sections -nostdlib -mno-relax -fuse-ld=lld "-Wl,--no-relax,--gc-sections,-Map,link.map,-T,kompjuta.ld"';
        const outputExtension = '.elf';
        this.ninja = new NinjaExporter_1.NinjaExporter(options, 'clang', 'clang++', 'clang++', cFlags, cFlags, linkerFlags, outputExtension);
        this.make = new MakeExporter_1.MakeExporter(options, 'clang', 'clang++', 'clang++', cFlags, cFlags, linkerFlags, outputExtension);
        this.clion = new CLionExporter_1.CLionExporter(options);
        this.compileCommands = new CompileCommandsExporter_1.CompilerCommandsExporter(options);
    }
    async exportSolution(project, from, to, platform, vrApi, options) {
        const textData = require('fs').getEmbeddedData();
        let outputPath = path.resolve(to, options.buildPath);
        fs.ensureDirSync(outputPath);
        fs.writeFileSync(path.join(outputPath, 'kompjuta.ld'), textData['kompjuta_kompjuta_ld']);
        this.ninja.exportSolution(project, from, to, platform, vrApi, options);
        this.make.exportSolution(project, from, to, platform, vrApi, options);
        this.clion.exportSolution(project, from, to, platform, vrApi, options);
        this.compileCommands.exportSolution(project, from, to, platform, vrApi, options);
    }
}
exports.KompjutaExporter = KompjutaExporter;
//# sourceMappingURL=KompjutaExporter.js.map