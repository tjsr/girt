import * as commander from "commander";

import { RepoBranchInfo } from "../types.js";
import { getRepoBranchInfo } from '../utils/branchParams.js';
import { getVersionFromPackageJson } from "@tjsr/package-json-utils";

export const versionCommand = ():commander.Command => {
  const version = new commander.Command("version");
    
  version
    .description("Increment an npm version number for a branch")
    .option("-o, --owner <organisation>", "Owner of the repository")
    .option("-r, --repo <string>", "Repository name to modify")
    .option("-p, --path <path>", "Location of repository if reading details from git repo on disk")
    .option("-b, --branch <branch>", "Repository branch to modify")
    .action(async (options, command: commander.Command) => {
      let packageVersion: string;
      try {
        packageVersion = await getVersionFromPackageJson(options?.path || process.cwd());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        command.error(`package.json not present in current directory ${process.cwd()}: ${err.message}`);
      }

      let repoInfo: RepoBranchInfo;
      try {
        repoInfo = await getRepoBranchInfo(options?.owner, options?.repo, options?.branch, options?.path);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        command.error('Failed to get repository information: ' + err.message);
      }
      console.log(`Version: ${packageVersion!} ${repoInfo!.branch}`);
    });
  return version;
};
