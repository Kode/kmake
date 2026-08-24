import { Exporter } from 'kmake/Exporters/Exporter';
import { Project } from 'kmake/Project';
import { CompilerCommandsExporter } from 'kmake/Exporters/CompileCommandsExporter';
import { MakeExporter } from 'kmake/Exporters/MakeExporter';
import { NinjaExporter } from 'kmake/Exporters/NinjaExporter';
import * as Icon from 'kmake/Icon';
import * as path from 'path';

export class WasmExporter extends Exporter {
	compileCommands: CompilerCommandsExporter;
	make: MakeExporter;
	ninja: NinjaExporter;

	constructor(options: any) {
		super(options);
		this.compileCommands = new CompilerCommandsExporter(options);
		const compiler = 'clang';
		const compilerFlags = '--target=wasm32 -nostdlib -matomics -mbulk-memory';
		this.make = new MakeExporter(options, compiler, compiler, compiler, compilerFlags, compilerFlags, '--target=wasm32 -nostdlib -matomics -mbulk-memory "-Wl,--import-memory,--shared-memory"', '.wasm');
		this.ninja = new NinjaExporter(options, compiler, compiler, compiler, compilerFlags, compilerFlags, '--target=wasm32 -nostdlib -matomics -mbulk-memory "-Wl,--import-memory,--shared-memory"', '.wasm');
	}

	async exportSolution(project: Project, from: string, to: string, platform: string, vrApi: any, options: any) {
		this.make.exportSolution(project, from, to, platform, vrApi, options);
		this.ninja.exportSolution(project, from, to, platform, vrApi, options);
		this.compileCommands.exportSolution(project, from, to, platform, vrApi, options);

		await Icon.exportIco(project.icon, path.resolve(to, options.buildPath, 'favicon.ico'), from, true);
	}
}
