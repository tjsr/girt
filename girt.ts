#! node

import { program } from "commander";
import { protectCommand } from "./protect.js";

program
  .version("0.0.1", '-v, --version', 'Output the current version')
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

await program.parseAsync(process.argv);