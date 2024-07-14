import { branchNameToVersion } from "./branchNameToVersion";

describe('branchNameToVersion', () => {
  test('Should replace all non-alphanumeric characters except space with a dash', () => {
    expect(branchNameToVersion('feature/branch')).toBe('feature-branch');
  });
});
