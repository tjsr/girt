const validBranch = (branchName: string): boolean => {
  const regex = /^(?!\/)[a-zA-Z0-9_\-\/.]+$/;
  return regex.test(branchName);
};

export const branchNameToVersion = (branchName: string): string => {
  if (!validBranch(branchName)) {
    throw new Error(`Branch name ${branchName} is invalid`);
  }

  branchName = branchName.replace(/[^a-zA-Z0-9\w\.]/g, '-');
  branchName = branchName.replace(/[^\w\-\.]/g, '_');
  return branchName;
};
