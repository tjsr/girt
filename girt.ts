#! node

import { findPackageJson, getVersionFromPackageJson } from "@tjsr/package-json-utils";

import { loginCommand } from "./login.js";
import { program } from "commander";
import { protectCommand } from "./protect.js";
import { tokenCommand } from "./token.js";

const packageJsonPath = findPackageJson(import.meta.dirname);
const version = await getVersionFromPackageJson(packageJsonPath);

program
  .version(version, '-v, --version', 'Output the current version')
  .description("Github Repository Tool")
  .usage("[gobal options] <command> [options]")
  .passThroughOptions()
  .option("-o, --owner <organisation>", "Owner of the repository")
  .option("-r, --repo <string>", "Repository name to modify")
  .option("-p, --path <path>", "Location of repository if reading details from git repo on disk")
  .option("-b, --branch <branch>", "Repository branch to modify")
  .option("-t, --token <token>", "GitHub token")
  .action(async (_option, command) => {
    console.log(program.description());
    const commandList = program.commands.filter((command) => command.name() !== 'girt').map((command) => ` ${command.name()}: ${command.description()}`).join('\n');
    console.log(commandList);
    command.outputHelp();
  });

 program.addCommand(protectCommand());
 program.addCommand(loginCommand());
 program.addCommand(tokenCommand());

await program.parseAsync(process.argv);
