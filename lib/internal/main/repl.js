'use strict';

// Create the REPL if `-i` or `--interactive` is passed, or if
// the main module is not specified and stdin is a TTY.

const {
  prepareMainThreadExecution
} = require('internal/bootstrap/pre_execution');

const esmLoader = require('internal/process/esm_loader');
const {
  evalScript
} = require('internal/process/execution');

const console = require('internal/console/global');

const { getOptionValue } = require('internal/options');

prepareMainThreadExecution();

markBootstrapComplete();

if (process.env.NODE_REPL_EXTERNAL_MODULE) {
  require('internal/modules/cjs/loader')
    .Module
    ._load(process.env.NODE_REPL_EXTERNAL_MODULE, undefined, true);
} else {
  // --input-type flag not supported in REPL
  if (getOptionValue('--input-type')) {
    // If we can't write to stderr, we'd like to make this a noop,
    // so use console.error.
    console.error('Cannot specify --input-type for REPL');
    process.exit(1);
  }

  esmLoader.loadESM(() => {
    const os = require('os');

    let defaultTarget = '';
    if (os.platform() === 'linux') {
      defaultTarget = 'linux';
    }
    else if (os.platform() === 'win32') {
      defaultTarget = 'windows';
    }
    else if (os.platform() === 'freebsd') {
      defaultTarget = 'freebsd';
    }
    else {
      defaultTarget = 'osx';
    }

    let options = [
      {
        full: 'from',
        value: true,
        description: 'Location of your project',
        default: '.'
      },
      {
        full: 'to',
        value: true,
        description: 'Build location',
        default: 'build'
      },
      {
        full: 'target',
        short: 't',
        value: true,
        description: 'Target platform',
        default: defaultTarget
      },
      {
        full: 'vr',
        value: true,
        description: 'Target VR device',
        default: 'none'
      },
      {
        full: 'pch',
        description: 'Use precompiled headers for C++ targets',
        value: false
      },
      {
        full: 'intermediate',
        description: 'Intermediate location for object files.',
        value: true,
        default: '',
        hidden: true
      },
      {
        full: 'graphics',
        short: 'g',
        description: 'Graphics api to use',
        value: true,
        default: 'default'
      },
      {
        full: 'arch',
        description: 'Target architecture for compilation',
        value: true,
        default: 'default'
      },
      {
        full: 'audio',
        short: 'a',
        description: 'Audio api to use',
        value: true,
        default: 'default'
      },
      {
        full: 'visualstudio',
        short: 'v',
        description: 'Version of Visual Studio to use',
        value: true,
        default: 'vs2022'
      },
      {
        full: 'compile',
        description: 'Compile executable',
        value: false
      },
      {
        full: 'run',
        description: 'Run executable',
        value: false
      },
      {
        full: 'update',
        description: 'Update Kinc and it\'s submodules',
        value: false
      },
      {
        full: 'debug',
        description: 'Compile in debug mode',
        value: false
      },
      {
        full: 'server',
        description: 'Run local http server for html5 target',
        value: false
      },
      {
        full: 'port',
        description: 'Running port for the server',
        value: true,
        default: 8080
      },
      {
        full: 'noshaders',
        description: 'Do not compile shaders',
        value: false
      },
      {
        full: 'kinc',
        short: 'k',
        description: 'Location of Kinc directory',
        value: true,
        default: ''
      },
      {
        full: 'init',
        description: 'Init a Kinc project inside the current directory',
        value: false
      },
      {
        full: 'name',
        description: 'Project name to use when initializing a project',
        value: true,
        default: 'Project'
      },
      {
        full: 'kfile',
        value: true,
        description: 'Name of your kfile, defaults to "kfile.js"',
        default: 'kfile.js'
      },
      {
        full: 'compiler',
        value: true,
        description: 'Use a specific compiler',
        default: 'default'
      },
      {
        full: 'onlyshaders',
        value: false,
        description: 'Compile only shaders'
      },
      {
        full: 'nosigning',
        value: false,
        description: 'Disable code signing for iOS'
      },
      {
        full: 'lib',
        value: false,
        description: 'Compile to a static library'
      },
      {
        full: 'dynlib',
        value: false,
        description: 'Compile to a dynamic library'
      },
      {
        full: 'vscode',
        value: false,
        description: 'Create a vscode project - this is used automatically by the vscode Kinc extension'
      },
      {
        full: 'toLanguage',
        value: true,
        description: 'Export IDL specified in kincfile to wrapper for specified language'
      }
    ];

    let parsedOptions = {

    };

    function printHelp() {
      console.log('kmake options:\n');
      for (let o in options) {
        let option = options[o];
        if (option.hidden) continue;
        if (option.short) console.log('-' + option.short + ' ' + '--' + option.full);
        else console.log('--' + option.full);
        console.log(option.description);
        console.log();
      }
    }

    for (let o in options) {
      let option = options[o];
      if (option.value) {
        parsedOptions[option.full] = option.default;
      }
      else {
        parsedOptions[option.full] = false;
      }
    }

    /*let args = process.argv;
    for (let i = 2; i < args.length; ++i) {
      let arg = args[i];

      if (arg[0] === '-') {
        if (arg[1] === '-') {
          if (arg.substr(2) === 'help') {
            printHelp();
            process.exit(0);
          }
          let found = false;
          for (let o in options) {
            let option: any = options[o];
            if (arg.substr(2) === option.full) {
              found = true;
              if (option.value) {
                ++i;
                parsedOptions[option.full] = args[i];
              }
              else {
                parsedOptions[option.full] = true;
              }
            }
          }
          if (!found) throw 'Option ' + arg + ' not found.';
        }
        else {
          if (arg[1] === 'h') {
            printHelp();
            process.exit(0);
          }
          if (arg.length !== 2) throw 'Wrong syntax for option ' + arg + ' (maybe try -' + arg + ' instead).';
          let found = false;
          for (let o in options) {
            let option: any = options[o];
            if (option.short && arg[1] === option.short) {
              found = true;
              if (option.value) {
                ++i;
                parsedOptions[option.full] = args[i];
              }
              else {
                parsedOptions[option.full] = true;
              }
            }
          }
          if (!found) throw 'Option ' + arg + ' not found.';
        }
      }
      else {
        parsedOptions.target = arg.toLowerCase();
      }
    }*/

    if (parsedOptions.run) {
      parsedOptions.compile = true;
    }

    const logInfo = (text, newline) => {
      if (newline) {
        console.log(text);
      }
      else {
        process.stdout.write(text);
      }
    };

    const logError = (text, newline) => {
      if (newline) {
        console.error(text);
      }
      else {
        process.stderr.write(text);
      }
    };

    global.__dirname = require('path').dirname(process.execPath);
    const promise = require('kmake/main').run(parsedOptions, { info: logInfo, error: logError });
    promise.then(() => {
      console.log('Done.');
      process.exit();
    });
  });
}
