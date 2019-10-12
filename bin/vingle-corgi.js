#!/usr/bin/env node
'use strict';
const meow = require("meow");
const exec = require("exec");

const cli = meow(`
	Usage
    $ build-openapi-entities

	Options
    --entitiesFolder, -e , "./src/api/entities/"

	Examples
	  $ foo unicorns --rainbow
	  🌈 unicorns 🌈
`, {
	flags: {
		entitiesFolder: {
			type: 'string',
			alias: 'e'
		}
	}
});

const {
  entitiesFolder
} = cli.flags;

exec(`ts-json-schema-generator --path '${entitiesFolder}*.ts' > '${entitiesFolder}schema.json'`)
