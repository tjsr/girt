import * as commander from "commander";

import { RepoBranchInfo } from '../types.ts';
import { getRepoBranchInfo } from './branchParams.ts';

export type RepoCommandOptions = {
  owner?: string|undefined;
  repo?: string|undefined;
  branch?: string|undefined;
  path?: string|undefined;
};

export const requireRepoInfo = async (
  options: RepoCommandOptions, command: commander.Command
): Promise<RepoBranchInfo> => {
  let repoInfo: RepoBranchInfo;
  try {
    repoInfo = await getRepoBranchInfo(options?.owner, options?.repo, options?.branch, options?.path);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    command.error('Failed to get repository information', err);
  }
  return repoInfo;
};
