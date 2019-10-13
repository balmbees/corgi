#!/usr/bin/env node
const program = require('commander');
const { execSync }  = require("child_process");
const fs = require("fs");

program
  .command('build <entitiesFolder>')
  .action((entitiesFolder) => {
    const schemaPath = `${entitiesFolder}definitions.json`;
    if (fs.existsSync(schemaPath)) {
      fs.unlinkSync(schemaPath);
    }

    const json = execSync(`$(npm bin)/ts-json-schema-generator --path '${entitiesFolder}*.ts'`).toString();
    fs.writeFileSync(schemaPath, JSON.stringify(
      JSON.parse(json.replace(/#\/definitions\//g, "#/components/schemas/")).definitions,
      null,
      2
    ));
    console.log(`${schemaPath} written successfully`);
  });

program.parse(process.argv);
