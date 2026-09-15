import { Exporter } from 'kmake/Exporters/Exporter';
import { Project } from 'kmake/Project';
import { NinjaExporter } from 'kmake/Exporters/NinjaExporter';
import { MakeExporter } from 'kmake/Exporters/MakeExporter';
import { CLionExporter } from 'kmake/Exporters/CLionExporter';
import { CompilerCommandsExporter } from 'kmake/Exporters/CompileCommandsExporter';
import * as fs from 'kmake/fsextra';
import * as path from 'path';

export class KompjutaExporter extends Exporter {
	ninja: NinjaExporter;
	make: MakeExporter;
	clion: CLionExporter;
	compileCommands: CompilerCommandsExporter;

	constructor(options: any) {
		super(options);
		
		const cFlags = '--target=riscv64-unknown-elf -march=rv64imfdv_zvl1024b -mabi=lp64d -Os -ffreestanding -fno-builtin -ffunction-sections -fdata-sections -nostdlib -mno-relax';
		const linkerFlags = '--target=riscv64-unknown-elf -march=rv64imfdv_zvl1024b -mabi=lp64d -Os -ffreestanding -fno-builtin -ffunction-sections -fdata-sections -nostdlib -mno-relax -fuse-ld=lld "-Wl,--no-relax,--gc-sections,-Map,link.map,-T,kompjuta.ld"';

		const outputExtension = '.elf';

		this.ninja = new NinjaExporter(options, 'clang', 'clang++', 'clang++', cFlags, cFlags, linkerFlags, outputExtension);
		this.make = new MakeExporter(options, 'clang', 'clang++', 'clang++', cFlags, cFlags, linkerFlags, outputExtension);
		this.clion = new CLionExporter(options);
		this.compileCommands = new CompilerCommandsExporter(options);
	}

	async exportSolution(project: Project, from: string, to: string, platform: string, vrApi: any, options: any) {
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
