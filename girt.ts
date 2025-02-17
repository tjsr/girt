#! node

import { GirtCommandOptions } from "./types.js";
import { clearConfigstore } from "./utils/configstore.js";
import { dockerCommand } from "./commands/docker.js";
import { getCurrentVersion } from './utils/version.js';
import { getNewestPackageVersion } from "./utils/utils.js";
import { loginCommand } from "./login.js";
import { program } from "commander";
import { protectCommand } from "./protect.js";
import { tokenCommand } from "./token.js";
import { versionCommand } from "./commands/version.js";

const version = await getCurrentVersion();

program
  .version(version, '-v, --version', 'Output the current version')
  .description("Github Repository Tool")
  .usage("[gobal options] <command> [options]")
  .passThroughOptions()
  .enablePositionalOptions()
  .option("-o, --owner <organisation>", "Owner of the repository")
  .option("-r, --repo <string>", "Repository name to modify")
  .option("-p, --path <path>", "Location of repository if reading details from git repo on disk")
  .option("-b, --branch <branch>", "Repository branch to modify")
  .option("-t, --token <token>", "GitHub token")
  .option('--clear-cache', 'Clear the cache of the latest version check')
  .action(async (options: GirtCommandOptions, command) => {
    if (options.clearCache) {
      clearConfigstore();
    }
    console.log(`${program.description()} ${version}`);

    try {
      const latestVersion = await getNewestPackageVersion(version);
      if (latestVersion.isNewVersionAvailable) {
        const isCachedString = latestVersion.cachedCheck ? ' (cached check)' : '';
        console.log(`A new version ${latestVersion.latestVersion} is available ` +
          `(Currently ${version})${isCachedString}.`);
        console.log(`Run 'npm install -g girt' to update.`);
      }
    } catch (error) {
      console.warn('Unable to check for latest version');
      console.error(error);
    }

    const commandList = program.commands.filter(
      (command) => command.name() !== 'girt')
      .map((command) => ` ${command.name()}: ${command.description()}`).join('\n');
    console.log(commandList);
    command.outputHelp();
  });

// program.executableDir('commands');
program.addCommand(protectCommand());
program.addCommand(loginCommand());
program.addCommand(tokenCommand());
program.addCommand(versionCommand());
// program.command('docker', 'Manage docker container images', { executableFile: 'commands/docker.js' });
program.addCommand(dockerCommand());

await program.parseAsync(process.argv);
