export type RepoInfo = {
  hostname: string;
  owner: string;
  repo: string;
};

export type RepoBranchInfo = {
  branch: string;
} & RepoInfo;

export type TokenCommandOption = {
  token?: string|undefined;
}

export type RepoReferenceCommandOptions = {
  owner?: string|undefined;
  repo?: string|undefined;
  branch?: string|undefined;
  path?: string|undefined;
}

export type GirtCommandOptions = {
} & RepoReferenceCommandOptions & TokenCommandOption;
