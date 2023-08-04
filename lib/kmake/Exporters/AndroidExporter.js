"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidExporter = void 0;
const Exporter_1 = require("kmake/Exporters/Exporter");
const GraphicsApi_1 = require("kmake/GraphicsApi");
const Project_1 = require("kmake/Project");
const Architecture_1 = require("kmake/Architecture");
const Options_1 = require("kmake/Options");
const Icon = require("kmake/Icon");
const fs = require("kmake/fsextra");
const os = require("os");
const path = require("path");
class AndroidExporter extends Exporter_1.Exporter {
    constructor() {
        super();
    }
    async exportSolution(project, from, to, platform, vrApi, options) {
        this.safeName = project.getSafeName();
        const indir = path.join(__dirname, '..', '..', 'Data', 'android');
        const outdir = path.join(to.toString(), this.safeName);
        fs.ensureDirSync(outdir);
        const targetOptions = {
            package: 'tech.kode.kore',
            installLocation: 'internalOnly',
            versionCode: 1,
            versionName: '1.0',
            compileSdkVersion: 33,
            minSdkVersion: (Options_1.Options.graphicsApi === GraphicsApi_1.GraphicsApi.Vulkan || Options_1.Options.graphicsApi === GraphicsApi_1.GraphicsApi.Default) ? 24 : 21,
            targetSdkVersion: 33,
            screenOrientation: 'sensor',
            permissions: ['android.permission.VIBRATE'],
            disableStickyImmersiveMode: false,
            metadata: new Array(),
            customFilesPath: null,
            buildGradlePath: null,
            globalBuildGradlePath: null,
            proguardRulesPath: null,
            abiFilters: new Array()
        };
        if (project.targetOptions != null && project.targetOptions.android != null) {
            const userOptions = project.targetOptions.android;
            for (let key in userOptions) {
                if (userOptions[key] == null)
                    continue;
                switch (key) {
                    case 'customFilesPath':
                    case 'buildGradlePath':
                    case 'globalBuildGradlePath':
                    case 'proguardRulesPath':
                        // fix path slashes and normalize
                        const p = userOptions[key].split('/').join(path.sep);
                        targetOptions[key] = path.join(from, p);
                        break;
                    default:
                        targetOptions[key] = userOptions[key];
                }
            }
        }
        const binaryData = require('fs').getEmbeddedBinaryData();
        const textData = require('fs').getEmbeddedData();
        fs.writeFileSync(path.join(outdir, '.gitignore'), textData['android_gitignore']);
        if (targetOptions.globalBuildGradlePath) {
            fs.copyFileSync(targetOptions.globalBuildGradlePath, path.join(outdir, 'build.gradle.kts'));
        }
        else {
            fs.writeFileSync(path.join(outdir, 'build.gradle.kts'), textData['android_build_gradle']);
        }
        fs.writeFileSync(path.join(outdir, 'gradle.properties'), textData['android_gradle_properties']);
        fs.writeFileSync(path.join(outdir, 'gradlew'), textData['android_gradlew']);
        if (os.platform() !== 'win32') {
            fs.chmodSync(path.join(outdir, 'gradlew'), 0o755);
        }
        fs.writeFileSync(path.join(outdir, 'gradlew.bat'), textData['android_gradlew_bat']);
        let settings = textData['android_settings_gradle'];
        settings = settings.replace(/{name}/g, project.getName());
        fs.writeFileSync(path.join(outdir, 'settings.gradle.kts'), settings);
        fs.ensureDirSync(path.join(outdir, 'app'));
        fs.writeFileSync(path.join(outdir, 'app', '.gitignore'), textData['android_app_gitignore']);
        if (targetOptions.proguardRulesPath) {
            fs.copyFileSync(targetOptions.proguardRulesPath, path.join(outdir, 'app', 'proguard-rules.pro'));
        }
        else {
            fs.writeFileSync(path.join(outdir, 'app', 'proguard-rules.pro'), textData['android_app_proguard_rules_pro']);
        }
        this.writeAppGradle(project, outdir, from, targetOptions, textData);
        this.writeCMakeLists(project, outdir, from, targetOptions, textData);
        fs.ensureDirSync(path.join(outdir, 'app', 'src'));
        // fs.emptyDirSync(path.join(outdir, 'app', 'src'));
        fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main'));
        this.writeManifest(outdir, targetOptions, textData);
        let strings = textData['android_main_res_values_strings_xml'];
        strings = strings.replace(/{name}/g, project.getName());
        fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main', 'res', 'values'));
        fs.writeFileSync(path.join(outdir, 'app', 'src', 'main', 'res', 'values', 'strings.xml'), strings);
        await this.exportIcons(project.icon, outdir, from, to);
        fs.ensureDirSync(path.join(outdir, 'gradle', 'wrapper'));
        fs.writeFileSync(path.join(outdir, 'gradle', 'wrapper', 'gradle-wrapper.jar'), binaryData['android_gradle_wrapper_gradle_wrapper_jar']);
        fs.writeFileSync(path.join(outdir, 'gradle', 'wrapper', 'gradle-wrapper.properties'), textData['android_gradle_wrapper_gradle_wrapper_properties']);
        fs.ensureDirSync(path.join(outdir, '.idea'));
        fs.writeFileSync(path.join(outdir, '.idea', '.gitignore'), textData['android_idea_gitignore']);
        fs.writeFileSync(path.join(outdir, '.idea', 'gradle.xml'), textData['android_idea_gradle_xml']);
        fs.writeFileSync(path.join(outdir, '.idea', 'misc.xml'), textData['android_idea_misc_xml']);
        let modules = textData['android_idea_modules_xml'];
        modules = modules.replace(/{name}/g, project.getName());
        fs.writeFileSync(path.join(outdir, '.idea', 'modules.xml'), modules);
        fs.writeFileSync(path.join(outdir, '.idea', 'compiler.xml'), textData['android_idea_compiler_xml']);
        fs.writeFileSync(path.join(outdir, '.idea', 'kotlinc.xml'), textData['android_idea_kotlinc_xml']);
        fs.ensureDirSync(path.join(outdir, '.idea', 'modules'));
        fs.writeFileSync(path.join(outdir, '.idea', 'modules', project.getName() + '.app.main.iml'), textData['android_idea_modules_my_application_iml']);
        if (targetOptions.customFilesPath != null) {
            const dir = targetOptions.customFilesPath;
            if (!fs.existsSync(dir))
                throw dir + ' folder does not exist';
            fs.copyDirSync(dir, outdir);
        }
        if (project.getDebugDir().length > 0)
            fs.copyDirSync(path.resolve(from, project.getDebugDir()), path.resolve(to, this.safeName, 'app', 'src', 'main', 'assets'));
        this.exportCompileCommands(project, from, to, platform, vrApi, options);
    }
    writeAppGradle(project, outdir, from, targetOptions, textData) {
        let cflags = '';
        for (let flag of project.cFlags)
            cflags += flag + ' ';
        let cppflags = '';
        for (let flag of project.cppFlags)
            cppflags += flag + ' ';
        let gradle = null;
        if (targetOptions.buildGradlePath) {
            gradle = fs.readFileSync(targetOptions.buildGradlePath, 'utf8');
        }
        else {
            gradle = textData['android_app_build_gradle'];
        }
        gradle = gradle.replace(/{package}/g, targetOptions.package);
        gradle = gradle.replace(/{versionCode}/g, targetOptions.versionCode.toString());
        gradle = gradle.replace(/{versionName}/g, targetOptions.versionName);
        gradle = gradle.replace(/{compileSdkVersion}/g, targetOptions.compileSdkVersion.toString());
        gradle = gradle.replace(/{minSdkVersion}/g, targetOptions.minSdkVersion.toString());
        gradle = gradle.replace(/{targetSdkVersion}/g, targetOptions.targetSdkVersion.toString());
        let arch = '';
        if (targetOptions.abiFilters.length > 0) {
            for (let item of targetOptions.abiFilters) {
                if (arch.length === 0) {
                    arch = '"' + item + '"';
                }
                else {
                    arch = arch + ', "' + item + '"';
                }
            }
            arch = `ndk { abiFilters ${arch} }`;
        }
        else {
            switch (Options_1.Options.architecture) {
                case Architecture_1.Architecture.Default:
                    arch = '';
                    break;
                case Architecture_1.Architecture.Arm7:
                    arch = 'armeabi-v7a';
                    break;
                case Architecture_1.Architecture.Arm8:
                    arch = 'arm64-v8a';
                    break;
                case Architecture_1.Architecture.X86:
                    arch = 'x86';
                    break;
                case Architecture_1.Architecture.X86_64:
                    arch = 'x86_64';
                    break;
                default: throw 'Unknown architecture ' + Options_1.Options.architecture;
            }
            if (Options_1.Options.architecture !== Architecture_1.Architecture.Default) {
                arch = `ndk {abiFilters '${arch}'}`;
            }
        }
        gradle = gradle.replace(/{architecture}/g, arch);
        gradle = gradle.replace(/{cflags}/g, cflags);
        cppflags = '-frtti -fexceptions ' + cppflags;
        if (project.cppStd !== '') {
            cppflags = '-std=' + project.cppStd + ' ' + cppflags;
        }
        gradle = gradle.replace(/{cppflags}/g, cppflags);
        let javasources = '';
        for (let dir of project.getJavaDirs()) {
            javasources += '\'' + path.relative(path.join(outdir, 'app'), path.resolve(from, dir)).replace(/\\/g, '/') + '\', ';
        }
        javasources += '\'' + path.relative(path.join(outdir, 'app'), path.join(Project_1.Project.kincDir.toString(), 'Backends', 'System', 'Android', 'Java-Sources')).replace(/\\/g, '/') + '\'';
        gradle = gradle.replace(/{javasources}/g, javasources);
        fs.writeFileSync(path.join(outdir, 'app', 'build.gradle.kts'), gradle);
    }
    writeCMakeLists(project, outdir, from, targetOptions, textData) {
        let cmake = textData['android_app_cmakelists_txt'];
        let debugDefines = '';
        for (const def of project.getDefines()) {
            if (!def.config || def.config.toLowerCase() === 'debug') {
                debugDefines += ' -D' + def.value;
            }
        }
        cmake = cmake.replace(/{debug_defines}/g, debugDefines);
        let releaseDefines = '';
        for (const def of project.getDefines()) {
            if (!def.config || def.config.toLowerCase() === 'release') {
                releaseDefines += ' -D' + def.value;
            }
        }
        cmake = cmake.replace(/{release_defines}/g, releaseDefines);
        let includes = '';
        for (let inc of project.getIncludeDirs()) {
            includes += '  "' + path.resolve(inc).replace(/\\/g, '/') + '"\n';
        }
        cmake = cmake.replace(/{includes}/g, includes);
        let files = '';
        for (let file of project.getFiles()) {
            if (file.file.endsWith('.c') || file.file.endsWith('.cc')
                || file.file.endsWith('.cpp') || file.file.endsWith('.h')) {
                if (path.isAbsolute(file.file)) {
                    files += '  "' + path.resolve(file.file).replace(/\\/g, '/') + '"\n';
                }
                else {
                    files += '  "' + path.resolve(path.join(from, file.file)).replace(/\\/g, '/') + '"\n';
                }
            }
        }
        cmake = cmake.replace(/{files}/g, files);
        let libraries1 = '';
        let libraries2 = '';
        for (let lib of project.getLibs()) {
            libraries1 += 'find_library(' + lib + '-lib ' + lib + ')\n';
            libraries2 += '  ${' + lib + '-lib}\n';
        }
        cmake = cmake.replace(/{libraries1}/g, libraries1)
            .replace(/{libraries2}/g, libraries2);
        const cmakePath = path.join(outdir, 'app', 'CMakeLists.txt');
        if (this.isCmakeSame(cmakePath, cmake))
            return;
        fs.writeFileSync(cmakePath, cmake);
    }
    isCmakeSame(cmakePath, cmake) {
        // prevent overwriting CMakeLists.txt if it has not changed
        if (!fs.existsSync(cmakePath))
            return false;
        return fs.readFileSync(cmakePath, 'utf8') === cmake;
    }
    writeManifest(outdir, targetOptions, textData) {
        let manifest = textData['android_main_androidmanifest_xml'];
        manifest = manifest.replace(/{package}/g, targetOptions.package);
        manifest = manifest.replace(/{installLocation}/g, targetOptions.installLocation);
        manifest = manifest.replace(/{versionCode}/g, targetOptions.versionCode.toString());
        manifest = manifest.replace(/{versionName}/g, targetOptions.versionName);
        manifest = manifest.replace(/{screenOrientation}/g, targetOptions.screenOrientation);
        manifest = manifest.replace(/{targetSdkVersion}/g, targetOptions.targetSdkVersion);
        manifest = manifest.replace(/{permissions}/g, targetOptions.permissions.map((p) => { return '\n\t<uses-permission android:name="' + p + '"/>'; }).join(''));
        let metadata = targetOptions.disableStickyImmersiveMode ? '\n\t\t<meta-data android:name="disableStickyImmersiveMode" android:value="true"/>' : '';
        for (const meta of targetOptions.metadata) {
            metadata += '\n\t\t' + meta;
        }
        manifest = manifest.replace(/{metadata}/g, metadata);
        fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main'));
        fs.writeFileSync(path.join(outdir, 'app', 'src', 'main', 'AndroidManifest.xml'), manifest);
    }
    async exportIcons(icon, outdir, from, to) {
        const folders = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
        const dpis = [48, 72, 96, 144, 192];
        for (let i = 0; i < dpis.length; ++i) {
            const folder = folders[i];
            const dpi = dpis[i];
            fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main', 'res', folder));
            await Icon.exportPng(icon, path.resolve(to, this.safeName, 'app', 'src', 'main', 'res', folder, 'ic_launcher.png'), dpi, dpi, undefined, from);
            await Icon.exportPng(icon, path.resolve(to, this.safeName, 'app', 'src', 'main', 'res', folder, 'ic_launcher_round.png'), dpi, dpi, undefined, from);
        }
    }
}
exports.AndroidExporter = AndroidExporter;
//# sourceMappingURL=AndroidExporter.js.map