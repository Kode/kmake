import { Exporter } from 'kmake/Exporters/Exporter';
import { GraphicsApi } from 'kmake/GraphicsApi';
import { Options } from 'kmake/Options';
import { Platform } from 'kmake/Platform';
import { Project } from 'kmake/Project';
import { Compiler } from 'kmake/Compiler';
import * as fs from 'kmake/fsextra';
import * as path from 'path';

export class FreeBSDExporter extends Exporter {
	constructor() {
		super();
	}

	async exportSolution(project: Project, from: string, to: string, platform: string, vrApi: any, options: any) {
		this.exportMakefile(project, from, to, platform, vrApi, options);
		this.exportCodeBlocks(project, from, to, platform, vrApi, options);
		this.exportCLion(project, from, to, platform, vrApi, options);
		this.exportCompileCommands(project, from, to, platform, vrApi, options);
	}

	exportMakefile(project: Project, from: string, to: string, platform: string, vrApi: any, options: any) {
		const cCompiler = Options.compiler === Compiler.GCC ? 'gcc' : 'clang';
		const cppCompiler = Options.compiler === Compiler.GCC ? 'g++' : 'clang++';

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
		incline += '-I/usr/local/include'; // Add search dir for FreeBSD

		this.p('INC=' + incline);

		let libsline = '-static-libgcc -static-libstdc++ -pthread';
		/*if (project.cmd) {
			libsline += ' -static';
		}*/
		for (let lib of project.getLibs()) {
			libsline += ' -l' + lib;
		}
		libsline += ' -L/usr/local/lib'; // Add search dir for FreeBSD
		this.p('LIB=' + libsline);

		let defline = '';
		for (const def of project.getDefines()) {
			if (def.config && def.config.toLowerCase() === 'debug' && !options.debug) {
				continue;
			}

			if (def.config && def.config.toLowerCase() === 'release' && options.debug) {
				continue;
			}
			defline += '-D' + def.value + ' ';
		}
		this.p('DEF=' + defline);
		this.p();

		let cline = '-std=c99 ';
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

		let cppline = '';
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
		if (!options.debug) optimization = '-O2';
		else optimization = '-g';

		let executableName = project.getSafeName();
		if (project.getExecutableName()) {
			executableName = project.getExecutableName();
		}

		if (options.lib) {
			this.p(executableName + '.a: ' + gchfilelist + ofilelist);
		}
		else if (options.dynlib) {
			this.p(executableName + '.so: ' + gchfilelist + ofilelist);
		}
		else {
			this.p(executableName + ': ' + gchfilelist + ofilelist);
		}

		let cpp = '';

		let output = '-o "' + executableName + '"';
		if (options.lib) {
			output = '-o "' + executableName + '.a"';
		}
		else if (options.dynlib) {
			output = '-shared -o "' + executableName + '.so"';
		}
		this.p('\t' + (options.lib ? 'ar rcs' : cppCompiler) + ' ' + output + ' ' + cpp + ' ' + optimization + ' ' + ofilelist + ' $(LIB)');

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
				this.p(path.basename(realfile) + '.gch: ' + realfile);
				this.p('\t' + cppCompiler + ' ' + cpp + ' ' + optimization + ' $(INC) $(DEF) -c ' + realfile + ' -o ' + path.basename(file.file) + '.gch');
			}
		}

		for (let fileobject of project.getFiles()) {
			let file = fileobject.file;
			if (file.endsWith('.c') || file.endsWith('.cpp') || file.endsWith('.cc') || file.endsWith('.s') || file.endsWith('.S')) {
				this.p();
				let name = ofiles[file];
				let realfile = path.relative(outputPath, path.resolve(from, file));
				this.p(name + '.o: ' + realfile);

				let compiler = cppCompiler;
				let flags = '$(CPPFLAGS)';
				if (file.endsWith('.c')) {
					compiler = cCompiler;
					flags = '$(CFLAGS)';
				}
				else if (file.endsWith('.s') || file.endsWith('.S')) {
					compiler = cCompiler;
					flags = '';
				}

				this.p('\t' + compiler + ' ' + cpp + ' ' + optimization + ' $(INC) $(DEF) ' + flags + ' -c ' + realfile + ' -o ' + name + '.o');
			}
		}

		// project.getDefines()
		// project.getIncludeDirs()

		this.closeFile();
	}

	exportCodeBlocks(project: Project, from: string, to: string, platform: string, vrApi: any, options: any) {
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
		this.p('<Option output="bin/Debug/' + project.getSafeName() + '" prefix_auto="1" extension_auto="1" />', 4);
		if (project.getDebugDir().length > 0) this.p('<Option working_dir="' + path.resolve(from, project.getDebugDir()) + '" />', 4);
		this.p('<Option object_output="obj/Debug/" />', 4);
		this.p('<Option type="1" />', 4);
		this.p('<Option compiler="gcc" />', 4);
		this.p('<Compiler>', 4);
		if (project.cppStd !== '') {
			this.p('<Add option="-std=' + project.cppStd + '" />', 5);
		}
		this.p('<Add option="-g" />', 5);
		this.p('</Compiler>', 4);
		this.p('</Target>', 3);
		this.p('<Target title="Release">', 3);
		this.p('<Option output="bin/Release/' + project.getSafeName() + '" prefix_auto="1" extension_auto="1" />', 4);
		if (project.getDebugDir().length > 0) this.p('<Option working_dir="' + path.resolve(from, project.getDebugDir()) + '" />', 4);
		this.p('<Option object_output="obj/Release/" />', 4);
		this.p('<Option type="0" />', 4);
		this.p('<Option compiler="gcc" />', 4);
		this.p('<Compiler>', 4);
		if (project.cppStd !== '') {
			this.p('<Add option="-std=' + project.cppStd + '" />', 5);
		}
		this.p('<Add option="-O2" />', 5);
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
		for (const def of project.getDefines()) {
			this.p('<Add option="-D' + def.value.replace(/\"/g, '\\"') + '" />', 3);
		}
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
		for (let lib of project.getLibs()) {
			this.p('<Add library="' + lib + '" />', 3);
		}
		if (platform === Platform.Pi) {
			this.p('<Add directory="/opt/vc/lib" />', 3);
		}
		this.p('</Linker>', 2);

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

	exportCompileCommands(project: Project, _from: string, to: string, platform: string, vrApi: any, options: any) {
		let from = path.resolve(process.cwd(), _from);
		// TODO : assembly files, precompiled headers and all that stuff
		// compile_commands.json is primarily for code completion so those things shouldn't matter too much
		this.writeFile(path.resolve(to, 'compile_commands.json'));
		let includes = [];
		for (let inc of project.getIncludeDirs()) {
			includes.push('-I');
			includes.push(path.resolve(from, inc));
		}
		let defines = [];
		for (let def of project.getDefines()) {
			defines.push('-D');
			defines.push(def.value.replace(/\"/g, '\\"'));
		}
		let libs = [];
		for (let lib of project.getLibs()) {
			libs.push('-l' + lib);
		}
		let optimization = options.debug ? '-g' : '-O2';

		let objects: any = {};
		let ofiles: any = {};
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

		let commands = [];
		for (let fileobject of project.getFiles()) {
			let file = fileobject.file;
			if (file.endsWith('.c') || file.endsWith('.cpp') || file.endsWith('.cc')) {
				let args = [file.endsWith('.c') ? '/usr/bin/clang' : '/usr/bin/clang++', optimization, '-c', '-o', (options.debug ? 'Debug' : 'Release') + ofiles[file] + '.o'];
				if (file.endsWith('.c')) {
					args.push('-std=' + (project.cStd !== '' ? project.cStd : 'c99'));
				}
				else if (file.endsWith('.cpp')) {
					args.push('-std=' + (project.cppStd !== '' ? project.cppStd : 'c++11'));
				}
				if (options.dynlib) {
					args.push('-fPIC');
				}
				args.push(path.resolve(from, file));
				let command = {
					directory: from,
					file: path.resolve(from, file),
					output: path.resolve(to, ofiles[file] + '.o'),
					arguments: args.concat(includes).concat(defines)
				};
				commands.push(command);
			}
		}
		/*let linker_args = ['/usr/bin/clang', '-O2', '-static-libgcc', '-static-libstdc++', '-pthread'];
		for (let file in ofiles) {
			linker_args.push(path.resolve(to, ofiles[file] + '.o'));
		}
		linker_args.push('-o');
		if (options.lib) {
			linker_args.push('-o');
			linker_args.push(project.getSafeName() + '.a');
		}
		else if (options.dynlib) {
			linker_args.push('-shared');
			linker_args.push('-fPIC');
			linker_args.push('-o');
			linker_args.push(project.getSafeName() + '.so');

		}
		else {
			linker_args.push('-o');
			linker_args.push(project.getSafeName());
		}

		commands.push({
			directory: from,
			output: linker_args[linker_args.length - 1],
			arguments: linker_args.concat(libs)
		});*/


		this.p(JSON.stringify(commands));
		this.closeFile();
	}
}
