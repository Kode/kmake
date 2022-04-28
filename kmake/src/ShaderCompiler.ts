import * as child_process from 'child_process';
import * as fs from 'kmake/fsextra';
import * as os from 'os';
import * as path from 'path';
import {GraphicsApi} from 'kmake/GraphicsApi';
import {Options} from 'kmake/Options';
import {Platform} from 'kmake/Platform';
import {AssetConverter} from 'kmake/AssetConverter';
import * as log from 'kmake/log';

export interface Variable {
	name: string;
	type: string;
}

export class CompiledShader {
	name: string;
	files: string[];
	inputs: Variable[];
	outputs: Variable[];
	uniforms: Variable[];
	types: any[];
	noembed: boolean;

	constructor() {
		this.files = [];
		this.inputs = [];
		this.outputs = [];
		this.uniforms = [];
		this.types = [];
		this.noembed = false;
	}
}

export class ShaderCompiler {
	platform: string;
	compiler: string;
	type: string;
	to: string;
	temp: string;
	builddir: string;
	shaderMatchers: Array<{ match: string, options: any }>;
	watcher: fs.FSWatcher;

	constructor(platform: string, compiler: string, to: string, temp: string, builddir: string, shaderMatchers: Array<{ match: string, options: any }>) {
		if (platform.endsWith('-native')) platform = platform.substr(0, platform.length - '-native'.length);
		if (platform.endsWith('-hl')) platform = platform.substr(0, platform.length - '-hl'.length);
		this.platform = platform;
		this.compiler = compiler;
		this.type = ShaderCompiler.findType(platform);
		this.to = to;
		this.temp = temp;
		this.builddir = builddir;
		this.shaderMatchers = shaderMatchers;
	}

	close(): void {
		if (this.watcher) this.watcher.close();
	}

	static findType(platform: string): string {
		switch (platform) {
		case Platform.Android:
			if (Options.graphicsApi === GraphicsApi.Vulkan) {
				return 'spirv';
			}
			else if (Options.graphicsApi === GraphicsApi.OpenGL || Options.graphicsApi === GraphicsApi.Default) {
				return 'essl';
			}
			else {
				throw new Error('Unsupported shader language.');
			}
		case Platform.HTML5:
		case Platform.Tizen:
		case Platform.Pi:
			return 'essl';
		case Platform.tvOS:
		case Platform.iOS:
			if (Options.graphicsApi === GraphicsApi.Metal || Options.graphicsApi === GraphicsApi.Default) {
				return 'metal';
			}
			else if (Options.graphicsApi === GraphicsApi.OpenGL) {
				return 'essl';
			}
			else {
				throw new Error('Unsupported shader language.');
			}
		case Platform.Windows:
			if (Options.graphicsApi === GraphicsApi.Vulkan) {
				return 'spirv';
			}
			else if (Options.graphicsApi === GraphicsApi.OpenGL) {
				return 'glsl';
			}
			else if (Options.graphicsApi === GraphicsApi.Direct3D11 || Options.graphicsApi === GraphicsApi.Direct3D12 || Options.graphicsApi === GraphicsApi.Default) {
				return 'd3d11';
			}
			else if (Options.graphicsApi === GraphicsApi.Direct3D9) {
				return 'd3d9';
			}
			else {
				throw new Error('Unsupported shader language.');
			}
		case Platform.WindowsApp:
			return 'd3d11';
		case Platform.Linux:
			if (Options.graphicsApi === GraphicsApi.Vulkan) {
				return 'spirv';
			}
			else if (Options.graphicsApi === GraphicsApi.OpenGL || Options.graphicsApi === GraphicsApi.Default) {
				return 'glsl';
			}
			else {
				throw new Error('Unsupported shader language.');
			}
		case Platform.OSX:
			if (Options.graphicsApi === GraphicsApi.Metal || Options.graphicsApi === GraphicsApi.Default) {
				return 'metal';
			}
			else if (Options.graphicsApi === GraphicsApi.OpenGL) {
				return 'glsl';
			}
			else {
				throw new Error('Unsupported shader language.');
			}
		case Platform.FreeBSD:
			return 'glsl';
		default:
			return platform;
		}
	}

	watch(watch: boolean, match: string, options: any, recompileAll: boolean) {
		return new Promise<CompiledShader[]>((resolve, reject) => {
			let shaders: string[] = [];
			let ready = false;
			this.watcher = fs.watch(match); // chokidar.watch(match, { ignored: /[\/\\]\.(git|DS_Store)/, persistent: watch });
			this.watcher.on('add', (filepath: string) => {
				let file = path.parse(filepath);
				if (ready) {
					switch (file.ext) {
						case '.glsl':
							if (!file.name.endsWith('.inc') && this.isSupported(file.name)) {
								log.info('Compiling ' + file.name);
								this.compileShader(filepath, options, recompileAll);
							}
							break;
					}
				}
				else {
					switch (file.ext) {
						case '.glsl':
							if (!file.name.endsWith('.inc')) {
								shaders.push(filepath);
							}
							break;
					}
				}
			});
			if (watch) {
				this.watcher.on('change', (filepath: string) => {
					let file = path.parse(filepath);
					switch (file.ext) {
						case '.glsl':
							if (!file.name.endsWith('.inc') && this.isSupported(file.name)) {
								log.info('Recompiling ' + file.name);
								this.compileShader(filepath, options, recompileAll);
							}
							break;
					}
				});
			}
			this.watcher.on('unlink', (file: string) => {

			});
			this.watcher.on('ready', async () => {
				ready = true;
				let compiledShaders: CompiledShader[] = [];

				const self = this;
				async function compile(shader: any, index: number) {
					let parsed = path.parse(shader);
					if (self.isSupported(shader)) {
						log.info('Compiling shader ' + (index + 1) + ' of ' + shaders.length + ' (' + parsed.base + ').');
						let compiledShader: CompiledShader = null;
						try {
							compiledShader = await self.compileShader(shader, options, recompileAll);
						}
						catch (error) {
							log.error('Compiling shader ' + (index + 1) + ' of ' + shaders.length + ' (' + parsed.base + ') failed:');
							log.error(error);
							return Promise.reject(error);
						}
						if (compiledShader === null) {
							compiledShader = new CompiledShader();
							compiledShader.noembed = options.noembed;
							// mark variables as invalid, so they are loaded from previous compilation
							compiledShader.files = null;
							compiledShader.inputs = null;
							compiledShader.outputs = null;
							compiledShader.uniforms = null;
							compiledShader.types = null;
						}
						if (compiledShader.files != null && compiledShader.files.length === 0) {
							// TODO: Remove when krafix has been recompiled everywhere
							compiledShader.files.push(parsed.name + '.' + self.type);
						}
						compiledShader.name = parsed.name; //AssetConverter.createExportInfo(parsed, false, options, Options.from).name;
						compiledShaders.push(compiledShader);
					}
					else {
						log.info('Skipping shader ' + (index + 1) + ' of ' + shaders.length + ' (' + parsed.base + ').');
					}
					++index;
					return Promise.resolve();
				}

				/*if (Options.parallelAssetConversion !== 0) {
					let todo = shaders.map((shader, index) => {
						return async () => {
							await compile(shader, index);
						};
					});

					let processes = Options.parallelAssetConversion === -1
						? require('os').cpus().length - 1
						: this.options.parallelAssetConversion;

					await Throttle.all(todo, {
						maxInProgress: processes,
					});
				}
				else {*/
					let index = 0;
					for (let shader of shaders) {
						try {
							await compile(shader, index);
						}
						catch (err) {
							reject();
							return;
						}
						index += 1;
					}
				//}

				resolve(compiledShaders);
				return;
			});
		});
	}

	async run(watch: boolean, recompileAll: boolean): Promise<CompiledShader[]> {
		let shaders: CompiledShader[] = [];
		for (let matcher of this.shaderMatchers) {
			shaders = shaders.concat(await this.watch(watch, matcher.match, matcher.options, recompileAll));
		}
		return shaders;
	}

	isSupported(file: string): boolean {
		if (file.endsWith('.frag.glsl') || file.endsWith('.vert.glsl')) {
			return true;
		}
		return this.type !== 'essl' && this.type !== 'agal';
	}

	compileShader(file: string, options: any, recompile: boolean): Promise<CompiledShader> {
		return new Promise<CompiledShader>((resolve, reject) => {
			if (!this.compiler) reject('No shader compiler found.');

			if (this.type === 'none') {
				resolve(new CompiledShader());
				return;
			}

			let fileinfo = path.parse(file);
			let from = file;
			let to = path.join(this.to, fileinfo.name + '.' + this.type);
			let temp = to + '.temp';

			fs.stat(from, (fromErr: NodeJS.ErrnoException, fromStats: fs.Stats) => {
				fs.stat(to, (toErr: NodeJS.ErrnoException, toStats: fs.Stats) => {
					if (options.noprocessing) {
						if (!toStats || toStats.mtime.getTime() < fromStats.mtime.getTime()) {
							fs.copyFileSync(from, to);
						}
						let compiledShader = new CompiledShader();
						compiledShader.noembed = options.noembed;
						resolve(compiledShader);
						return;
					}
					fs.stat(this.compiler, (compErr: NodeJS.ErrnoException, compStats: fs.Stats) => {
						if (!recompile && (fromErr || (!toErr && toStats.mtime.getTime() > fromStats.mtime.getTime() && toStats.mtime.getTime() > compStats.mtime.getTime()))) {
							if (fromErr) log.error('Shader compiler error: ' + fromErr);
							resolve(null);
						}
						else {
							if (this.type === 'metal') {
								fs.ensureDirSync(path.join(this.builddir, 'Sources'));
								let funcname = fileinfo.name;
								funcname = funcname.replace(/-/g, '_');
								funcname = funcname.replace(/\./g, '_');
								funcname += '_main';

								fs.writeFileSync(to, '>' + funcname, 'utf8');

								to = path.join(this.builddir, 'Sources', fileinfo.name + '.' + this.type);
								temp = to;
							}
							let parameters = [this.type === 'hlsl' ? 'd3d9' : this.type, from, temp, this.temp, this.platform];
							//if (Options.shaderversion) {
							//	parameters.push('--version');
							//	parameters.push(Options.shaderversion);
							//}
							//if (Options.glsl2) {
							//	parameters.push('--glsl2');
							//}
							//if (Options.debug) {
							//	parameters.push('--debug');
							//}
							if (options.defines) {
								for (let define of options.defines) {
									parameters.push('-D' + define);
								}
							}
							if (this.platform === Platform.HTML5 || this.platform === Platform.Android) {
								parameters.push('--relax');
							}

							parameters[1] = path.resolve(parameters[1]);
							parameters[2] = path.resolve(parameters[2]);
							parameters[3] = path.resolve(parameters[3]);

							let child = child_process.spawn(this.compiler, parameters);

							let errorLine = '';
							let newErrorLine = true;
							let errorData = false;

							let compiledShader = new CompiledShader();
							compiledShader.noembed = options.noembed;

							function parseData(data: string) {
								data = data.replace(':\\', '#\\'); // Filter out absolute paths on Windows
								let parts = data.split(':');
								if (parts.length >= 3) {
									if (parts[0] === 'uniform') {
										compiledShader.uniforms.push({name: parts[1], type: parts[2]});
									}
									else if (parts[0] === 'input') {
										compiledShader.inputs.push({name: parts[1], type: parts[2]});
									}
									else if (parts[0] === 'output') {
										compiledShader.outputs.push({name: parts[1], type: parts[2]});
									}
									else if (parts[0] === 'type') {
										let type = data.substring(data.indexOf(':') + 1);
										let name = type.substring(0, type.indexOf(':'));
										let typedata = type.substring(type.indexOf(':') + 2);
										typedata = typedata.substr(0, typedata.length - 1);
										let members = typedata.split(',');
										let memberdecls = [];
										for (let member of members) {
											let memberparts = member.split(':');
											memberdecls.push({type: memberparts[1], name: memberparts[0]});
										}
										compiledShader.types.push({name: name, members: memberdecls});
									}
								}
								else if (parts.length >= 2) {
									if (parts[0] === 'file') {
										const parsed = path.parse(parts[1].replace('#\\', ':\\'));
										let name = parsed.name;
										if (parsed.ext !== '.temp') name += parsed.ext;
										compiledShader.files.push(name);
									}
								}
							}

							let stdOutString = '';
							child.stdout.on('data', (data: any) => {
								stdOutString += data.toString();
							});

							child.stderr.on('data', (data: any) => {
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

							child.on('close', (code: number) => {
								if (stdOutString) {
									if (code === 0) {
										log.info(stdOutString);
									}
									else {
										log.error(stdOutString);
									}
								}

								if (errorLine.trim().length > 0) {
									if (errorData) {
										parseData(errorLine.trim());
									}
									else {
										log.error(errorLine.trim());
									}
								}

								if (code === 0) {
									if (this.type !== 'metal') {
										if (compiledShader.files === null || compiledShader.files.length === 0) {
											fs.renameSync(temp, to);
										}
										for (let file of compiledShader.files) {
											fs.renameSync(path.join(this.to, file + '.temp'), path.join(this.to, file));
										}
									}
									resolve(compiledShader);
								}
								else {
									process.exitCode = 1;
									reject('Shader compiler error.');
								}
							});
						}
					});
				});
			});
		});
	}
}
