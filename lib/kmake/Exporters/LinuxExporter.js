"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinuxExporter = void 0;
const Exporter_1 = require("kmake/Exporters/Exporter");
const Options_1 = require("kmake/Options");
const Platform_1 = require("kmake/Platform");
const Compiler_1 = require("kmake/Compiler");
const fs = require("kmake/fsextra");
const path = require("path");
const NinjaExporter_1 = require("kmake/Exporters/NinjaExporter");
const MakeExporter_1 = require("kmake/Exporters/MakeExporter");
const CLionExporter_1 = require("kmake/Exporters/CLionExporter");
const CompileCommandsExporter_1 = require("kmake/Exporters/CompileCommandsExporter");
class LinuxExporter extends Exporter_1.Exporter {
    constructor() {
        super();
        let linkerParams = '-static-libgcc -static-libstdc++ -pthread';
        if (Options_1.Options.compiler === Compiler_1.Compiler.MuslGcc || this.getOS().includes('Alpine')) {
            linkerParams += ' -static';
        }
        this.ninja = new NinjaExporter_1.NinjaExporter(this.getCCompiler(), this.getCPPCompiler(), linkerParams);
        this.make = new MakeExporter_1.MakeExporter(this.getCCompiler(), this.getCPPCompiler(), linkerParams);
        this.clion = new CLionExporter_1.CLionExporter();
        this.compileCommands = new CompileCommandsExporter_1.CompilerCommandsExporter();
    }
    async exportSolution(project, from, to, platform, vrApi, options) {
        this.ninja.exportSolution(project, from, to, platform, vrApi, options);
        this.make.exportSolution(project, from, to, platform, vrApi, options);
        this.exportCodeBlocks(project, from, to, platform, vrApi, options);
        this.clion.exportSolution(project, from, to, platform, vrApi, options);
        this.compileCommands.exportSolution(project, from, to, platform, vrApi, options);
    }
    getCCompiler() {
        switch (Options_1.Options.compiler) {
            case Compiler_1.Compiler.Default:
            case Compiler_1.Compiler.GCC:
                return 'gcc';
            case Compiler_1.Compiler.Clang:
                return 'clang';
            case Compiler_1.Compiler.MuslGcc:
                return 'musl-gcc';
            case Compiler_1.Compiler.Custom:
                return Options_1.Options.ccPath;
            default:
                throw 'Unsupported compiler ' + Options_1.Options.compiler;
        }
    }
    getCPPCompiler() {
        switch (Options_1.Options.compiler) {
            case Compiler_1.Compiler.Default:
            case Compiler_1.Compiler.GCC:
                return 'g++';
            case Compiler_1.Compiler.Clang:
                return 'clang++';
            case Compiler_1.Compiler.MuslGcc:
                return 'g++';
            case Compiler_1.Compiler.Custom:
                return Options_1.Options.cxxPath;
            default:
                throw 'Unsupported compiler ' + Options_1.Options.compiler;
        }
    }
    getOS() {
        try {
            const data = fs.readFileSync('/etc/os-release', 'utf8');
            const lines = data.split('\n');
            let name = null;
            for (const line of lines) {
                if (line.trim().startsWith('NAME')) {
                    name = line.split('=')[1];
                    name = name.substring(1, name.length - 1);
                    break;
                }
            }
            if (name) {
                return name;
            }
            else {
                return 'Unknown';
            }
        }
        catch (error) {
            return 'Unknown';
        }
    }
    exportCodeBlocks(project, from, to, platform, vrApi, options) {
        this.writeFile(path.resolve(to, project.getSafeName() + '.cbp'));
        this.p('<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>');
        this.p('<CodeBlocks_project_file>');
        this.p('<FileVersion major="1" minor="6" />', 1);
        this.p('<Project>', 1);
        this.p('<Option title="' + project.getName() + '" />', 2);
        this.p('<Option pch_mode="2" />', 2);
        this.p('<Option compiler="gcc" />', 2);
        this.p('<Build>', 2);
        this.p('<Target title="Debug">', 3);
        let executableName = project.getSafeName();
        if (project.getExecutableName()) {
            executableName = project.getExecutableName();
        }
        this.p('<Option output="bin/Debug/' + executableName + '" prefix_auto="1" extension_auto="1" />', 4);
        if (project.getDebugDir().length > 0)
            this.p('<Option working_dir="' + path.resolve(from, project.getDebugDir()) + '" />', 4);
        this.p('<Option object_output="obj/Debug/" />', 4);
        this.p('<Option type="1" />', 4);
        this.p('<Option compiler="gcc" />', 4);
        this.p('<Compiler>', 4);
        if (project.cppStd !== '') {
            this.p('<Add option="-std=' + project.cppStd + '" />', 5);
        }
        this.p('<Add option="-g" />', 5);
        for (const def of project.getDefines()) {
            if (def.config && def.config.toLowerCase() !== 'debug') {
                continue;
            }
            this.p('<Add option="-D' + def.value.replace(/\"/g, '\\"') + '" />', 3);
        }
        this.p('</Compiler>', 4);
        this.p('</Target>', 3);
        this.p('<Target title="Release">', 3);
        this.p('<Option output="bin/Release/' + executableName + '" prefix_auto="1" extension_auto="1" />', 4);
        if (project.getDebugDir().length > 0)
            this.p('<Option working_dir="' + path.resolve(from, project.getDebugDir()) + '" />', 4);
        this.p('<Option object_output="obj/Release/" />', 4);
        this.p('<Option type="0" />', 4);
        this.p('<Option compiler="gcc" />', 4);
        this.p('<Compiler>', 4);
        if (project.cppStd !== '') {
            this.p('<Add option="-std=' + project.cppStd + '" />', 5);
        }
        this.p('<Add option="-O2" />', 5);
        for (const def of project.getDefines()) {
            if (def.config && def.config.toLowerCase() !== 'release') {
                continue;
            }
            this.p('<Add option="-D' + def.value.replace(/\"/g, '\\"') + '" />', 3);
        }
        this.p('<Add option="-DNDEBUG" />', 3);
        this.p('</Compiler>', 4);
        this.p('<Linker>', 4);
        this.p('<Add option="-s" />', 5);
        this.p('</Linker>', 4);
        this.p('</Target>', 3);
        this.p('</Build>', 2);
        this.p('<Compiler>', 2);
        if (project.cppStd !== '') {
            this.p('<Add option="-std=' + project.cppStd + '" />', 5);
        }
        this.p('<Add option="-Wall" />', 3);
        for (let inc of project.getIncludeDirs()) {
            this.p('<Add directory="' + path.resolve(from, inc) + '" />', 3);
        }
        this.p('</Compiler>', 2);
        this.p('<Linker>', 2);
        this.p('<Add option="-pthread" />', 3);
        this.p('<Add option="-static-libgcc" />', 3);
        this.p('<Add option="-static-libstdc++" />', 3);
        /*if (project.cmd) {
            this.p('<Add option="-static" />', 3);
        }*/
        this.p('<Add option="-Wl,-rpath,." />', 3);
        const flags = [].concat(project.cFlags, project.cppFlags);
        for (const flag of flags) {
            this.p('<Add option="' + flag.replace(/\"/g, '\\"') + '" />', 3);
        }
        for (let lib of project.getLibs()) {
            this.p('<Add library="' + lib + '" />', 3);
        }
        if (platform === Platform_1.Platform.Pi) {
            this.p('<Add directory="/opt/vc/lib" />', 3);
        }
        this.p('</Linker>', 2);
        let precompiledHeaders = [];
        for (let file of project.getFiles()) {
            if (file.options && file.options.pch && precompiledHeaders.indexOf(file.options.pch) < 0) {
                precompiledHeaders.push(file.options.pch);
            }
        }
        for (let file of project.getFiles()) {
            let precompiledHeader = null;
            for (let header of precompiledHeaders) {
                if (file.file.endsWith(header)) {
                    precompiledHeader = header;
                    break;
                }
            }
            if (file.file.endsWith('.c') || file.file.endsWith('.cc') || file.file.endsWith('.cpp')) {
                this.p('<Unit filename="' + path.resolve(from, file.file) + '">', 2);
                this.p('<Option compilerVar="CC" />', 3);
                this.p('</Unit>', 2);
            }
            else if (file.file.endsWith('.h')) {
                this.p('<Unit filename="' + path.resolve(from, file.file) + '">', 2);
                if (precompiledHeader !== null) {
                    this.p('<Option compile="1" />', 3);
                    this.p('<Option weight="0" />', 3);
                }
                this.p('</Unit>', 2);
            }
        }
        this.p('<Extensions>', 2);
        this.p('<code_completion />', 3);
        this.p('<debugger />', 3);
        this.p('</Extensions>', 2);
        this.p('</Project>', 1);
        this.p('</CodeBlocks_project_file>');
        this.closeFile();
    }
}
exports.LinuxExporter = LinuxExporter;
//# sourceMappingURL=LinuxExporter.js.map