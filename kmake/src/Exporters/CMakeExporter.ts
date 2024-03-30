import { Project } from 'kmake/Project';
import * as fs from 'kmake/fsextra';
import * as path from 'path';
import { Platform } from 'kmake/Platform';
import * as log from 'kmake/log';
import * as os from 'os';
import * as child_process from 'child_process';
import { Exporter } from 'kmake/Exporters/Exporter';

export class CMakeExporter extends Exporter {
	constructor(options: any) {
		super(options);
	}

	async exportSolution(project: Project, from: string, to: string, platform: string, vrApi: any, options: any): Promise<void> {
		let name = project.getSafeName();

		this.writeFile(path.resolve(to, name, 'CMakeLists.txt'));

		this.p('cmake_minimum_required(VERSION 3.10)');  // should be 3.12 to support c++20, 3.20 to support c++23 and 3.21 to support c17/c23

		this.p('project(' + name + ')');
		switch (project.cppStd) {
			case 'gnu++03':
			case 'c++03':
				this.p('set(CMAKE_CXX_STANDARD 03)');
				break;
			case 'gnu++11':
			case 'c++11':
				this.p('set(CMAKE_CXX_STANDARD 11)');
				break;
			case 'gnu++14':
			case 'c++14':
				this.p('set(CMAKE_CXX_STANDARD 14)');
				break;
			case 'gnu++17':
			case 'c++17':
				this.p('set(CMAKE_CXX_STANDARD 17)');
				break;
			case 'gnu++2a':
			case 'c++2a':
			case 'gnu++20':
			case 'c++20':
				this.p('set(CMAKE_CXX_STANDARD 20)');
				break;
			case 'gnu++2b':
			case 'c++2b':
			case 'gnu++23':
			case 'c++23':
				this.p('set(CMAKE_CXX_STANDARD 23)');
				break;
			default:
				this.p('set(CMAKE_CXX_STANDARD 98)');
				break;
		}

		switch (project.cStd) {
			case 'gnu9x':
			case 'gnu99':
			case 'c9x':
			case 'c99':
				this.p('set(CMAKE_C_STANDARD 99)');
				break;
			case 'gnu1x':
			case 'gnu11':
			case 'c1x':
			case 'c11':
				this.p('set(CMAKE_C_STANDARD 11)');
				break;
			case 'gnu18':
			case 'gnu17':
			case 'c18':
			case 'c17':
				this.p('set(CMAKE_C_STANDARD 17)');
				break;
			case 'gnu2x':
			case 'c2x':
				this.p('set(CMAKE_C_STANDARD 23)');
				break;
			default:
				this.p('set(CMAKE_C_STANDARD 90)');
				break;
		}

		this.p('set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -pthread -static-libgcc -static-libstdc++")');

		let debugDefines = '';
		for (const def of project.getDefines()) {
			if (!def.config || def.config.toLowerCase() === 'debug') {
				debugDefines += ' -D' + def.value;
			}
		}
		this.p('set(CMAKE_C_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG}' + debugDefines + '")');
		this.p('set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG}' + debugDefines + '")');

		let releaseDefines = '';
		for (const def of project.getDefines()) {
			if (!def.config || def.config.toLowerCase() === 'release') {
				releaseDefines += ' -D' + def.value;
			}
		}
		releaseDefines += ' -DNDEBUG';
		this.p('set(CMAKE_C_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE}' + releaseDefines + '")');
		this.p('set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE}' + releaseDefines + '")');

		let includes = '';
		for (let inc of project.getIncludeDirs()) {
			includes += '  "' + path.resolve(inc).replace(/\\/g, '/') + '"\n';
		}
		this.p('include_directories(\n' + includes + ')');

		let files = '';
		for (let file of project.getFiles()) {
			if (file.file.endsWith('.c') || file.file.endsWith('.cc') || file.file.endsWith('.cpp') || file.file.endsWith('.h')) {
				files += '  "' + path.resolve(file.file).replace(/\\/g, '/') + '"\n';
			}
		}
		this.p('set(SOURCE_FILES\n' + files + ')');

		this.p('add_executable(' + name + ' ${SOURCE_FILES})');

		let libraries = '';
		for (let lib of project.getLibs()) {
			libraries += '  ' + lib + '\n';
		}
		this.p('target_link_libraries(' + name + '\n' + libraries + ')');

		this.closeFile();
	}
}
