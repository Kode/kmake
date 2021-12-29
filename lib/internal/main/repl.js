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

    const promise = require('kmake/main').run(parsedOptions, { info: logInfo, error: logError });
    promise.then(() => {
      process.exit();
    })
  });
}
