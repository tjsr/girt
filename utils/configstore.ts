import Configstore from 'configstore';
import { getCurrentVersion } from "./version.js";

const DEFAULT_VERSION_CHECK_CACHE_TIMEOUT = 6 * 60 * 60; // 6 hours

const config = new Configstore('girt', {
  cacheTimeout: DEFAULT_VERSION_CHECK_CACHE_TIMEOUT,
  lastVersionCheck: undefined,
  latestKnownVersion: undefined,
  version: getCurrentVersion(),
});

export const versionCheckCached = (currentVersion: string): boolean => {
  const lastVersionCheck = config.get('lastVersionCheck');
  if (!lastVersionCheck) {
    return false;
  }
  if (currentVersion !== config.get('version')) {
    return false;
  }
  const latestVersionCheckTime = new Date(lastVersionCheck);
  const cacheTimeout = config.get('cacheTimeout') || DEFAULT_VERSION_CHECK_CACHE_TIMEOUT;
  const now = new Date();
  return (now.getTime() - latestVersionCheckTime.getTime()) < cacheTimeout;
};

export const updateVersionChecked = (version: string, latestKnownVersion: string): void => {
  config.set('lastVersionCheck', new Date());
  config.set('version', version);
  config.set('latestKnownVersion', latestKnownVersion);
};

export const getCachedLatestVersion = (): string|undefined => {
  return config.get('latestKnownVersion');
};

export const clearConfigstore = () => config.clear();
