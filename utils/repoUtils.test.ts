import { repoString } from "./repoUtils.js";

describe('repoString', () => {
  test('Should put append undefined when branch is undefined', () => {
    expect(repoString({ owner: 'owner', repo: 'repo' })).toBe('@owner/repo');
  });

  test('Still needs to accept a parameter that does have hostname', () => {
    expect(repoString({ hostname: 'example.com', owner: 'owner', repo: 'repo' })).toBe('@owner/repo');
  });
});
