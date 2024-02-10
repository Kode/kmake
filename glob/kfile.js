let project = new Project('glob');

project.kore = false;

project.setCmd();

project.addFile('src/**');

resolve(project);
