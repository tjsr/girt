export const branchNameToVersion = (branchName: string): string => {
  branchName = branchName.replace(/[^a-zA-Z0-9\w]/g, '-');
  branchName = branchName.replace(/\w/g, '_');
  return branchName;
};
