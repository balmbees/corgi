#!/usr/bin/env node

import * as BbPromise from "bluebird";
BbPromise.config({ longStackTraces: true });
global.Promise = BbPromise;

import * as debug from "debug";
import * as program from "commander";
import * as path from "path";
import { createServer } from "./corgi-local";

const pkg = require("../../package.json");

program
  .version(pkg.version)
  .arguments('<handlerPath>')
  .option('-s, --silent', 'disable verbose log output')
  .option('-t, --timeout <n>', 'handler timeout duration (default: 20000ms)', (v) => parseInt(v, 10), 20000)
  .option('-p, --port <n>', 'port number (default: process.env.PORT)', (v) => parseInt(v, 10), parseInt(process.env.PORT, 10))
  .parse(process.argv);

const [ handlerPath ] = program.args;
const { silent, timeout, port } = program;
const verbose = !silent;

if (!handlerPath) {
  console.error("handlerPath is required");
  program.help();
}

if (!port) {
  console.error("missing or invalid port number");
  program.help();
}

if (!timeout) {
  console.error("invalid timeout duration");
  program.help();
}


const LOG_TAG = "corgi-local-cli";
const log = debug(LOG_TAG);

if (verbose) {
  log.enabled = true;
}


const handlerAbsolutePath = path.isAbsolute(handlerPath) ? handlerPath : path.resolve(process.cwd(), handlerPath);
let handlerModule;
try {
  handlerModule = require(handlerAbsolutePath); // tslint:disable-line
} catch (e) {
  console.error(e.message);
  log(e.stack);
  program.help();
}

const server = createServer(handlerModule.handler, {
  verbose,
  timeout,
});

server.listen(port, () => {
  const { address, port } = server.address();

  log(`server listening on ${address}:${port}`);
});
