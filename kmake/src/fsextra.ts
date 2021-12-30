import { existsSync as fsExistsSync, readdirSync as fsReaddirSync, statSync as fsStatSync, writeFileSync as fsWriteFileSync, readFileSync as fsReadFileSync, mkdirSync as fsMkdirSync, openSync as fsOpenSync, writeSync as fsWriteSync, closeSync as fsCloseSync } from 'fs';

function ensureDirSync(path: string): void {
	if (!fsExistsSync(path)) {
		fsMkdirSync(path);
	}
}

function copySync(from: string, to: string, options?: any): void {

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
	ensureDirSync,
	copySync
};
