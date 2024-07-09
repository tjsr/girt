import { BranchProtectionContext } from "./testTypes.js";
import { Octokit } from "@octokit/rest";
import { retrieveBranchProtectionSettings } from "./protect.js";

const hasGithubToken = process.env['GITHUB_TOKEN'] !== undefined;

type OctokitBranchProtectionContext = BranchProtectionContext & {
  githubToken: string;
  octokit: Octokit;
};

const octoContext = (context: OctokitBranchProtectionContext): void => {
  context.branch = 'main';
  context.repoOwner = 'owner';
  context.repoName = 'repo';
  context.reviewers = 3;
  context.enforceAdmins = false;
  context.githubToken = process.env['GITHUB_TOKEN'] as string;
};

describe('retrieveBranchProtectionSettings', () => {
  beforeEach((context: OctokitBranchProtectionContext) => {
    octoContext(context);
    context.octokit = new Octokit({
      auth: context.githubToken,
    });
  });

  test.runIf(hasGithubToken)('Should return the branch protection settings for the specified branch',
    async (context: OctokitBranchProtectionContext) => {
      await expect(retrieveBranchProtectionSettings(context.octokit, {
        branch: context.branch,
        owner: context.repoOwner,
        repo: context.repoName,
      })).resolves.toHaveProperty('data');
    });
});
