import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'kmake/fsextra';
import * as log from 'kmake/log';
import { GraphicsApi } from 'kmake/GraphicsApi';
import { Options } from 'kmake/Options';
import { Project } from 'kmake/Project';
import { Platform } from 'kmake/Platform';
import * as exec from 'kmake/exec';
import { VisualStudioVersion } from 'kmake/VisualStudioVersion';
import { Exporter } from 'kmake/Exporters/Exporter';
import { AndroidExporter } from 'kmake/Exporters/AndroidExporter';
import { LinuxExporter } from 'kmake/Exporters/LinuxExporter';
import { EmscriptenExporter } from 'kmake/Exporters/EmscriptenExporter';
import { WasmExporter } from 'kmake/Exporters/WasmExporter';
import { VisualStudioExporter } from 'kmake/Exporters/VisualStudioExporter';
import { XCodeExporter } from 'kmake/Exporters/XCodeExporter';
import { VSCodeExporter } from 'kmake/Exporters/VSCodeExporter';
import { FreeBSDExporter } from 'kmake/Exporters/FreeBSDExporter';
import { JsonExporter } from 'kmake/Exporters/JsonExporter';
import { MesonExporter } from 'kmake/Exporters/MesonExporter';
import { KompjutaExporter } from 'kmake/Exporters/KompjutaExporter';
import { Compiler } from 'kmake/Compiler';
import { Architecture } from 'kmake/Architecture';

let _global: any = global;
_global.__base = __dirname + '/';

let debug = false;

function fromPlatform(platform: string): string {
	switch (platform.toLowerCase()) {
		case Platform.Windows:
			return 'Windows';
		case Platform.WindowsApp:
			return 'Windows App';
		case Platform.iOS:
			return 'iOS';
		case Platform.OSX:
			return 'macOS';
		case Platform.Android:
			return 'Android';
		case Platform.Linux:
			return 'Linux';
		case Platform.Emscripten:
			return 'Emscripten';
		case Platform.Pi:
			return 'Pi';
		case Platform.tvOS:
			return 'tvOS';
		case Platform.PS4:
			return 'PlayStation 4';
		case Platform.XboxOne:
			return 'Xbox One';
		case Platform.Switch:
			return 'Switch';
		case Platform.XboxSeries:
			return 'Xbox Series X|S';
		case Platform.PS5:
			return 'PlayStation 5';
		case Platform.Switch2:
			return 'Switch 2';
		case Platform.FreeBSD:
			return 'FreeBSD';
		case Platform.Wasm:
			return 'Web Assembly';
		case Platform.Kompjuta:
			return 'Kompjuta';
		default:
			throw 'Unknown platform ' + platform + '.';
	}
}

function shaderLang(platform: string): string {
	switch (platform) {
		case Platform.Windows:
			switch (Options.graphicsApi) {
				case GraphicsApi.OpenGL:
					return 'glsl';
				case GraphicsApi.Direct3D9:
					return 'd3d9';
				case GraphicsApi.Direct3D11:
					return 'd3d11';
				case GraphicsApi.Direct3D12:
				case GraphicsApi.Default:
					return 'd3d11';
				case GraphicsApi.Vulkan:
					return 'spirv';
				default:
					throw new Error('Unsupported shader language.');
			}
		case Platform.WindowsApp:
			return 'd3d11';
		case Platform.iOS:
		case Platform.tvOS:
			switch (Options.graphicsApi) {
				case GraphicsApi.Default:
				case GraphicsApi.Metal:
					return 'metal';
				case GraphicsApi.OpenGL:
					return 'essl';
				default:
					throw new Error('Unsupported shader language.');
			}
		case Platform.OSX:
			switch (Options.graphicsApi) {
				case GraphicsApi.Default:
				case GraphicsApi.Metal:
					return 'metal';
				case GraphicsApi.OpenGL:
					return 'glsl';
				default:
					throw new Error('Unsupported shader language.');
			}
		case Platform.Android:
			switch (Options.graphicsApi) {
				case GraphicsApi.Default:
				case GraphicsApi.Vulkan:
					return 'spirv';
				case GraphicsApi.OpenGL:
					return 'essl';
				default:
					throw new Error('Unsupported shader language.');
			}
		case Platform.Linux:
			switch (Options.graphicsApi) {
				case GraphicsApi.Default:
				case GraphicsApi.Vulkan:
					return 'spirv';
				case GraphicsApi.OpenGL:
					return 'glsl';
				default:
					throw new Error('Unsupported shader language.');
			}
		case Platform.Emscripten:
			switch (Options.graphicsApi) {
				case GraphicsApi.WebGPU:
					return 'spirv';
				case GraphicsApi.OpenGL:
				case GraphicsApi.Default:
					return 'essl';
				default:
					throw new Error('Unsupported shader language.');
			}
		case Platform.Pi:
			return 'essl';
		case Platform.FreeBSD:
			switch (Options.graphicsApi) {
				case GraphicsApi.Vulkan:
					return 'spirv';
				case GraphicsApi.OpenGL:
				case GraphicsApi.Default:
					return 'glsl';
				default:
					throw new Error('Unsupported shader language.');
			}
		case Platform.Wasm:
			switch (Options.graphicsApi) {
				case GraphicsApi.WebGPU:
					return 'spirv';
				case GraphicsApi.OpenGL:
				case GraphicsApi.Default:
					return 'essl';
				default:
					throw new Error('Unsupported shader language.');
			}
		default:
			return platform;
	}
}

function graphicsApi(platform: string): string {
	switch (platform) {
		case Platform.Windows:
			switch (Options.graphicsApi) {
				case GraphicsApi.Default:
					return GraphicsApi.Direct3D12;
				default:
					return Options.graphicsApi;
			}
		case Platform.WindowsApp:
			return GraphicsApi.Direct3D11;
		case Platform.iOS:
		case Platform.tvOS:
		case Platform.OSX:
			switch (Options.graphicsApi) {
			case GraphicsApi.Default:
				return GraphicsApi.Metal;
			default:
				return Options.graphicsApi;
			}
		case Platform.Android:
			switch (Options.graphicsApi) {
				case GraphicsApi.Default:
					return GraphicsApi.Vulkan;
				default:
					return Options.graphicsApi;
			}
		case Platform.Linux:
			switch (Options.graphicsApi) {
				case GraphicsApi.Default:
					return GraphicsApi.Vulkan;
				default:
					return Options.graphicsApi;
			}
		case Platform.Emscripten:
			switch (Options.graphicsApi) {
				case GraphicsApi.Default:
					return GraphicsApi.OpenGL;
				default:
					return Options.graphicsApi;
			}
		case Platform.Pi:
			return GraphicsApi.OpenGL;
		case Platform.FreeBSD:
			switch (Options.graphicsApi) {
				case GraphicsApi.Default:
					return GraphicsApi.OpenGL;
				default:
					return Options.graphicsApi;
			}
		case Platform.Wasm:
			switch (Options.graphicsApi) {
				case GraphicsApi.Default:
					return GraphicsApi.OpenGL;
				default:
					return Options.graphicsApi;
			}
		default:
			return Options.graphicsApi;
	}
}

async function compileShader(projectDir: string, type: string, from: string, to: string, temp: string, platform: string, builddir: string, shaderversion: number) {
	return new Promise<void>((resolve, reject) => {
		let compilerPath = '';

		if (Project.koreDir !== '') {
			compilerPath = path.resolve(__dirname, 'krafix' + exec.sys());
		}

		let libsdir = path.join(projectDir, 'Backends');
		if (Project.koreDir && !fs.existsSync(libsdir)) {
			libsdir = path.join(Project.koreDir, '..', 'Backends');
		}
		if (fs.existsSync(libsdir) && fs.statSync(libsdir).isDirectory()) {
			let libdirs = fs.readdirSync(path.join(libsdir));
			for (let ld in libdirs) {
				let libdir = path.join(libsdir, libdirs[ld]);
				if (fs.statSync(libdir).isDirectory()) {
					let exe = path.join(libdir, 'Tools', 'krafix-' + platform + '.exe');
					if (fs.existsSync(exe)) {
						compilerPath = exe;
					}
				}
			}
		}

		if (compilerPath !== '') {
			if (type === 'metal') {
				fs.ensureDirSync(path.join(builddir, 'Sources'));
				let fileinfo = path.parse(from);
				let funcname = fileinfo.name;
				funcname = funcname.replace(/-/g, '_');
				funcname = funcname.replace(/\./g, '_');
				funcname += '_main';

				fs.writeFileSync(to, '>' + funcname, 'utf8');

				to = path.join(builddir, 'Sources', fileinfo.name + '.' + type);
				temp = to + '.temp';
			}

			let krafix_platform = platform;
			if (platform === Platform.Emscripten && Options.graphicsApi === GraphicsApi.WebGPU) {
				krafix_platform += '-webgpu';
			}

			let params = [type, from, to, temp, krafix_platform];
			if (debug) params.push('--debug');
			if (shaderversion) {
				params.push('--version');
				params.push(shaderversion.toString());
			}
			if (Options.outputIntermediateSpirv) {
				params.push('--outputintermediatespirv');
			}

			let compiler = child_process.spawn(compilerPath, params);

			compiler.stdout.on('data', (data: any) => {
				log.info(data.toString());
			});

			let errorLine = '';
			let newErrorLine = true;
			let errorData = false;

			function parseData(data: string) {

			}

			compiler.stderr.on('data', (data: any) => {
				let str: string = data.toString();
				for (let char of str) {
					if (char === '\n') {
						if (errorData) {
							parseData(errorLine.trim());
						}
						else {
							log.error(errorLine.trim());
						}
						errorLine = '';
						newErrorLine = true;
						errorData = false;
					}
					else if (newErrorLine && char === '#') {
						errorData = true;
						newErrorLine = false;
					}
					else {
						errorLine += char;
						newErrorLine = false;
					}
				}
			});

			compiler.on('close', (code: number) => {
				if (code === 0) {
					resolve();
				}
				else {
					reject(compilerPath + ' ' + params.join(' '));
				}
			});
		}
		else {
			throw 'Could not find shader compiler.';
		}
	});
}

class Invocation {
	projectDir: string;
	type: string;
	from: string;
	to: string;
	temp: string;
	platform: string;
	builddir: string;
	name: string;
	shaderversion: number;
}

function compileShaders(invocations: Invocation[]): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		let runningInstances = 0;
		let nextIndex = 0;

		function grabShader() {
			let invocation = invocations[nextIndex];
			++nextIndex;
			++runningInstances;

			log.info('Compiling shader ' + nextIndex + ' of ' + invocations.length + ' (' + invocation.name + ').');

			let promise = compileShader(invocation.projectDir, invocation.type, invocation.from, invocation.to, invocation.temp, invocation.platform, invocation.builddir, invocation.shaderversion);

			promise.then(() => {
				--runningInstances;
				if (nextIndex < invocations.length) {
					grabShader();
				}
				else {
					if (runningInstances == 0) {
						resolve();
					}
				}
			});

			promise.catch((err) => {
				reject('Compiling shader ' + invocation.name + ' failed. Command was: ' + err);
			});
		}

		if (invocations.length === 0) {
			resolve();
		}
		else {
			for (let i = 0; i < Options.cores && i < invocations.length; ++i) {
				grabShader();
			}
		}
	});
}

function compileKong(project: Project, from: string, to: string, platform: string, dirs: string[]): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		let compilerPath = path.resolve(__dirname, 'kongruent' + exec.sys());

		let libsdir = path.join(from, 'backends');
		if (Project.koreDir && !fs.existsSync(libsdir)) {
			libsdir = path.join(Project.koreDir, '..', 'backends');
		}
		if (fs.existsSync(libsdir) && fs.statSync(libsdir).isDirectory()) {
			let libdirs = fs.readdirSync(path.join(libsdir));
			for (let ld in libdirs) {
				let libdir = path.join(libsdir, libdirs[ld]);
				if (fs.statSync(libdir).isDirectory()) {
					let exe = path.join(libdir, 'tools', 'kongruent-' + platform + '.exe');
					if (fs.existsSync(exe)) {
						compilerPath = exe;
					}
				}
			}
		}

		if (compilerPath !== '') {
			let api = graphicsApi(platform);

			to = path.join(to, 'Kong-' + platform + '-' + api);
			fs.ensureDirSync(to);

			project.addFile(to + '/**', undefined);
			project.addIncludeDir(to);

			let params: string[] = [];
			params.push('-p');
			params.push(platform);
			params.push('-a');
			params.push(api);
			if (debug) {
				params.push('--debug');
			}
			for (const dir of dirs) {
				params.push('-i');
				params.push(path.resolve(from, dir));
			}
			params.push('-o');
			params.push(to);
			let compiler = child_process.spawn(compilerPath, params);

			compiler.stdout.on('data', (data: any) => {
				log.info(data.toString());
			});

			let errorLine = '';
			let newErrorLine = true;
			let errorData = false;

			function parseData(data: string) {

			}

			compiler.stderr.on('data', (data: any) => {
				let str: string = data.toString();
				for (let char of str) {
					if (char === '\n') {
						if (errorData) {
							parseData(errorLine.trim());
						}
						else {
							log.error(errorLine.trim());
						}
						errorLine = '';
						newErrorLine = true;
						errorData = false;
					}
					else if (newErrorLine && char === '#') {
						errorData = true;
						newErrorLine = false;
					}
					else {
						errorLine += char;
						newErrorLine = false;
					}
				}
			});

			compiler.on('error', (err) => {
				reject('Could not run Kong (because ' + err + ') with ' + compilerPath + ' ' + params.join(' '));
			});

			compiler.on('close', (code: number, signal: NodeJS.Signals) => {
				if (code === 0) {
					resolve();
				}
				else {
					if (code === null) {
						reject('Kong signaled ' + signal + ' for ' + compilerPath + ' ' + params.join(' '));
					}
					else {
						reject('Kong returned ' + code + ' for ' + compilerPath + ' ' + params.join(' '));
					}
				}
			});
		}
		else {
			throw 'Could not find Kong.';
		}
	});
}

let consoleCompilePlatform: string = null;

async function exportKoremakeProject(from: string, to: string, platform: string, korefile: string, retro: boolean, veryretro: boolean, options: any): Promise<[Project, Exporter]> {
	log.info('kfile found.');
	if (options.onlyshaders) {
		log.info('Only compiling shaders.');
	}
	else if (options.toLanguage) {
		log.info('Only exporting language wrappers ' + options.toLanguage + '.');
	}
	else {
		log.info('Creating ' + fromPlatform(platform) + ' project files.');
	}

	Project.root = path.resolve(from);
	let project: Project;
	try {
		project = await Project.create(from, to, platform, korefile, retro, veryretro, options.option);
		if (shaderLang(platform) === 'metal') {
			project.addFile(path.join(to, 'Sources', '*'), {});
		}
		project.resolveBackends();
		project.searchFiles(undefined);
		project.internalFlatten();
		if (options.lib) {
			project.addDefine('KORE_NO_MAIN');
			project.isStaticLib = true;
		}
		else if (options.dynlib) {
			project.addDefine('KORE_NO_MAIN');
			project.addDefine('KORE_DYNAMIC_COMPILE');
			project.isDynamicLib = true;
		}
	}
	catch (error) {
		log.error(error);
		throw error;
	}

	fs.ensureDirSync(to);

	let files = project.getFiles();

	if (!options.noshaders && !options.json) {
		if (project.kongDirs.length > 0) {
			await compileKong(project, from, to, platform, project.kongDirs);
		}
		else {
			/*let compilerPath = '';
			if (Project.koreDir !== '') {
				compilerPath = path.resolve(__dirname, 'krafix' + exec.sys());
			}

			const matches = [];
			for (let file of files) {
				if (file.file.endsWith('.glsl')) {
					matches.push({match: file.file, options: null});
				}
			}

			let shaderCompiler = new ShaderCompiler(platform, compilerPath, project.getDebugDir(), options.to,
				options.to builddir, matches);
			try {
				await shaderCompiler.run(false, false);
			}
			catch (err) {
				return Promise.reject(err);
			}*/

			let shaderCount = 0;
			for (let file of files) {
				if (file.file.endsWith('.glsl')) {
					++shaderCount;
				}
			}
			let shaderIndex = 0;
			let invocations: Invocation[] = [];
			for (let file of files) {
				if (file.file.endsWith('.glsl')) {
					let outfile = file.file;
					const index = outfile.lastIndexOf('/');
					if (index > 0) outfile = outfile.substr(index);
					outfile = outfile.substr(0, outfile.length - 5);

					let parsedFile = path.parse(file.file);

					const shader = path.isAbsolute(file.file) ? file.file : path.join(file.projectDir, file.file);

					++shaderIndex;

					invocations.push({
						projectDir: from,
						type: shaderLang(platform),
						from: shader,
						to: path.join(project.getDebugDir(), outfile),
						temp: options.to,
						platform: platform,
						builddir: options.to,
						name: parsedFile.name,
						shaderversion: project.shaderVersion,
					});
					//await compileShader(from, shaderLang(platform), shader, path.join(project.getDebugDir(), outfile), options.to, platform, options.to);
				}
			}

			await compileShaders(invocations);
		}
	}

	if (options.onlyshaders) {
		return [project, null];
	}

	// Run again to find new shader files for Metal
	project.searchFiles(undefined);
	project.internalFlatten();

	let exporter: Exporter = null;
	if (options.vscode) {
		exporter = new VSCodeExporter(options);
	}
	else if (options.json) {
		exporter = new JsonExporter(options);
	}
  else if (options.meson) {
    exporter = new MesonExporter(options);
  }
	else if (platform === Platform.iOS || platform === Platform.OSX || platform === Platform.tvOS) exporter = new XCodeExporter(options);
	else if (platform === Platform.Android) exporter = new AndroidExporter(options);
	else if (platform === Platform.Emscripten) exporter = new EmscriptenExporter(project, options);
	else if (platform === Platform.Wasm) exporter = new WasmExporter(options);
	else if (platform === Platform.Linux || platform === Platform.Pi) exporter = new LinuxExporter(options);
	else if (platform === Platform.FreeBSD) exporter = new FreeBSDExporter(options);
	else if (platform === Platform.Kompjuta) exporter = new KompjutaExporter(options);
	else if (platform === Platform.PS4 || platform === Platform.XboxOne || platform === Platform.Switch || platform === Platform.XboxSeries || platform === Platform.PS5 || platform === Platform.Switch2) {
		let libsdir = path.join(from.toString(), 'backends');
		if (!fs.existsSync(libsdir)) {
			libsdir = path.join(from.toString(), 'Backends');
		}
		if (Project.koreDir && !fs.existsSync(libsdir)) {
			libsdir = path.join(Project.koreDir, '..', 'backends');
		}
		if (Project.koreDir && !fs.existsSync(libsdir)) {
			libsdir = path.join(Project.koreDir, '..', 'Backends');
		}

		if (fs.existsSync(libsdir) && fs.statSync(libsdir).isDirectory()) {
			let libdirs = fs.readdirSync(libsdir);
			for (let libdir of libdirs) {
				if (fs.statSync(path.join(libsdir, libdir)).isDirectory()
				&& (
					libdir.toLowerCase() === platform.toLowerCase()
					|| libdir.toLowerCase() === fromPlatform(platform).toLowerCase()
					|| libdir.toLowerCase() === fromPlatform(platform).replace(/ /g, '').toLowerCase()
					|| (libdir.toLowerCase() === 'xbox' && (platform === Platform.XboxSeries || platform === Platform.XboxOne))
				)) {
					let libfiles = fs.readdirSync(path.join(libsdir, libdir));
					for (let libfile of libfiles) {
						if (libfile.endsWith('Exporter.js')) {
							const codePath = path.resolve(libsdir, libdir, libfile);
							const code = fs.readFileSync(codePath, {encoding: 'utf8'});
							exporter = new Function('require', '__dirname', 'VisualStudioExporter', code)(require, path.resolve(libsdir, libdir), VisualStudioExporter);
							let vsExporter: VisualStudioExporter = exporter as VisualStudioExporter;
							consoleCompilePlatform = vsExporter.getSystems(platform)[0];
							break;
						}
					}
				}
			}
		}
	}
	else exporter = new VisualStudioExporter(options);

	/*let langExporter: Language = null;
	let trees: idl.IDLRootType[][] = [];
	if (options.toLanguage === Languages.Beef) {
		langExporter = new BeefLang();
		for ( let file of project.IDLfiles) {
			let webidl = fs.readFileSync(file).toString();
			trees.push(idl.parse(webidl));
		}
	}
	if (exporter === null && langExporter === null) {
		throw 'No exporter found for platform ' + platform + '.';
	}*/

	if (Project.koreDir) {
		try {
			fs.writeFileSync(path.join(to, 'korepath'), path.relative(from, Project.koreDir), 'utf8');
		}
		catch (err) {
			log.error('Could not write korepath file');
		}
	}

	const hash = project.createHash(options.vscode, options.json, options.debug, platform);
	let oldHash = null;
	try {
		oldHash = fs.readFileSync(path.join(to, 'projecthash'), {encoding: 'utf8'});
	}
	catch (err) {}

	if (hash !== oldHash) {
		log.info('Project changed, writing project files.');
		fs.writeFileSync(path.join(to, 'projecthash'), hash, 'utf8');

		if (exporter !== null) {
			await exporter.exportSolution(project, from, to, platform, options.vrApi, options);
		}
	}
	else {
		log.info('Project did not change.');
	}

	/*if (langExporter !== null) {
		trees.forEach((tree, index) => {
			langExporter.exportWrapper(tree, from, to, options, project.IDLfiles[index]);
		});
	}*/

	return [project, exporter]
}

function isKoremakeProject(directory: string, korefile: string): boolean {
	return fs.existsSync(path.resolve(directory, korefile));
}

async function exportProject(from: string, to: string, platform: string, korefile: string, options: any): Promise<[Project, Exporter]> {
	if (isKoremakeProject(from, korefile)) {
		return exportKoremakeProject(from, to, platform, korefile, false, false, options);
	}
	else if (isKoremakeProject(from, 'kfile.js')) {
		return exportKoremakeProject(from, to, platform, 'kfile.js', false, false, options);
	}
	else if (isKoremakeProject(from, 'kincfile.js')) {
		return exportKoremakeProject(from, to, platform, 'kincfile.js', true, false, options);
	}
	else if (isKoremakeProject(from, 'korefile.js')) {
		return exportKoremakeProject(from, to, platform, 'korefile.js', true, true, options);
	}
	else {
		throw 'kfile not found.';
	}
}

class RunError {
	code: number;

	constructor(code: number) {
		this.code = code;
	}
}

function compileProject(make: child_process.ChildProcess, project: Project, solutionName: string, options: any, dothemath: boolean): Promise<void> {
	const startDate = new Date();
	return new Promise<void>((resolve, reject) => {
		make.stdout.on('data', function (data: any) {
			log.info(data.toString(), false);
		});

		make.stderr.on('data', function (data: any) {
			log.error(data.toString(), false);
		});

		let errored = false;

		make.on('error', (err: any) => {
			errored = true;
			log.error('Could not start the compiler.');
			reject();
		});

		make.on('close', function (code: number) {
			if (errored) {
				return;
			}

			const time = (new Date().getTime() - startDate.getTime()) / 1000;
			const min = Math.floor(time / 60);
			const sec = Math.floor(time - min * 60);
			log.info(`Build time: ${min}m ${sec}s`);
			if (code === 0) {
				let executableName = project.getSafeName();
				if (project.getExecutableName()) {
					executableName = project.getExecutableName();
				}

				if ((options.customTarget && options.customTarget.baseTarget === Platform.Linux) || options.target === Platform.Linux
					|| (options.customTarget && options.customTarget.baseTarget === Platform.Pi) || options.target === Platform.Pi
					|| (options.customTarget && options.customTarget.baseTarget === Platform.FreeBSD) || options.target === Platform.FreeBSD) {
					if (options.lib) {
						fs.copyFileSync(path.resolve(path.join(options.to.toString(), options.buildPath), executableName + '.a'), path.resolve(options.from.toString(), project.getDebugDir(), executableName + '.a'));
					}
					else if (options.dynlib) {
						fs.copyFileSync(path.resolve(path.join(options.to.toString(), options.buildPath), executableName + '.so'), path.resolve(options.from.toString(), project.getDebugDir(), executableName + '.so'));
					}
					else {
						const executablePath = path.resolve(path.join(options.to.toString(), options.buildPath), executableName);
						const targetPath = path.resolve(options.from.toString(), project.getDebugDir(), executableName);

						const stripPath = Options.stripPath ? Options.stripPath : 'strip';

						child_process.spawnSync('objcopy', ['--only-keep-debug', executablePath, executablePath + '.debug']);
						child_process.spawnSync(stripPath, [executablePath]);
						child_process.spawnSync('objcopy', ['--add-gnu-debuglink=' + executableName + '.debug', executablePath]);

						fs.copyFileSync(executablePath, targetPath);
					}
				}
				else if (project.isCmd() && ((options.customTarget && options.customTarget.baseTarget === Platform.OSX) || options.target === Platform.OSX)) {
					const executablePath = path.resolve(path.join(options.to.toString(), 'build', options.debug ? 'Debug' : 'Release'), executableName);

					const stripPath = Options.stripPath ? Options.stripPath : 'strip';

					child_process.spawnSync('dsymutil', [executablePath]);
					child_process.spawnSync(stripPath, ['-u', '-r', executablePath]);
					child_process.spawnSync('codesign', ['--sign', '-', '--timestamp', '--force', executablePath]);
				}
				else if ((options.customTarget && options.customTarget.baseTarget === Platform.Windows) || options.target === Platform.Windows) {
					const extension = (options.lib || options.dynlib) ? (options.lib ? '.lib' : '.dll') : '.exe';
					const from =
					dothemath
					? path.join(options.to.toString(), 'x64', options.debug ? 'Debug' : 'Release', executableName + extension)
					: path.join(options.to.toString(), options.debug ? 'Debug' : 'Release', executableName + extension);
					const dir = path.isAbsolute(project.getDebugDir())
						? project.getDebugDir()
						: path.join(options.from.toString(), project.getDebugDir());
					fs.copyFileSync(from, path.join(dir, executableName + extension));
				}

				if (options.run) {
					if ((options.customTarget && options.customTarget.baseTarget === Platform.OSX) || options.target === Platform.OSX) {
						const spawned = child_process.spawn(path.resolve(options.to.toString(), 'build', (options.debug ? 'Debug' : 'Release'), project.name + '.app', 'Contents', 'MacOS', project.name), {stdio: 'inherit', cwd: path.resolve(options.from.toString(), project.getDebugDir())});
						spawned.on('close', (code: number) => {
							if (code === 0) {
								resolve();
							}
							else {
								reject(new RunError(code));
							}
						});
					}
					else if ((options.customTarget && (options.customTarget.baseTarget === Platform.Linux || options.customTarget.baseTarget === Platform.Windows)) || options.target === Platform.Linux || options.target === Platform.Windows) {
						if (process.platform === 'win32') {
							require('os').runProcess(path.resolve(options.from.toString(), project.getDebugDir(), executableName), path.resolve(options.from.toString(), project.getDebugDir()));
						}
						else {
							const spawned = child_process.spawn(path.resolve(options.from.toString(), project.getDebugDir(), executableName), [], {stdio: 'inherit', cwd: path.resolve(options.from.toString(), project.getDebugDir())});
							spawned.on('close', (code: number) => {
								if (code === 0) {
									resolve();
								}
								else {
									reject(new RunError(code));
								}
							});
						}
					}
					else {
						log.info('--run not yet implemented for this platform');
						reject(new RunError(1));
					}
				}
				else {
					resolve();
				}
			}
			else {
				log.error('Compilation failed.');
				reject(code);
			}
		});
	});
}

export let api = 2;

function findKoreVersion(dir: string): string {
	if (fs.existsSync(path.join(dir, '.git'))) {
		let gitVersion = 'git-error';
		try {
			const output = child_process.spawnSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8', cwd: dir}).output;
			for (const str of output) {
				if (str != null && str.length > 0) {
					gitVersion = str.substr(0, 8);
					break;
				}
			}
		}
		catch (error) {

		}

		let gitStatus = 'git-error';
		try {
			const output = child_process.spawnSync('git', ['status', '--porcelain'], {encoding: 'utf8', cwd: dir}).output;
			gitStatus = '';
			for (const str of output) {
				if (str != null && str.length > 0) {
					gitStatus = str.trim();
					break;
				}
			}
		}
		catch (error) {

		}

		if (gitStatus) {
			return gitVersion + ', ' + gitStatus.replace(/\n/g, ',');
		}
		else {
			return gitVersion;
		}
	}
	else {
		return 'unversioned';
	}
}

function is64bit() {
	return process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
}

function isPlatform(options: any, platform: string) {
	return (options.customTarget && options.customTarget.baseTarget === platform) || options.target === platform;
}

function parseVisualStudioVersion(name: string): number {
	if (name.toLowerCase().startsWith('vs')) {
		name = name.substring(2);
	}

	return parseInt(name);
}

export async function run(options: any, loglog: any): Promise<string> {
	log.set(loglog);

	if (options.graphics !== undefined) {
		Options.graphicsApi = options.graphics;
	}

	if (options.arch !== undefined) {
		Options.architecture = options.arch;
	}

	if (options.audio !== undefined) {
		Options.audioApi = options.audio;
	}

	if (options.vr !== undefined) {
		Options.vrApi = options.vr;
	}

	if (options.compiler !== undefined) {
		Options.compiler = options.compiler;
	}

	if (options.cc) {
		Options.ccPath = options.cc;
		Options.compiler = Compiler.Custom;
	}

	if (options.cxx) {
		Options.cxxPath = options.cxx;
		Options.compiler = Compiler.Custom;
	}

	if (options.strip) {
		Options.stripPath = options.strip;
	}

	if (options.ar) {
		Options.arPath = options.ar;
		Options.compiler = Compiler.Custom;
	}

	if (Options.compiler === Compiler.Custom) {
		let error = false;
		if (Options.ccPath === '') {
			log.error('Missing C compiler path');
			error = true;
		}
		if (Options.cxxPath === '') {
			log.error('Missing C++ compiler path');
			error = true;
		}
		if ((options.lib || options.dynlib) && Options.arPath === '') {
			log.error('Missing ar path');
			error = true;
		}
		if (error) {
			throw 'Missing compiler path(s)';
		}
	}

	if (options.visualstudio !== undefined) {
		Options.visualStudioVersion = parseVisualStudioVersion(options.visualstudio);
	}

	if (options.cores !== undefined) {
		Options.cores = parseInt(options.cores);
	}
	else {
		Options.cores = require('os').properCpuCount();
	}

	if (options.nosymlinks) {
		Options.followSymbolicLinks = false;
	}

	if (options.outputintermediatespirv) {
		Options.outputIntermediateSpirv = true;
	}

	Options.debug = options.debug;

	if (!options.kore) {
		let p = path.join(__dirname, '..', '..');
		if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
			options.kore = p;
		}
	}
	else {
		options.kore = path.resolve(options.kore);
	}

	Project.koreDir = options.kore;

	options.from = path.resolve(options.from);
	options.to = path.resolve(options.to);

	log.info('Using Kore (' + findKoreVersion(options.kore) + ') from ' + options.kore);

	if ((options.customTarget && options.customTarget.baseTarget === Platform.Wasm) || options.target === Platform.Wasm) {
		log.info('Please not that the Wasm-target is still in early development. Please use the Emscripten-target in the meantime - the Wasm-target will eventually be a more elegant but harder to use alternative.');
	}

	debug = options.debug;

	if (options.vr !== undefined) {
		Options.vrApi = options.vr;
	}
	options.buildPath = options.debug ? 'debug' : 'release';

	let project: Project = null;
	let exporter: Exporter = null;
	try {
		const value = await exportProject(options.from, options.to, options.target, options.kfile, options);
		project = value[0];
		exporter = value[1];
	}
	catch (error) {
		throw error;
	}

	let solutionName = project.getSafeName();
	if (options.onlyshaders) {
		return solutionName;
	}

	if (options.compile && solutionName !== '') {
		log.info('Compiling...');

		const dothemath = is64bit();
		let make: child_process.ChildProcess = null;

		if (isPlatform(options, Platform.Linux) || isPlatform(options, Platform.Wasm) || isPlatform(options, Platform.Pi) || isPlatform(options, Platform.Emscripten) || isPlatform(options, Platform.Kompjuta)) {
			make = child_process.spawn('ninja', [], { cwd: path.join(options.to, options.buildPath) });
		}
		else if (isPlatform(options, Platform.FreeBSD)) {
			make = child_process.spawn('make', [], { cwd: path.join(options.to, options.buildPath) });
		}
		else if (isPlatform(options, Platform.OSX) || isPlatform(options, Platform.iOS) || isPlatform(options, Platform.tvOS)) {
			let xcodeOptions = ['-configuration', options.debug ? 'Debug' : 'Release', '-project', solutionName + '.xcodeproj', '-quiet'];

			if (isPlatform(options, Platform.iOS)) {
				xcodeOptions.push('-sdk');
				xcodeOptions.push('iphoneos');
			}
			else if (isPlatform(options, Platform.tvOS)) {
				xcodeOptions.push('-sdk');
				xcodeOptions.push('appletvos');
			}

			if (options.nosigning) {
				xcodeOptions.push('CODE_SIGN_IDENTITY=""');
				xcodeOptions.push('CODE_SIGNING_REQUIRED=NO');
				xcodeOptions.push('CODE_SIGNING_ALLOWED=NO');
			}

			if (Options.architecture === Architecture.arm || Options.architecture === Architecture.arm64) {
				xcodeOptions.push('-arch');
				xcodeOptions.push('arm64');
			}
			else if (Options.architecture === Architecture.x86 || Options.architecture === Architecture.x64) {
				xcodeOptions.push('-arch');
				xcodeOptions.push('x86_64');
			}

			make = child_process.spawn('xcodebuild', xcodeOptions, { cwd: options.to });
		}
		else if (isPlatform(options, Platform.Windows)
			|| isPlatform(options, Platform.WindowsApp)
			|| isPlatform(options, Platform.Switch)
			|| isPlatform(options, Platform.PS4)
			|| isPlatform(options, Platform.PS5)
			|| isPlatform(options, Platform.XboxOne)
			|| isPlatform(options, Platform.XboxSeries)
			|| isPlatform(options, Platform.Switch2)
			) {
			let vsvars: string = null;
			const bits = dothemath ? '64' : '32';
			const vswhere = path.join(process.env['ProgramFiles(x86)'], 'Microsoft Visual Studio', 'Installer', 'vswhere.exe');
			switch (options.visualstudio) {
				case VisualStudioVersion.VS2010:
					if (process.env.VS100COMNTOOLS) {
						vsvars = process.env.VS100COMNTOOLS + '\\vsvars' + bits + '.bat';
					}
					break;
				case VisualStudioVersion.VS2012:
					if (process.env.VS110COMNTOOLS) {
						vsvars = process.env.VS110COMNTOOLS + '\\vsvars' + bits + '.bat';
					}
					break;
				case VisualStudioVersion.VS2013:
					if (process.env.VS120COMNTOOLS) {
						vsvars = process.env.VS120COMNTOOLS + '\\vsvars' + bits + '.bat';
					}
					break;
				case VisualStudioVersion.VS2015:
					if (process.env.VS140COMNTOOLS) {
						vsvars = process.env.VS140COMNTOOLS + '\\vsvars' + bits + '.bat';
					}
					break;
				case VisualStudioVersion.VS2017: {
					const varspath = child_process.execFileSync(vswhere, ['-products', '*', '-version', '[15.0,16.0)', '-find', 'VC\\Auxiliary\\Build\\vcvars' + bits + '.bat'], {encoding: 'utf8'}).trim();
					if (fs.existsSync(varspath)) {
						vsvars = varspath;
					}
					break;
				}
				case VisualStudioVersion.VS2019: {
					const varspath = child_process.execFileSync(vswhere, ['-products', '*', '-version', '[16.0,17.0)', '-find', 'VC\\Auxiliary\\Build\\vcvars' + bits + '.bat'], {encoding: 'utf8'}).trim();
					if (fs.existsSync(varspath)) {
						vsvars = varspath;
					}
					break;
				}
				case VisualStudioVersion.VS2022: {
					const varspath = child_process.execFileSync(vswhere, ['-products', '*', '-version', '[17.0,18.0)', '-find', 'VC\\Auxiliary\\Build\\vcvars' + bits + '.bat'], {encoding: 'utf8'}).trim();
					if (fs.existsSync(varspath)) {
						vsvars = varspath;
					}
					break;
				}
				case VisualStudioVersion.VS2026: {
					const varspath = child_process.execFileSync(vswhere, ['-products', '*', '-version', '[18.0,19.0)', '-find', 'VC\\Auxiliary\\Build\\vcvars' + bits + '.bat'], {encoding: 'utf8'}).trim();
					if (fs.existsSync(varspath)) {
						vsvars = varspath;
					}
					break;
				}
				default: {
					const varspath = child_process.execFileSync(vswhere, ['-products', '*', '-latest', '-find', 'VC\\Auxiliary\\Build\\vcvars' + bits + '.bat'], {encoding: 'utf8'}).trim();
					if (fs.existsSync(varspath)) {
						vsvars = varspath;
					}
					break;
				}
			}
			if (vsvars !== null) {
				const signing = ((options.customTarget && options.customTarget.baseTarget === Platform.WindowsApp) || options.target === Platform.WindowsApp) ? '/p:AppxPackageSigningEnabled=false' : '';

				let compilePlatform = dothemath ? 'x64' : 'win32';

				if (consoleCompilePlatform) {
					compilePlatform =  consoleCompilePlatform;
				}

				fs.writeFileSync(path.join(options.to, 'build.bat'), '@call "' + vsvars + '"\n' + '@MSBuild.exe "' + path.resolve(options.to, solutionName + '.vcxproj') + '" /m /clp:ErrorsOnly ' + signing + ' /p:Configuration=' + (options.debug ? 'Debug' : 'Release') + ',Platform=' + compilePlatform);
				make = child_process.spawn('build.bat', [], {cwd: options.to, shell: true});
			}
			else {
				log.error('Visual Studio not found.');
			}
		}
		else if (isPlatform(options, Platform.Android)) {
			let gradlew = (process.platform === 'win32') ? 'gradlew.bat' : 'bash';
			let args = (process.platform === 'win32') ? [] : ['gradlew'];
			args.push('assemble' + (options.debug ? 'Debug' : 'Release'));
			make = child_process.spawn(gradlew, args, { cwd: path.join(options.to, solutionName) });
		}

		if (make !== null) {
			try {
				await compileProject(make, project, solutionName, options, dothemath);
			}
			catch (err) {
				if (typeof(err) === 'number') {
					throw 'Compile error';
				}
				else if (err instanceof RunError) {
					throw 'Run Error (code ' + err.code + ')';
				}
				else {
					if (isPlatform(options, Platform.Linux) || isPlatform(options, Platform.Wasm) || isPlatform(options, Platform.Pi) || isPlatform(options, Platform.Emscripten) || isPlatform(options, Platform.Kompjuta)) {
						log.error('Ninja could not be run, falling back to make.');
						make = child_process.spawn('make', ['-j', Options.cores.toString()], { cwd: path.join(options.to, options.buildPath) });
						try {
							await compileProject(make, project, solutionName, options, dothemath);
						}
						catch (err) {
							if (typeof(err) === 'number') {
								throw 'Compile error (code ' + err + ')';
							}
							else if (err instanceof RunError) {
								throw 'Run Error (code ' + err.code + ')';
							}
							else {
								throw 'Compiler not found';
							}
						}
					}
					else {
						throw 'Compiler not found';
					}
				}
			}
			return solutionName;
		}
		else {
			log.info('--compile not yet implemented for this platform');
			process.exit(1);
		}
	}

	if (options.open) {
		exporter.open(project, options.to);
	}

	return solutionName;
}
