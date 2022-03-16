import { copyFileSync as fsCopyFileSync, existsSync as fsExistsSync, readdirSync as fsReaddirSync, statSync as fsStatSync, writeFileSync as fsWriteFileSync, readFileSync as fsReadFileSync, mkdirSync as fsMkdirSync, openSync as fsOpenSync, writeSync as fsWriteSync, closeSync as fsCloseSync, chmodSync as fsChmodSync } from 'fs';
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
	ensureDirSync,
	copyDirSync
};
