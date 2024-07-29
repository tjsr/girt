import { findPackageJson, getVersionFromPackageJson } from "@tjsr/package-json-utils";

let packageVersion: string|undefined;

export const getCurrentVersion = async(reload: boolean = false): Promise<string> => {
  if (reload || !packageVersion) {
    const packageJsonPath = findPackageJson(import.meta.dirname);
    packageVersion = await getVersionFromPackageJson(packageJsonPath);
    return packageVersion;
  }
  return packageVersion;
};
