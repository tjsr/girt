import * as commander from "commander";

import { RepoBranchInfo, RepoInfo } from "./types.js";

import { Octokit } from "@octokit/rest";
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
      repoOwner = repoInfo.repoOwner;
    }
    if (!repoName) {
      repoName = repoInfo.repoName;
    }
  }
  const info: RepoInfo = { hostname: 'github.com', repoOwner, repoName };
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
  return { hostname, repoOwner: repoUser, repoName };
};

const getRepoInfoFromGitUrl = (url: string): RepoInfo => {
  const urlParts = url.split(/[@:/]/);
  if (urlParts.length != 4) {
    throw new Error(`Invalid URL format ${url}. Expected: git@hostname:/user/repo.git`);
  }
  const hostname = urlParts[1]!;
  const repoUser = urlParts[2]!;
  const repoName = urlParts[3]!.split('.')[0]!;
  return { hostname, repoOwner: repoUser, repoName };
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
  requireOption(repoBranchInfo.repoOwner, 'repo owner');
  requireOption(repoBranchInfo.repoName, 'repo name');
};

const repoBranchString = (repoBranchInfo: RepoBranchInfo): string => {
  return `Protecting @${repoBranchInfo.repoOwner}/${repoBranchInfo.repoName}#${repoBranchInfo.branch}`;
};

export const protectCommand = ():commander.Command => {
  const protect = new commander.Command("protect");

  protect.description("Mark the current branch as protected.")
    .option("-o, --owner <organisation>", "Owner of the repository")
    .option("-r, --repo <string>", "Repository name to modify")
    .option("-p, --path <path>", "Location of repository if reading details from git repo on disk")
    .option("-b, --branch <branch>", "Repository branch to modify")
    .option("-t, --token <token>", "GitHub token")
    .action(async (options, _program) => {
      const repoBranchInfo: RepoBranchInfo = await getRepoBranchInfo(options.owner, options.repo, options.branch, options.path);
      
      const token = options.token || process.env['GITHUB_TOKEN'];
      
      try {
        validateRepoInfo(repoBranchInfo);
        requireOption(token, 'token');
      } catch (err: any) {
        console.error(err.message);
        return;
      }

      const octo: Octokit = new Octokit({ auth: token });
      console.log(repoBranchString(repoBranchInfo));
      try {
        if (repoBranchInfo.repoName === 'test') {
          console.log('Skipping in test mode.');
          return;
        }
        await octo.rest.repos.updateBranchProtection({
          owner: repoBranchInfo.repoOwner,
          repo: repoBranchInfo.repoName,
          branch: repoBranchInfo.branch,
          required_status_checks: null,
          enforce_admins: true,
          required_pull_request_reviews: {
            dismiss_stale_reviews: true,
            require_code_owner_reviews: false,
            required_approving_review_count: 0
          },
          restrictions: null
        });

        await octo.rest.repos.updatePullRequestReviewProtection({
          owner: repoBranchInfo.repoOwner,
          repo: repoBranchInfo.repoName,
          branch: repoBranchInfo.branch,
          dismiss_stale_reviews: true,
          require_code_owner_reviews: false,
          required_approving_review_count: 0,
          restrictions: null
        });
        console.log('Updated branch protection.');
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
