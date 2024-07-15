import * as commander from "commander";

import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { RepoBranchInfo, RepoReferenceCommandOptions, TokenCommandOption } from "../types.js";

import { fileURLToPath } from "node:url";
import { getOctokit } from "../utils/octokit.js";
import { getTokenRequired } from '../utils/getTokenRequired.js';
import path from "node:path";
import { repoString } from "../utils/repoUtils.js";
import { requireRepoInfo } from "../utils/repoBranchCommands.js";

export type DockerCommandOptions = {
  owner?: string|undefined;
  repo?: string|undefined;
  path?: string|undefined;
  json?: boolean;
} & RepoReferenceCommandOptions & TokenCommandOption;

export type DockerImageComandOptions = {
  json?: boolean;
  noUntagged?: boolean;
} & DockerCommandOptions;

interface ContainerImage {
  container: string;
  created: string;
  id: number;
  tags: string[];
  updated: string;
}

// @ts-expect-error ts6133
const _getContainerImagesForUser = async (
  octo: Octokit, owner: string
): Promise<RestEndpointMethodTypes["packages"]["listPackagesForUser"]["response"]["data"]> => {
  return octo.rest.packages.listPackagesForUser({
    package_type: 'container',
    username: owner,
  }).then((response) => response.data);
};

const getContainerImageVersions = async (
  octo: Octokit, owner: string, imageName: string, packageType: 'container'|'docker' = 'container'
): Promise<ContainerImage[]> => {
  return octo.rest.packages.getAllPackageVersionsForPackageOwnedByUser({
    package_name: imageName,
    package_type: packageType,
    username: owner,
  }).then((response) => {
    return response.data.map((container) => {
      const output: ContainerImage = {
        container: container.name,
        created: container.created_at,
        id: container.id,
        tags: container.metadata?.container?.tags ?? [],
        updated: container.updated_at,
      };
      return output;
    });
  });
};

const parseCommonRepoOptions = async (
  command: commander.Command
): Promise<{repoInfo: RepoBranchInfo, octo: Octokit}> => {
  const options: DockerCommandOptions = command.optsWithGlobals();

  const repoInfo: RepoBranchInfo = await requireRepoInfo(options, command);
  const token: string = getTokenRequired(command);
  const octo: Octokit = getOctokit(token);

  return {
    octo,
    repoInfo,
  };
};

export const dockerCommand = ():commander.Command => {
  const docker = new commander.Command("docker");

  const images = new commander.Command("images")
    .description("List all images in the given github package repository")
    .option("-j, --json", "Output as JSON", false)
    .option('--no-untagged', 'Do not list images with no tags')
    .passThroughOptions()
    .action(async (_localOptions: DockerImageComandOptions, command: commander.Command) => {
      const options: DockerImageComandOptions = command.optsWithGlobals();
      const { repoInfo, octo } = await parseCommonRepoOptions(command);

      if (!options.json) {
        const undefStr = options.noUntagged ?? ' with at least 1 tag';
        console.log(
          `Listing all container images for ${repoString(repoInfo)}${undefStr}'}`
        );
      }

      let images: ContainerImage[] = await getContainerImageVersions(octo, repoInfo.owner, repoInfo.repo);
      if (options.noUntagged) {
        images = images.filter((image) => image.tags?.length >= 1);
      }
      if (options.json) {
        console.log(images);
      } else {
        if (images.length === 0) {
          console.log(`No images found in ${repoString(repoInfo)}`);
          return;
        }
        images.forEach((image) => {
          console.log(`${image.container} - ${image.tags.join(', ')}`);
        });
      }
    });

  const orphans = new commander.Command("orphans")
    .description("List all images with no tags")
    .option("-j, --json", "Output as JSON", false)
    .passThroughOptions()
    .action(async (_localOptions: DockerImageComandOptions, command: commander.Command) => {
      const options: DockerImageComandOptions = command.optsWithGlobals();
      const { repoInfo, octo } = await parseCommonRepoOptions(command);

      if (!options.json) {
        console.log(`Listing all orphaned images for ${repoString(repoInfo)}`);
      }
      const images: ContainerImage[] = await getContainerImageVersions(octo, repoInfo.owner, repoInfo.repo);
      const orphans: ContainerImage[] = images.filter((image) => !(image.tags?.length >= 1));
      if (options.json) {
        console.log(orphans);
      } else {
        if (orphans.length === 0) {
          console.log(`No orphaned images found in ${repoString(repoInfo)}`);
          return;
        }
        orphans.forEach((image) => {
          console.log(image.container);
        });
      }
    });
    
  docker
    .description("Manage docker container images")
    .passThroughOptions()
    .enablePositionalOptions()
    .option("-o, --owner <organisation>", "Owner of the repository")
    .option("-r, --repo <string>", "Repository name to modify")
    .option("-p, --path <path>", "Location of repository if reading details from git repo on disk")
    .option("-t, --token <token>", "GitHub token")
    .option("-j, --json", "Output as JSON", false)
    .addCommand(images, { isDefault: true })
    .addCommand(orphans);
  return docker;
};

const isDirectlyExecuted = (argv: string[], url: string): boolean => {
  if (argv === undefined || argv.length < 2) {
    return false;
  }
  const filename = path.basename(fileURLToPath(url));
  const command = process.argv[1] && path.basename(argv[1]!).replace(/\//g, '');
  return command === filename;
};

if (isDirectlyExecuted(process.argv, import.meta.url)) {
  await dockerCommand().parseAsync(process.argv);
}
