import * as commander from "commander";

import { GetResponseDataTypeFromEndpointMethod, RequestParameters } from "@octokit/types";
import { RepoBranchInfo, RepoInfo } from "./types.js";

import { Octokit } from "@octokit/rest";
import assert from 'assert';
import { checkSync } from "git-state";
import gitRemoteOriginUrl from 'git-remote-origin-url';

const requireOption = (option: string, optionName: string) => {
  if (!option) {
    throw new Error(`No ${optionName} provided`);
  }
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

const getRepoInfo = async (path?: string): Promise<RepoInfo> => {
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

const getRepoBranchInfo = async (owner: string|undefined, repo: string|undefined, branch: string|undefined, path: string = '.'): Promise<RepoBranchInfo> => {
  const repoInfo: RepoInfo = await getOptionOrLocalRepoInfo(owner, repo, path);

  if (!branch) {
    const currentDirState = checkSync(path);
    branch = currentDirState.branch!;
  }
  const repoBranchInfo: RepoBranchInfo = {
    ...repoInfo,
    branch: branch!
  }
  return Promise.resolve(repoBranchInfo);
};

const validateRepoInfo = (repoBranchInfo: RepoBranchInfo) => {
  requireOption(repoBranchInfo.branch, 'branch');
  requireOption(repoBranchInfo.owner, 'repo owner');
  requireOption(repoBranchInfo.repo, 'repo name');
};

const repoBranchString = (repoBranchInfo: RepoBranchInfo): string => {
  return `Protecting @${repoBranchInfo.owner}/${repoBranchInfo.repo}#${repoBranchInfo.branch}`;
};

const safeInt = (value: string|number|undefined): number|undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'number') {
    return value as number;
  }

  return parseInt(value);
}

export const createReviewProtection = (
  branch: string,
  repoOwner: string,
  repoName: string,
  reviewers: number | undefined
) => {
  assert(branch !== undefined);
  assert(repoOwner !== undefined);
  assert(repoName !== undefined);

  const pullRequestReviewProtection: any = {
    owner: repoOwner,
    repo: repoName,
    branch: branch,
    dismiss_stale_reviews: true,
    require_code_owner_reviews: false,
    restrictions: null
  };
  if (reviewers !== undefined) {
    pullRequestReviewProtection.required_approving_review_count = reviewers;
  }
  return pullRequestReviewProtection;
};

export const createBranchProtectionSettingsPayload = (
  branch: string,
  repoOwner: string,
  repoName: string,
  reviewers: number|undefined,
  enforceAdmins: boolean|undefined
): any => {
  assert(branch !== undefined);
  assert(repoOwner !== undefined);
  assert(repoName !== undefined);
  assert(enforceAdmins !== undefined);

  const pullRequestReviews: any = {
    dismiss_stale_reviews: true,
    require_code_owner_reviews: false,
  };
  if (reviewers !== undefined) {
    pullRequestReviews.required_approving_review_count = reviewers
  }

  const branchProtectionSettings: any = {
    enforce_admins: enforceAdmins,
    owner: repoOwner,
    repo: repoName,
    branch: branch,
    required_status_checks: null,
    required_pull_request_reviews: pullRequestReviews,
    restrictions: null
  };

  return branchProtectionSettings;
};

export const retrieveBranchProtectionSettings = async (octo: Octokit, params?: (RequestParameters & {
  owner: string;
  repo: string;
  branch: string;
}) | undefined): Promise<GetResponseDataTypeFromEndpointMethod<typeof octo.rest.repos.getBranchProtection>> => {
  return octo.rest.repos.getBranchProtection(params);
};

const parameterOrExistingOrDefault = <DataType>(
  param: DataType|undefined, existing: DataType|undefined, defaultValue: DataType|undefined
): DataType|undefined => {
  if (param !== undefined) {
    return param;
  }
  if (existing !== undefined) {
    return existing;
  }
  return defaultValue;
};


export const protectCommand = ():commander.Command => {
  const protect = new commander.Command("protect");

  protect.description("Mark the current branch as protected.")
    .option("-o, --owner <organisation>", "Owner of the repository")
    .option("-r, --repo <string>", "Repository name to modify")
    .option("-p, --path <path>", "Location of repository if reading details from git repo on disk")
    .option("-b, --branch <branch>", "Repository branch to modify")
    .option('-n --reviewers <number>', 'Number of reviewers required for PR approval')
    .option('-e, --enforce-admins', 'Also enforce branch protection rules applying to admins (default: true for new configs)')
    .option("-t, --token <token>", "GitHub token")
    .option('-q, --query', 'Query the current branch protection settings')
    .action(async (options, command: commander.Command) => {
      const repoBranchInfo: RepoBranchInfo = await getRepoBranchInfo(options.owner, options.repo, options.branch, options.path);
      const token = options.token || process.env['GITHUB_TOKEN'];
      
      try {
        requireOption(token, 'token');
      } catch (err: any) {
        command.showHelpAfterError();
        command.error('Token must be provided via GITHUB_TOKEN environment var or command option. ' + err.message, { exitCode: 2, code: 'GIRT.NO_TOKEN' });
        return;
      }

      try {
        validateRepoInfo(repoBranchInfo);
      } catch (err: any) {
        command.showHelpAfterError();
        command.error(err.message);
        return;
      }

      let reviewers: number|undefined = undefined;
      try {
        reviewers = safeInt(options?.reviewers);
      } catch (err) {
        command.showHelpAfterError();
        command.error('Reviewers must be a number');
        return;
      }

      const octo: Octokit = new Octokit({ auth: token });
      const repoString = repoBranchString(repoBranchInfo);
      try {
        if (repoBranchInfo.repo === 'test') {
          console.log('Skipping in test mode.');
          return;
        }

        let currentSettings:GetResponseDataTypeFromEndpointMethod<typeof octo.rest.repos.getBranchProtection>|undefined = undefined;

        try {
          currentSettings = await retrieveBranchProtectionSettings(octo, repoBranchInfo);
          currentSettings = (currentSettings as any).data;
        } catch (err: any) {
          if (err.status === 404) {
            console.log(`Branch for repo ${repoString} is not currently protected.`);
          } else {
            console.debug('Error in retrieveBranchProtectionSettings', err);
            command.error(`Failed to retrieve branch protection settings: ${err.message}`);
            return;
          }
        }

        if (!options?.query) {
          console.log(repoString);
        } else if (options?.query) {
          console.log('Current branch protection settings:');
          console.log(currentSettings);
          return;
        }

        const reviewersValue = parameterOrExistingOrDefault(
          reviewers,
          currentSettings?.enabled ? currentSettings?.required_pull_request_reviews?.required_approving_review_count : undefined,
          0
        );
        const enforceAdmins = parameterOrExistingOrDefault(
          options?.enforceAdmins, currentSettings?.enabled && currentSettings?.enforce_admins?.enabled,
          true
        );

        const branchProtectionSettings = createBranchProtectionSettingsPayload( 
          repoBranchInfo.branch,
          repoBranchInfo.owner,
          repoBranchInfo.repo,
          reviewersValue,
          enforceAdmins);
        await octo.rest.repos.updateBranchProtection(branchProtectionSettings);

        const pullRequestReviewProtection = createReviewProtection(
          repoBranchInfo.branch,
          repoBranchInfo.owner,
          repoBranchInfo.repo,
          reviewersValue
        );
        await octo.rest.repos.updatePullRequestReviewProtection(pullRequestReviewProtection);

        console.log(`Updated branch protection on ${repoString}`);
      } catch (err: any) {
        if (err.status === 401 && err.message) {
          console.error(err.message);
          return;
        } else {
          console.error('Failed to protect branch', err);
        }
      }
    });
  return protect;
};
