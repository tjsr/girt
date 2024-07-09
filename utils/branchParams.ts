import { RepoBranchInfo, RepoInfo } from '../types.js';

import { checkSync } from 'git-state';
import { getRepoInfo } from './repoUtils.js';

export const getRepoBranchInfo = async (
  owner: string|undefined,
  repo: string|undefined,
  branch: string|undefined,
  path: string = '.'
): Promise<RepoBranchInfo> => {
  const repoInfo: RepoInfo = await getOptionOrLocalRepoInfo(owner, repo, path);

  if (!branch) {
    const currentDirState = checkSync(path);
    branch = currentDirState.branch!;
  }
  const repoBranchInfo: RepoBranchInfo = {
    ...repoInfo,
    branch: branch!,
  };
  return Promise.resolve(repoBranchInfo);
};

const getOptionOrLocalRepoInfo = async (
  repoOwner: string|undefined,
  repoName: string|undefined,
  repoPathOnDisk: string = '.'
): Promise<RepoInfo> => {
  if (!repoOwner || !repoName) {
    const repoInfo = await getRepoInfo(repoPathOnDisk);
    if (!repoOwner) {
      repoOwner = repoInfo.owner;
    }
    if (!repoName) {
      repoName = repoInfo.repo;
    }
  }
  const info: RepoInfo = { hostname: 'github.com', owner: repoOwner, repo: repoName };
  return Promise.resolve(info);
};
