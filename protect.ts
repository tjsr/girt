import * as commander from "commander";

import { GetResponseDataTypeFromEndpointMethod, RequestParameters } from "@octokit/types";
import { parameterOrExistingOrDefault, safeInt } from './utils/utils.js';
import { requireOption, validateRepoInfo } from './utils/options.js';

import { Octokit } from "@octokit/rest";
import { RepoBranchInfo } from "./types.js";
import assert from 'assert';
import { getRepoBranchInfo } from './utils/branchParams.js';
import { repoBranchString } from './utils/repoUtils.js';

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
    branch: branch,
    dismiss_stale_reviews: true,
    owner: repoOwner,
    repo: repoName,
    require_code_owner_reviews: false,
    restrictions: null,
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
  if (enforceAdmins === undefined) {
    enforceAdmins = true;
  }

  const pullRequestReviews: any = {
    dismiss_stale_reviews: true,
    require_code_owner_reviews: false,
  };
  if (reviewers !== undefined) {
    pullRequestReviews.required_approving_review_count = reviewers;
  }

  const branchProtectionSettings: any = {
    branch: branch,
    enforce_admins: enforceAdmins,
    owner: repoOwner,
    repo: repoName,
    required_pull_request_reviews: pullRequestReviews,
    required_status_checks: null,
    restrictions: null,
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

export const protectCommand = ():commander.Command => {
  const protect = new commander.Command("protect");

  protect.description("Mark the current branch as protected.")
    .option("-o, --owner <organisation>", "Owner of the repository")
    .option("-r, --repo <string>", "Repository name to modify")
    .option("-p, --path <path>", "Location of repository if reading details from git repo on disk")
    .option("-b, --branch <branch>", "Repository branch to modify")
    .option('-n --reviewers <number>', 'Number of reviewers required for PR approval')
    .option('-e, --enforce-admins',
      'Also enforce branch protection rules applying to admins (default: true for new configs)')
    .option("-t, --token <token>", "GitHub token")
    .option('-q, --query', 'Query the current branch protection settings')
    .action(async (options, command: commander.Command) => {
      const repoBranchInfo: RepoBranchInfo = await getRepoBranchInfo(
        options.owner, options.repo, options.branch, options.path
      );
      const token = options.token || process.env['GITHUB_TOKEN'];
      
      try {
        requireOption(token, 'token');
      } catch (err: any) {
        command.showHelpAfterError();
        command.error('Token must be provided via GITHUB_TOKEN environment var or command option. ' +
          err.message, { code: 'GIRT.NO_TOKEN', exitCode: 2 });
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

        let currentSettings:GetResponseDataTypeFromEndpointMethod<
          typeof octo.rest.repos.getBranchProtection>|undefined = undefined;

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
          currentSettings?.enabled
            ? currentSettings?.required_pull_request_reviews?.required_approving_review_count
            : undefined,
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
