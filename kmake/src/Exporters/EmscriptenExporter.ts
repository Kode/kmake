import { Exporter } from 'kmake/Exporters/Exporter';
import { Project } from 'kmake/Project';
import { Options } from 'kmake/Options';
import { GraphicsApi } from 'kmake/GraphicsApi';
import * as fs from 'kmake/fsextra';
import * as path from 'path';
import { CompilerCommandsExporter } from 'kmake/Exporters/CompileCommandsExporter';
import { MakeExporter } from 'kmake/Exporters/MakeExporter';
import { NinjaExporter } from 'kmake/Exporters/NinjaExporter';
import * as Icon from 'kmake/Icon';

export class EmscriptenExporter extends Exporter {
	compileCommands: CompilerCommandsExporter;
	make: MakeExporter;
	ninja: NinjaExporter;

	constructor(project: Project, options: any) {
		super(options);
		this.compileCommands = new CompilerCommandsExporter(options);

		let linkerFlags = '-static-libgcc -static-libstdc++';
		if (project.targetOptions.emscripten.threads) {
			linkerFlags += ' -pthread';
		}

		linkerFlags += ' -sTOTAL_MEMORY=134217728 ';
		linkerFlags += ' --preload-file ' + this.debugDirName(project);

		this.make = new MakeExporter(options, 'emcc', 'em++', 'em++', '', '', linkerFlags, '.html');
		this.ninja = new NinjaExporter(options, 'emcc', 'em++', 'em++', '', '', linkerFlags, '.html');
	}

	debugDirName(project: Project): string {
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

	async exportSolution(project: Project, from: string, to: string, platform: string, vrApi: any, options: any) {
		let outputPath = path.resolve(to, options.buildPath);
		fs.ensureDirSync(outputPath);

		fs.copyDirSync(path.resolve(from, this.debugDirName(project)), path.resolve(outputPath, this.debugDirName(project)));

		this.make.exportSolution(project, from, to, platform, vrApi, options);
		this.ninja.exportSolution(project, from, to, platform, vrApi, options);
		this.compileCommands.exportSolution(project, from, to, platform, vrApi, options);

		await Icon.exportIco(project.icon, path.resolve(outputPath, 'favicon.ico'), from, true);
	}
}
