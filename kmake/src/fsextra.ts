import { copyFileSync as fsCopyFileSync, existsSync as fsExistsSync, readdirSync as fsReaddirSync, statSync as fsStatSync, writeFileSync as fsWriteFileSync, readFileSync as fsReadFileSync, mkdirSync as fsMkdirSync, openSync as fsOpenSync, writeSync as fsWriteSync, closeSync as fsCloseSync } from 'fs';
import * as path from 'path';

function ensureDirSync(dir: string): void {
	const parent = path.normalize(path.join(dir, '..'));
	if (!fsExistsSync(parent)) {
		ensureDirSync(parent);
	}
	if (!fsExistsSync(dir)) {
		fsMkdirSync(dir);
	}
}

function copyDirSync(from: string, to: string): void {
	// TODO
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
	ensureDirSync,
	copyDirSync
};
