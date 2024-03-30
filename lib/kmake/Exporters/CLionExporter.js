"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLionExporter = void 0;
const fs = require("kmake/fsextra");
const path = require("path");
const Exporter_1 = require("kmake/Exporters/Exporter");
const CMakeExporter_1 = require("kmake/Exporters/CMakeExporter");
class CLionExporter extends Exporter_1.Exporter {
    constructor(options) {
        super(options);
        this.cmake = new CMakeExporter_1.CMakeExporter(options);
    }
    async exportSolution(project, from, to, platform, vrApi, options) {
        let name = project.getSafeName();
        const indir = path.join(__dirname, '..', '..', 'Data', 'linux');
        fs.ensureDirSync(path.resolve(to, name, '.idea'));
        let misc = require('fs').getEmbeddedData()['linux_idea_misc_xml'];
        misc = misc.replace(/{root}/g, path.resolve(from));
        fs.writeFileSync(path.join(to, name, '.idea', 'misc.xml'), misc, 'utf8');
        let workspace = require('fs').getEmbeddedData()['linux_idea_workspace_xml'];
        workspace = workspace.replace(/{workingdir}/g, path.resolve(project.getDebugDir()));
        workspace = workspace.replace(/{project}/g, name);
        workspace = workspace.replace(/{target}/g, name);
        fs.writeFileSync(path.join(to, name, '.idea', 'workspace.xml'), workspace, 'utf8');
        this.cmake.exportSolution(project, from, to, platform, vrApi, options);
    }
}
exports.CLionExporter = CLionExporter;
//# sourceMappingURL=CLionExporter.js.map