import { Project } from 'kmake/Project';
import * as fs from 'kmake/fsextra';
import * as path from 'path';
import { Exporter } from 'kmake/Exporters/Exporter';
import { CMakeExporter } from 'kmake/Exporters/CMakeExporter';

export class CLionExporter extends Exporter {
	cmake: CMakeExporter;

	constructor(options: any) {
		super(options);
		this.cmake = new CMakeExporter(options);
	}

	async exportSolution(project: Project, from: string, to: string, platform: string, vrApi: any, options: any): Promise<void> {
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
