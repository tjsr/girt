export type RepoInfo = {
  hostname: string;
  repoOwner: string;
  repoName: string;
};

export type RepoBranchInfo = {
  branch: string;
} & RepoInfo;
