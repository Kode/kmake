"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompilerCommandsExporter = void 0;
const fs = require("kmake/fsextra");
const path = require("path");
const Platform_1 = require("kmake/Platform");
const log = require("kmake/log");
const os = require("os");
const child_process = require("child_process");
const Exporter_1 = require("./Exporter");
class CompilerCommandsExporter extends Exporter_1.Exporter {
    constructor() {
        super();
    }
    async exportSolution(project, _from, to, platform, vrApi, options) {
        var _a;
        let from = path.resolve(process.cwd(), _from);
        this.writeFile(path.resolve(to, 'compile_commands.json'));
        let includes = [];
        for (let inc of project.getIncludeDirs()) {
            includes.push('-I');
            includes.push(path.resolve(from, inc));
        }
        let defines = [];
        for (let def of project.getDefines()) {
            defines.push('-D');
            defines.push(def.value.replace(/\"/g, '\\"'));
        }
        let objects = {};
        let ofiles = {};
        for (let fileobject of project.getFiles()) {
            let file = fileobject.file;
            if (file.endsWith('.cpp') || file.endsWith('.c') || file.endsWith('.cc') || file.endsWith('.s') || file.endsWith('.S')) {
                let name = file.toLowerCase();
                if (name.indexOf('/') >= 0)
                    name = name.substr(name.lastIndexOf('/') + 1);
                name = name.substr(0, name.lastIndexOf('.'));
                if (!objects[name]) {
                    objects[name] = true;
                    ofiles[file] = name;
                }
                else {
                    while (objects[name]) {
                        name = name + '_';
                    }
                    objects[name] = true;
                    ofiles[file] = name;
                }
            }
        }
        let defaultArgs = [];
        // TODO: same for MacOS, Windows, etc...
        if (platform === Platform_1.Platform.Android) {
            defaultArgs.push('--target=aarch64-none-linux-android21');
            defaultArgs.push('-DANDROID');
            // take a guess at where the ndk could be
            function ndkFromSdkRoot() {
                var _a;
                let sdkEnv = (_a = process.env['ANDROID_HOME']) !== null && _a !== void 0 ? _a : process.env['ANDROID_SDK_ROOT'];
                if (!sdkEnv)
                    return null;
                let ndk_dir = path.join(sdkEnv, 'ndk');
                if (!fs.existsSync(ndk_dir)) {
                    return null;
                }
                let ndks = fs.readdirSync(ndk_dir);
                ndks = ndks.filter(item => !item.startsWith("."));
                if (ndks.length < 1) {
                    return null;
                }
                return path.join(ndk_dir, ndks[0]);
            }
            let android_ndk = (_a = process.env['ANDROID_NDK']) !== null && _a !== void 0 ? _a : ndkFromSdkRoot();
            if (android_ndk) {
                let host_tag = '';
                switch (os.platform()) {
                    // known host tags
                    // TODO: figure out the host tag for aarch64 darwin/linux/windows
                    case 'linux':
                        host_tag = 'linux-x86_64';
                        break;
                    case 'darwin':
                        host_tag = 'darwin-x86_64';
                        break;
                    case 'win32':
                        host_tag = 'windows-x86_64';
                        break;
                }
                let ndk_toolchain = path.join(android_ndk, `toolchains/llvm/prebuilt/${host_tag}`);
                if (host_tag !== '' && fs.existsSync(ndk_toolchain)) {
                    defaultArgs.push(`--gcc-toolchain=${ndk_toolchain}`);
                    defaultArgs.push(`--sysroot=${ndk_toolchain}/sysroot`);
                }
                else {
                    // fallback to the first found toolchain
                    let toolchains = fs.readdirSync(path.join(android_ndk, `toolchains/llvm/prebuilt/`));
                    if (toolchains.length > 0) {
                        let host_tag = toolchains[0];
                        let ndk_toolchain = path.join(android_ndk, `toolchains/llvm/prebuilt/${host_tag}`);
                        defaultArgs.push(`--gcc-toolchain=${ndk_toolchain}`);
                        defaultArgs.push(`--sysroot=${ndk_toolchain}/sysroot`);
                        log.info(`Found android ndk toolchain in ${ndk_toolchain}.`);
                    }
                    else {
                        log.error('Platform is set to Android, but android toolchain not found.');
                    }
                }
            }
            else {
                log.error('Platform is set to Android, but android toolchain not found.\nPlease set the ANDROID_NDK environment variable if you need a compile_commands.json for your IDE.');
            }
        }
        else if (platform === Platform_1.Platform.Emscripten) {
            let emcc = child_process.spawnSync('emcc', ['--cflags']);
            // log.info(emcc.status);
            if (emcc.status === 0) {
                let flags = emcc.output.toString().split(' ');
                defaultArgs.push(...flags);
            }
            else {
                log.error('Platform is set to Emscripten, but emcc could not be found. Please add it to your PATH environment variable if you need a compile_commands.json for your IDE.');
            }
        }
        let commands = [];
        for (let fileobject of project.getFiles()) {
            let file = fileobject.file;
            if (file.endsWith('.c') || file.endsWith('.cpp') || file.endsWith('.cc')) {
                let args = ['/usr/bin/clang', '-c', '-o', (options.debug ? 'Debug' : 'Release') + ofiles[file] + '.o'];
                if (file.endsWith('.c')) {
                    args.push('-std=c99');
                }
                args.push(...defaultArgs);
                args.push(path.resolve(from, file));
                let command = {
                    directory: from,
                    file: path.resolve(from, file),
                    output: path.resolve(to, ofiles[file] + '.o'),
                    arguments: args.concat(includes).concat(defines)
                };
                commands.push(command);
            }
        }
        this.p(JSON.stringify(commands));
        this.closeFile();
    }
}
exports.CompilerCommandsExporter = CompilerCommandsExporter;
//# sourceMappingURL=CompileCommandsExporter.js.map