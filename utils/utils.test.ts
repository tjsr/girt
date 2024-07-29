import { getNewestPackageVersion } from './utils.js';

describe('getNewestPackageVersion', () => {
  test('should return structure with isNewVersionAvailable=false if an old version', async () => {
    // const latestVersion = '1.0.0';
    const currentVersion = '2.0.0';
    const result = await getNewestPackageVersion(currentVersion);

    expect(result.isNewVersionAvailable).toEqual(false);
  });
});
