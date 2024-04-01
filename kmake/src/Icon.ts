import * as log from 'kmake/log';
import * as exec from 'kmake/exec';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function run(from: string, to: string, width: number, height: number, format: string, background: number, callback: any) {
	const exe = path.resolve(__dirname, 'kraffiti' + exec.sys());

	let params = ['from=' + from, 'to=' + to, 'format=' + format, 'keepaspect'];
	if (width > 0) params.push('width=' + width);
	if (height > 0) params.push('height=' + height);
	if (background !== undefined) params.push('background=' + background.toString(16));
	let child = cp.spawn(exe, params);

	child.stdout.on('data', (data: any) => {
		// log.info('kraffiti stdout: ' + data);
	});

	child.stderr.on('data', (data: any) => {
		log.error('kraffiti stderr: ' + data);
	});

	child.on('error', (err: any) => {
		log.error('kraffiti error: ' + err);
	});

	child.on('close', (code: number) => {
		if (code !== 0) log.error('kraffiti exited with code ' + code);
		callback();
	});
}

function findIcon(icon: string, from: string) {
	if (icon && fs.existsSync(path.join(from, icon))) return path.join(from, icon);
	if (fs.existsSync(path.join(from, 'icon.png'))) return path.join(from, 'icon.png');
	else return path.join(__dirname, 'icon.png');
}

export async function exportIco(icon: string, to: string, from: string) {
	return new Promise(resolve => {
		run(findIcon(icon, from.toString()), to.toString(), 0, 0, 'ico', undefined, resolve);
	});
}

export async function exportIcns(icon: string, to: string, from: string) {
	return new Promise(resolve => {
		run(findIcon(icon, from.toString()), to.toString(), 0, 0, 'icns', undefined, resolve);
	});
}

export async function exportPng(icon: string, to: string, width: number, height: number, background: number, from: string) {
	return new Promise(resolve => {
		run(findIcon(icon, from.toString()), to.toString(), width, height, 'png', background, resolve);
	});
}

export async function exportPng24(icon: string, to: string, width: number, height: number, background: number, from: string) {
	return new Promise(resolve => {
		run(findIcon(icon, from.toString()), to.toString(), width, height, 'png24', background, resolve);
	});
}

export async function exportBmp(icon: string, to: string, width: number, height: number, background: number, from: string) {
	return new Promise(resolve => {
		run(findIcon(icon, from.toString()), to.toString(), width, height, 'bmp', background, resolve);
	});
}
