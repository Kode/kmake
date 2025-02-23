import { Exporter } from 'kmake/Exporters/Exporter';
import { Options } from 'kmake/Options';
import { Platform } from 'kmake/Platform';
import { Project } from 'kmake/Project';
import { Compiler } from 'kmake/Compiler';
import * as fs from 'kmake/fsextra';
import * as path from 'path';
import { NinjaExporter } from 'kmake/Exporters/NinjaExporter';
import { MakeExporter } from 'kmake/Exporters/MakeExporter';
import { CLionExporter } from 'kmake/Exporters/CLionExporter';
import { CompilerCommandsExporter } from 'kmake/Exporters/CompileCommandsExporter';

export class LinuxExporter extends Exporter {
	ninja: NinjaExporter;
	make: MakeExporter;
	clion: CLionExporter;
	compileCommands: CompilerCommandsExporter;

	constructor(options: any) {
		super(options);
		
		let linkerFlags = '-static-libgcc -static-libstdc++ -pthread';
		if (Options.compiler === Compiler.MuslGcc || this.getOS().includes('Alpine')) {
			linkerFlags += ' -static';
		}

		let outputExtension = '';
		if (options.lib) {
			outputExtension = '.a';
		}
		else if (options.dynlib) {
			outputExtension = '.so';
		}

		this.ninja = new NinjaExporter(options, this.getCCompiler(), this.getCPPCompiler(), '', '', linkerFlags, outputExtension);
		this.make = new MakeExporter(options, this.getCCompiler(), this.getCPPCompiler(), '', '', linkerFlags, outputExtension);
		this.clion = new CLionExporter(options);
		this.compileCommands = new CompilerCommandsExporter(options);
	}

	async exportSolution(project: Project, from: string, to: string, platform: string, vrApi: any, options: any) {
		this.ninja.exportSolution(project, from, to, platform, vrApi, options);
		this.make.exportSolution(project, from, to, platform, vrApi, options);
		this.exportCodeBlocks(project, from, to, platform, vrApi, options);
		this.clion.exportSolution(project, from, to, platform, vrApi, options);
		this.compileCommands.exportSolution(project, from, to, platform, vrApi, options);
	}

	getCCompiler(): string {
		switch (Options.compiler) {
			case Compiler.Default:
			case Compiler.GCC:
				return 'gcc';
			case Compiler.Clang:
				return 'clang';
			case Compiler.MuslGcc:
				return 'musl-gcc';
			case Compiler.Custom:
				return Options.ccPath;
			default:
				throw 'Unsupported compiler ' + Options.compiler;
		}
	}

	getCPPCompiler(): string {
		switch (Options.compiler) {
			case Compiler.Default:
			case Compiler.GCC:
				return 'g++';
			case Compiler.Clang:
				return 'clang++';
			case Compiler.MuslGcc:
				return 'g++';
			case Compiler.Custom:
				return Options.cxxPath;
			default:
				throw 'Unsupported compiler ' + Options.compiler;
		}
	}

	getOS(): string {
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

		let executableName = project.getSafeName();
		if (project.getExecutableName()) {
			executableName = project.getExecutableName();
		}

		this.p('<Option output="bin/Debug/' + executableName + '" prefix_auto="1" extension_auto="1" />', 4);
		if (project.getDebugDir().length > 0) this.p('<Option working_dir="' + path.resolve(from, project.getDebugDir()) + '" />', 4);
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
		if (project.getDebugDir().length > 0) this.p('<Option working_dir="' + path.resolve(from, project.getDebugDir()) + '" />', 4);
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
				if (!file.options || !file.options.nocompile) {
					this.p('<Option compilerVar="CC" />', 3);
				}
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
