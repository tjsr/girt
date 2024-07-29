import * as semver from 'semver';

import { findPackageJson, getVersionFromPackageJson } from "@tjsr/package-json-utils";

import latestVersion from 'latest-version';

export const safeInt = (value: string|number|undefined): number|undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'number') {
    return value as number;
  }

  return parseInt(value);
};

export const parameterOrExistingOrDefault = <DataType>(
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

export type NewPackageVersionInfo = {
  isNewVersionAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
};

let packageVersion: string|undefined;

export const getCurrentVersion = async(reload: boolean = false): Promise<string> => {
  if (reload || !packageVersion) {
    const packageJsonPath = findPackageJson(import.meta.dirname);
    packageVersion = await getVersionFromPackageJson(packageJsonPath);
    return packageVersion;
  }
  return packageVersion;
};

export const getNewestPackageVersion = async (currentVersion?: string): Promise<NewPackageVersionInfo> => {
  const checkVersion = currentVersion || await getCurrentVersion();
  const latestReleasedVersion = await latestVersion('girt');

  return {
    currentVersion: checkVersion,
    isNewVersionAvailable: semver.gt(latestReleasedVersion, checkVersion),
    latestVersion: latestReleasedVersion,
  };
};
