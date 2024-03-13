import { Exporter } from 'kmake/Exporters/Exporter';
import { Options } from 'kmake/Options';
import { Platform } from 'kmake/Platform';
import { Project } from 'kmake/Project';
import { Compiler } from 'kmake/Compiler';
import * as fs from 'kmake/fsextra';
import * as path from 'path';

export class MakeExporter extends Exporter {
	cCompiler: string;
	cppCompiler: string;
	cFlags: string;
	cppFlags: string;
	linkerFlags: string;
	outputExtension: string;

	constructor(options: any, cCompiler: string, cppCompiler: string, cFlags: string, cppFlags: string, linkerFlags: string, outputExtension: string) {
		super(options);
		this.cCompiler = cCompiler;
		this.cppCompiler = cppCompiler;
		this.cFlags = cFlags;
		this.cppFlags = cppFlags;
		this.linkerFlags = linkerFlags;
		this.outputExtension = outputExtension;
	}

	async exportSolution(project: Project, from: string, to: string, platform: string, vrApi: any, options: any) {
		let objects: any = {};
		let ofiles: any = {};
		let outputPath = path.resolve(to, options.buildPath);
		fs.ensureDirSync(outputPath);

		for (let fileobject of project.getFiles()) {
			let file = fileobject.file;
			if (file.endsWith('.cpp') || file.endsWith('.c') || file.endsWith('.cc') || file.endsWith('.s') || file.endsWith('.S')) {
				let name = file.toLowerCase();
				if (name.indexOf('/') >= 0) name = name.substr(name.lastIndexOf('/') + 1);
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

		let gchfilelist = '';
		let precompiledHeaders: string[] = [];
		for (let file of project.getFiles()) {
			if (file.options && file.options.pch && precompiledHeaders.indexOf(file.options.pch) < 0) {
				precompiledHeaders.push(file.options.pch);
			}
		}
		for (let file of project.getFiles()) {
			let precompiledHeader: string = null;
			for (let header of precompiledHeaders) {
				if (file.file.endsWith(header)) {
					precompiledHeader = header;
					break;
				}
			}
			if (precompiledHeader !== null) {
				// let realfile = path.relative(outputPath, path.resolve(from, file.file));
				gchfilelist += path.basename(file.file) + '.gch ';
			}
		}

		let ofilelist = '';
		for (let o in objects) {
			ofilelist += o + '.o ';
		}

		this.writeFile(path.resolve(outputPath, 'makefile'));

		let incline = '-I./ '; // local directory to pick up the precompiled header hxcpp.h.gch
		for (let inc of project.getIncludeDirs()) {
			inc = path.relative(outputPath, path.resolve(from, inc));
			incline += '-I' + inc + ' ';
		}
		this.p('INC=' + incline);

		let libsline = this.linkerFlags;
		for (let lib of project.getLibs()) {
			libsline += ' -l' + lib;
		}
		this.p('LIB=' + libsline);

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
		this.p('DEF=' + defline);
		this.p();

		let cline = this.cFlags;
		if (project.cStd !== '') {
			cline = '-std=' + project.cStd + ' ';
		}
		if (options.dynlib) {
			cline += '-fPIC ';
		}
		for (let flag of project.cFlags) {
			cline += flag + ' ';
		}
		this.p('CFLAGS=' + cline);

		let cppline = this.cppFlags;
		if (project.cppStd !== '') {
			cppline = '-std=' + project.cppStd + ' ';
		}
		if (options.dynlib) {
			cppline += '-fPIC ';
		}
		for (let flag of project.cppFlags) {
			cppline += flag + ' ';
		}
		this.p('CPPFLAGS=' + cppline);

		let optimization = '';
		if (!options.debug) {
			optimization = '-O2';
		}
		else optimization = '-g';

		let executableName = project.getSafeName();
		if (project.getExecutableName()) {
			executableName = project.getExecutableName();
		}

		this.p(executableName + this.outputExtension + ': ' + gchfilelist + ofilelist);

		let cpp = '';

		let output = '-o "' + executableName + this.outputExtension + '"';
		if (options.dynlib) {
			output = '-shared -o "' + executableName + '.so"';
		}

		if (options.lib) {
			this.p('\t' + 'ar rcs ' + output + ' ' + ofilelist);
		}
		else {
			this.p('\t' + this.cppCompiler + ' ' + output + ' ' + cpp + ' ' + optimization + ' ' + ofilelist + ' $(LIB)');
		}

		for (let file of project.getFiles()) {
			let precompiledHeader: string = null;
			for (let header of precompiledHeaders) {
				if (file.file.endsWith(header)) {
					precompiledHeader = header;
					break;
				}
			}
			if (precompiledHeader !== null) {
				let realfile = path.relative(outputPath, path.resolve(from, file.file));
				this.p('-include ' + path.basename(file.file) + '.d');
				this.p(path.basename(realfile) + '.gch: ' + realfile);
				this.p('\t' + this.cppCompiler + ' ' + cpp + ' ' + optimization + ' $(INC) $(DEF) -MD -c ' + realfile + ' -o ' + path.basename(file.file) + '.gch');
			}
		}

		for (let fileobject of project.getFiles()) {
			let file = fileobject.file;
			if (file.endsWith('.c') || file.endsWith('.cpp') || file.endsWith('.cc') || file.endsWith('.s') || file.endsWith('.S')) {
				this.p();
				let name = ofiles[file];
				let realfile = path.relative(outputPath, path.resolve(from, file));

				this.p('-include ' + name + '.d');

				this.p(name + '.o: ' + realfile);

				let compiler = this.cppCompiler;
				let flags = '$(CPPFLAGS)';
				if (file.endsWith('.c')) {
					compiler = this.cCompiler;
					flags = '$(CFLAGS)';
				}
				else if (file.endsWith('.s') || file.endsWith('.S')) {
					compiler = this.cCompiler;
					flags = '';
				}

				this.p('\t' + compiler + ' ' + cpp + ' ' + optimization + ' $(INC) $(DEF) -MD ' + flags + ' -c ' + realfile + ' -o ' + name + '.o');
			}
		}

		// project.getDefines()
		// project.getIncludeDirs()

		this.closeFile();
	}
}
