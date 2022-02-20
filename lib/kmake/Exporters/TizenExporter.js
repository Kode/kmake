"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TizenExporter = void 0;
const Exporter_1 = require("kmake/Exporters/Exporter");
const fs = require("kmake/fsextra");
const path = require("path");
class TizenExporter extends Exporter_1.Exporter {
    constructor() {
        super();
    }
    async exportSolution(project, from, to, platform, vrApi, options) {
        if (project.getDebugDir() !== '')
            fs.copyFileSync(path.resolve(from, project.getDebugDir()), path.resolve(to, 'data'));
        let dotcproject = fs.readFileSync(path.resolve(__dirname, 'Data', 'tizen', '.cproject'), 'utf8');
        dotcproject = dotcproject.replace(/{ProjectName}/g, project.getName());
        let includes = '';
        for (let include of project.getIncludeDirs()) {
            includes += '<listOptionValue builtIn="false" value="&quot;${workspace_loc:/${ProjName}/CopiedSources/' + include + '}&quot;"/>';
        }
        dotcproject = dotcproject.replace(/{includes}/g, includes);
        let defines = '';
        for (const define of project.getDefines()) {
            defines += '<listOptionValue builtIn="false" value="' + define.value + '"/>';
        }
        dotcproject = dotcproject.replace(/{defines}/g, defines);
        fs.writeFileSync(path.resolve(to, '.cproject'), dotcproject);
        let dotproject = fs.readFileSync(path.resolve(__dirname, 'Data', 'tizen', '.project'), 'utf8');
        dotproject = dotproject.replace(/{ProjectName}/g, project.getName());
        fs.writeFileSync(path.resolve(to, '.project'), dotproject);
        let manifest = fs.readFileSync(path.resolve(__dirname, 'Data', 'tizen', 'manifest.xml'), 'utf8');
        manifest = manifest.replace(/{ProjectName}/g, project.getName());
        fs.writeFileSync(path.resolve(to, 'manifest.xml'), manifest);
        for (let file of project.getFiles()) {
            let target = path.resolve(to, 'CopiedSources', file.file);
            fs.ensureDirSync(path.join(target.substr(0, target.lastIndexOf('/'))));
            fs.copyFileSync(path.resolve(from, file.file), target);
        }
        this.exportCompileCommands(project, from, to, platform, vrApi, options);
    }
}
exports.TizenExporter = TizenExporter;
//# sourceMappingURL=TizenExporter.js.map