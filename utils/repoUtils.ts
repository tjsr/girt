import { RepoBranchInfo, RepoInfo } from "../types.js";

import gitRemoteOriginUrl from "git-remote-origin-url";

export const getRepoInfo = async (path?: string): Promise<RepoInfo> => {
  const url = await gitRemoteOriginUrl({ cwd: path });
  return url?.startsWith('https://') ? getRepoInfoFromHttpsUrl(url) : getRepoInfoFromGitUrl(url);
};

const getRepoInfoFromHttpsUrl = (url: string): RepoInfo => {
  const urlParts = url.split(/[:/]/);
  if (urlParts.length != 6) {
    console.warn(urlParts);
    throw new Error(`Invalid https repository URL format ${url}. Expected: git@hostname:/user/repo.git`);
  }
  const hostname = urlParts[3]!;
  const repoUser = urlParts[4]!;
  const repoName = urlParts[5]!.split('.')[0]!;
  return { hostname, owner: repoUser, repo: repoName };
};

const getRepoInfoFromGitUrl = (url: string): RepoInfo => {
  const urlParts = url.split(/[@:/]/);
  if (urlParts.length != 4) {
    throw new Error(`Invalid URL format ${url}. Expected: git@hostname:/user/repo.git`);
  }
  const hostname = urlParts[1]!;
  const repoUser = urlParts[2]!;
  const repoName = urlParts[3]!.split('.')[0]!;
  return { hostname, owner: repoUser, repo: repoName };
};

export const repoBranchString = (repoBranchInfo: RepoBranchInfo): string => {
  return `Protecting @${repoBranchInfo.owner}/${repoBranchInfo.repo}#${repoBranchInfo.branch}`;
};