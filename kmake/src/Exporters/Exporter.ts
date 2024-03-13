import { Project } from 'kmake/Project';
import * as fs from 'kmake/fsextra';
import * as path from 'path';
import * as log from 'kmake/log';

enum WriteMode {
	None,
	File,
	Stdout
}

export abstract class Exporter {
	writeMode: WriteMode = WriteMode.None;
	outFile: number = 0;
	outString: string = null;

	constructor(options: any) {

	}

	writeFile(file: string) {
		this.writeMode = WriteMode.File;
		this.outFile = fs.openSync(file, 'w');
		this.outString = null;
	}

	writeStdout() {
		this.writeMode = WriteMode.Stdout;
		this.outString = '';
		this.outFile = 0;
	}

	closeFile() {
		fs.closeSync(this.outFile);
		this.outFile = 0;
		this.outString = null;
		this.writeMode = WriteMode.None;
	}

	closeStdout() {
		this.outString = null;
		this.outFile = 0;
		this.writeMode = WriteMode.None;
	}

	p(line: string = '', indent: number = 0) {
		let tabs = '';
		for (let i = 0; i < indent; ++i) {
			tabs += '\t';
		}
		
		if (this.writeMode === WriteMode.Stdout) {
			log.info(tabs + line);
		}
		else if (this.writeMode === WriteMode.File) {
			let data = Buffer.from(tabs + line + '\n');
			fs.writeSync(this.outFile, data, 0, data.length, null);
		}
		else {
			throw 'Writing while not actually writing';
		}
	}

	nicePath(from: string, to: string, filepath: string): string {
		let absolute = filepath;
		if (!path.isAbsolute(absolute)) {
			absolute = path.resolve(from, filepath);
		}
		return path.relative(to, absolute);
	}

	async exportSolution(project: Project, from: string, to: string, platform: string, vrApi: any, options: any): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			reject('Called an abstract function');
		});
	}
}
