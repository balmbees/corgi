#!/usr/bin/env node

import * as BbPromise from "bluebird";
BbPromise.config({ longStackTraces: true });
global.Promise = BbPromise;

import * as program from "commander";
import * as path from "path";
import { createServer } from "./corgi-local";

const pkg = require("../../package.json");

program
  .version(pkg.version)
  .arguments('<handlerPath>')
  .option('-p, --port [port]', 'Port Number', process.env.PORT)
  .parse(process.argv);

const [ handlerPath ] = program.args;

const port = parseInt(program.port, 10);

if (!port) {
  console.error("missing or invalid port number");
  process.exit(1);
}

const handlerAbsolutePath = path.isAbsolute(handlerPath) ? handlerPath : path.resolve(process.cwd(), handlerPath);
const handlerModule = require(handlerAbsolutePath); // tslint:disable-line
const server = createServer(handlerModule.handler);

server.listen(port, () => {
  const { address, port } = server.address();

  console.error(`server listening on ${address}:${port}`);
});
