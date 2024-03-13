"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NinjaExporter = void 0;
const Exporter_1 = require("kmake/Exporters/Exporter");
const fs = require("kmake/fsextra");
const path = require("path");
class NinjaExporter extends Exporter_1.Exporter {
    constructor(options, cCompiler, cppCompiler, cFlags, cppFlags, linkerFlags, outputExtension) {
        super(options);
        this.cCompiler = cCompiler;
        this.cppCompiler = cppCompiler;
        this.cFlags = cFlags;
        this.cppFlags = cppFlags;
        this.linkerFlags = linkerFlags;
        this.outputExtension = outputExtension;
    }
    async exportSolution(project, from, to, platform, vrApi, options) {
        let objects = {};
        let ofiles = {};
        let outputPath = path.resolve(to, options.buildPath);
        fs.ensureDirSync(outputPath);
        for (let fileobject of project.getFiles()) {
            let file = fileobject.file;
            if (file.endsWith('.cpp') || file.endsWith('.c') || file.endsWith('.cc') || file.endsWith('.s') || file.endsWith('.S')) {
                let name = file.toLowerCase();
                if (name.indexOf('/') >= 0)
                    name = name.substr(name.lastIndexOf('/') + 1);
                name = name.substr(0, name.lastIndexOf('.'));
                if (!objects[name]) {
                    objects[name] = true;
                    ofiles[file] = name;
                }
                else {
                    while (objects[name]) {
                        name = name + '_';
                    }
                    objects[name] = true;
                    ofiles[file] = name;
                }
            }
        }
        let ofilelist = '';
        for (let o in objects) {
            ofilelist += o + '.o ';
        }
        this.writeFile(path.resolve(outputPath, 'build.ninja'));
        this.p('pool link_pool\n  depth = 1\n');
        let incline = '';
        for (let inc of project.getIncludeDirs()) {
            inc = path.relative(outputPath, path.resolve(from, inc));
            incline += '-I' + inc + ' ';
        }
        let libsline = this.linkerFlags;
        for (let lib of project.getLibs()) {
            libsline += ' -l' + lib;
        }
        libsline += ' ';
        let defline = '';
        for (const def of project.getDefines()) {
            if (def.config && def.config.toLowerCase() === 'debug' && !options.debug) {
                continue;
            }
            if (def.config && def.config.toLowerCase() === 'release' && options.debug) {
                continue;
            }
            defline += '-D' + def.value.replace(/\"/g, '\\"') + ' ';
        }
        if (!options.debug) {
            defline += '-DNDEBUG ';
        }
        let optimization = '';
        if (!options.debug) {
            optimization = '-O2';
        }
        else
            optimization = '-g';
        let cline = this.cCompiler + ' ' + this.cFlags + ' ';
        if (project.cStd !== '') {
            cline += '-std=' + project.cStd + ' ';
        }
        if (options.dynlib) {
            cline += '-fPIC ';
        }
        for (let flag of project.cFlags) {
            cline += flag + ' ';
        }
        cline += optimization + ' ';
        cline += incline;
        cline += defline;
        this.p('rule cc\n  deps = gcc\n  depfile = $out.d\n  command = ' + cline + '-MD -MF $out.d -c $in -o $out\n');
        let cppline = this.cppCompiler + ' ' + this.cppFlags + ' ';
        if (project.cppStd !== '') {
            cppline += '-std=' + project.cppStd + ' ';
        }
        if (options.dynlib) {
            cppline += '-fPIC ';
        }
        for (let flag of project.cppFlags) {
            cppline += flag + ' ';
        }
        cppline += optimization + ' ';
        cppline += incline;
        cppline += defline;
        this.p('rule cxx\n  deps = gcc\n  depfile = $out.d\n  command = ' + cppline + '-MD -MF $out.d -c $in -o $out\n');
        if (options.dynlib) {
            this.p('rule link\n  pool = link_pool\n  command = ' + this.cppCompiler + ' -fPIC -shared -o $out ' + optimization + ' $in ' + libsline);
        }
        else if (options.lib) {
            this.p('rule link\n  pool = link_pool\n  command = ar rcs -o $out $in');
        }
        else {
            this.p('rule link\n  pool = link_pool\n  command = ' + this.cppCompiler + ' -o $out ' + optimization + ' $in ' + libsline);
        }
        for (let fileobject of project.getFiles()) {
            let file = fileobject.file;
            if (file.endsWith('.c') || file.endsWith('.cpp') || file.endsWith('.cc') || file.endsWith('.s') || file.endsWith('.S')) {
                this.p();
                let name = ofiles[file];
                let realfile = path.relative(outputPath, path.resolve(from, file));
                let compiler = 'cxx';
                if (file.endsWith('.c')) {
                    compiler = 'cc';
                }
                else if (file.endsWith('.s') || file.endsWith('.S')) {
                    compiler = 'asm';
                }
                this.p('build ' + name + '.o: ' + compiler + ' ' + realfile);
            }
        }
        this.p();
        let executableName = project.getSafeName();
        if (project.getExecutableName()) {
            executableName = project.getExecutableName();
        }
        let outputname = executableName + this.outputExtension;
        this.p('build ' + outputname + ': link ' + ofilelist);
        this.closeFile();
    }
}
exports.NinjaExporter = NinjaExporter;
//# sourceMappingURL=NinjaExporter.js.map