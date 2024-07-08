export type RepoInfo = {
  hostname: string;
  owner: string;
  repo: string;
};

export type RepoBranchInfo = {
  branch: string;
} & RepoInfo;
