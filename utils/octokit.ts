import { Octokit } from "@octokit/rest";

let OCTOKIT_SINGLETON: Octokit|undefined = undefined;

export const getOctokit = (token: string|undefined): Octokit => {
  if (OCTOKIT_SINGLETON === undefined) {
    OCTOKIT_SINGLETON = new Octokit({ auth: token });
  }
  return OCTOKIT_SINGLETON;
};
