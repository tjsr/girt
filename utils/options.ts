import { RepoBranchInfo } from "../types.js";

export const requireOption = (option: string, optionName: string) => {
  if (!option) {
    throw new Error(`No ${optionName} provided`);
  }
};

export const validateRepoInfo = (repoBranchInfo: RepoBranchInfo) => {
  requireOption(repoBranchInfo.branch, 'branch');
  requireOption(repoBranchInfo.owner, 'repo owner');
  requireOption(repoBranchInfo.repo, 'repo name');
};
