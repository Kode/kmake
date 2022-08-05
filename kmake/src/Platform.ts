export interface PlatformType {
	Windows: string;
	WindowsApp: string;
	iOS: string;
	OSX: string;
	Android: string;
	Linux: string;
	Emscripten: string;
	Tizen: string;
	Pi: string;
	tvOS: string;
	PS4: string;
	XboxOne: string;
	Switch: string;
	XboxScarlett: string;
	PS5: string;
	FreeBSD: string;
	Wasm: string;
}

export let Platform: PlatformType = {
	Windows: 'windows',
	WindowsApp: 'windowsapp',
	iOS: 'ios',
	OSX: 'osx',
	Android: 'android',
	Linux: 'linux',
	Emscripten: 'emscripten',
	Tizen: 'tizen',
	Pi: 'pi',
	tvOS: 'tvos',
	PS4: 'ps4',
	XboxOne: 'xboxone',
	Switch: 'switch',
	XboxScarlett: 'xboxscarlett',
	PS5: 'ps5',
	FreeBSD: 'freebsd',
	Wasm: 'wasm'
};
