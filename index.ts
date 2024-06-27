#! node

import { program } from "commander";
import packageJson from "./package.json" assert { type: "json" };
import { protectCommand } from "./protect.js";

program
  .name('girt')
  .version(packageJson.version, '-v, --version', 'Output the current version')
  .description(packageJson.description)
  .passThroughOptions()
  .option("-o, --owner <organisation>", "Owner of the repository")
  .option("-r, --repo <string>", "Repository name to modify")
  .option("-p, --path <path>", "Location of repository if reading details from git repo on disk")
  .option("-b, --branch <branch>", "Repository branch to modify")
  .option("-t, --token <token>", "GitHub token")
  .command('girt', { isDefault: true })
  .action(async (option) => {
    console.log(program.description(), option);
    const commandList = program.commands.map((command) => `${command.name()}: ${command.description()}`).join('\n');
    console.log(commandList);
  });

program.addCommand(protectCommand());

await program.parseAsync(process.argv);