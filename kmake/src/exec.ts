import * as os from 'os';

export function sys() {
	if (os.platform() === 'win32') {
		return '.exe';
	}
	else {
		return '';
	}
}
