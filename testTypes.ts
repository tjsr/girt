import { TestContext } from "vitest";

export type BranchProtectionContext = {
  branch: string;
  repoOwner: string;
  repoName: string;
  reviewers: number | undefined;
  enforceAdmins: boolean | undefined;
} & TestContext;

export const basicContext = (context: BranchProtectionContext): void => {
  context.branch = 'main';
  context.repoOwner = 'owner';
  context.repoName = 'repo';
  context.reviewers = 3;
  context.enforceAdmins = false;
};
