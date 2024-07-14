import * as commander from "commander";

import { RepoBranchInfo } from "../types.js";
import { getRepoBranchInfo } from "./branchParams.js";

export type RepoCommandOptions = {
  owner?: string|undefined;
  repo?: string|undefined;
  branch?: string|undefined;
  path?: string|undefined;
};

export const requireRepoInfo = async (options: RepoCommandOptions, command: commander.Command): Promise<RepoBranchInfo> => {
  let repoInfo: RepoBranchInfo;
  try {
    repoInfo = await getRepoBranchInfo(options?.owner, options?.repo, options?.branch, options?.path);
  } catch (err: any) {
    command.error('Failed to get repository information', err);
  }
  return repoInfo;
};
