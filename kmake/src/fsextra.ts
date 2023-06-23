import * as log from 'kmake/log';
import {
	copyFileSync as fsCopyFileSync,
	existsSync as fsExistsSync,
	readdirSync as fsReaddirSync,
	statSync as fsStatSync,
	writeFileSync as fsWriteFileSync,
	readFileSync as fsReadFileSync,
	mkdirSync as fsMkdirSync,
	openSync as fsOpenSync,
	writeSync as fsWriteSync,
	closeSync as fsCloseSync,
	chmodSync as fsChmodSync,
	renameSync as fsRenameSync,
	stat as fsStat,
	Stats as FsStats,
	FSWatcher as FsFSWatcher,
	watch as fsWatch,
} from 'fs';
import * as path from 'path';

function ensureDirSync(dir: string): void {
	try {
		if (!fsExistsSync(dir)) {
			fsMkdirSync(dir, { recursive: true });
		}
	}
	catch (err) {
		log.error(`Error creating directory ${dir}: ${err}`);
	}
}

function copyDirSync(from: string, to: string): void {
	ensureDirSync(to);
	const files = fsReaddirSync(from);
	for (const file of files) {
		const stat = fsStatSync(path.join(from, file));
		if (stat.isDirectory()) {
			copyDirSync(path.join(from, file), path.join(to, file));
		}
		else {
			fsCopyFileSync(path.join(from, file), path.join(to, file));
		}
	}
}

export {
	fsExistsSync as existsSync,
	fsReaddirSync as readdirSync,
	fsStatSync as statSync,
	fsWriteFileSync as writeFileSync,
	fsReadFileSync as readFileSync,
	fsOpenSync as openSync,
	fsWriteSync as writeSync,
	fsCloseSync as closeSync,
	fsCopyFileSync as copyFileSync,
	fsChmodSync as chmodSync,
	fsRenameSync as renameSync,
	fsStat as stat,
	FsStats as Stats,
	FsFSWatcher as FSWatcher,
	fsWatch as watch,
	ensureDirSync,
	copyDirSync
};
