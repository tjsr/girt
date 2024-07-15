export const branchNameToVersion = (branchName: string): string => {
  if (branchName?.startsWith('/')) {
    throw new Error('Branch name cannot start with a /');
  }
  if (branchName?.includes('$')) {
    throw new Error('Branch name cannot contain $');
  }
  branchName = branchName.replace(/[^a-zA-Z0-9\w\.]/g, '-');
  branchName = branchName.replace(/[^\w\-\.]/g, '_');
  return branchName;
};
