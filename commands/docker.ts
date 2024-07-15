import * as commander from "commander";

import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { RepoBranchInfo, RepoReferenceCommandOptions, TokenCommandOption } from "../types.js";
import { repoStringFromInfo, repoStringFromParts } from "../utils/repoUtils.js";

import { fileURLToPath } from "node:url";
import { getOctokit } from "../utils/octokit.js";
import { getTokenRequired } from '../utils/getTokenRequired.js';
import path from "node:path";
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
  orphans?: boolean;
} & DockerCommandOptions;

interface ContainerImage {
  container: string;
  created: string;
  id: number;
  tags: string[];
  updated: string;
}

type ContainerOrOphan = 'container'|'orphaned';

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

const containerImageOrErrorOut = async (
  octo: Octokit, command: commander.Command, owner: string, repo: string
): Promise<ContainerImage[]|never> => {
  try {
    const images: ContainerImage[] = await getContainerImageVersions(octo, owner, repo);
    return images;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.status === 404) {
      command.error(`packages are not available for repository ${repoStringFromParts(owner, repo)}`);
    } else if (err.status === 403) {
      command.error(`Permission denied while reading package ${repoStringFromParts(owner, repo)}`);
    } else {
      command.error(`Unknown error while retrieving container image versions ` +
        `for ${repoStringFromParts(owner, repo)}: ${err.message}`);
    }
  }
};

const imageIntentMessage = (
  noUntaggedImages: boolean | undefined,
  repoString: string,
  imageType: 'container' | 'orphaned' = 'container'
): string => {
  let listMessage = `Listing all ${imageType} images for ${repoString}`;
  if (noUntaggedImages) {
    listMessage += ' with at least 1 tag';
  }
  return listMessage;
};

const outputResults = (
  repoString: string,
  images: ContainerImage[],
  outputFunction: (_image: ContainerImage) => string,
  criteria: ContainerOrOphan = 'container'
): void => {
  if (images.length === 0) {
    console.log(`No ${criteria} found in ${repoString}`);
    return;
  }

  images.forEach((image) => console.log(outputFunction(image)));
  return;
};

export const dockerCommand = ():commander.Command => {
  const docker = new commander.Command("docker");

  const imageDetailLine = (image: ContainerImage): string => {
    const tagString = image.tags?.length >= 1 ? ` - (${image.tags.join(', ')})` : undefined;
    return `${image.container}${tagString ?? ''}`;
  };

  const filterImages = (
    images: ContainerImage[],
    noUntagged: boolean | undefined,
    orphans: boolean | undefined
  ): ContainerImage[] => {
    if (noUntagged) {
      return images.filter((image) => image.tags?.length >= 1);
    }
    if (orphans) {
      return images.filter((image) => !(image.tags?.length >= 1));
    }
    return images;
  };

  const consoleLogIf = (condition: boolean, ...args: string[]): void => {
    if (condition) {
      console.log(...args);
    }
  };

  const images = new commander.Command("images")
    .description("List all images in the given github package repository")
    .option("-j, --json", "Output as JSON", false)
    .option('--no-untagged', 'Do not list images with no tags')
    .option('--orphans', 'List only images with no tags')
    .passThroughOptions()
    .action(async (_localOptions: DockerImageComandOptions, command: commander.Command) => {
      const options: DockerImageComandOptions = command.optsWithGlobals();
      if (options.noUntagged && options.orphans) {
        command.error('Cannot use both --no-untagged and --orphans options');
      }
      const { repoInfo, octo } = await parseCommonRepoOptions(command);
      const repoString = repoStringFromInfo(repoInfo);
      const imageType: ContainerOrOphan = options.orphans ? 'orphaned' : 'container';

      consoleLogIf(!options.json, imageIntentMessage(
        options.noUntagged,
        repoString,
        imageType
      ));

      let images: ContainerImage[] = await containerImageOrErrorOut(
        octo, command, repoInfo.owner, repoInfo.repo
      );

      images = filterImages(images, options.noUntagged, options.orphans);

      if (options.json) {
        console.log(images);
      } else {
        outputResults(
          repoString, images, imageDetailLine, imageType
        );
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
    .option('--orphans', 'List only images with no tags')
    .addCommand(images, { isDefault: true });
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
