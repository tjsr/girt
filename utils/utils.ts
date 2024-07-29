import * as semver from 'semver';

import { getCachedLatestVersion, updateVersionChecked, versionCheckCached } from './configstore.js';

import { getCurrentVersion } from './version.js';
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
  cachedCheck: boolean,
  currentVersion: string;
  isNewVersionAvailable: boolean;
  latestVersion: string;
};

export const getNewestPackageVersion = async (currentVersion?: string): Promise<NewPackageVersionInfo> => {
  const checkVersion = currentVersion || await getCurrentVersion();

  const result: Partial<NewPackageVersionInfo> = {
    cachedCheck: true,
    currentVersion: checkVersion,
  };

  if (versionCheckCached(checkVersion)) {
    const cachedVersion = getCachedLatestVersion();
    console.log('Using cached version check', cachedVersion, checkVersion);
    result.latestVersion = cachedVersion;
    result.isNewVersionAvailable = semver.gt(cachedVersion, checkVersion);
    return result as NewPackageVersionInfo;
  }

  const latestReleasedVersion = await latestVersion('girt');
  
  updateVersionChecked(checkVersion, latestReleasedVersion);
  result.cachedCheck = false;
  result.latestVersion = latestReleasedVersion;
  result.isNewVersionAvailable = semver.gt(latestReleasedVersion, checkVersion);
  return result as NewPackageVersionInfo;
};
