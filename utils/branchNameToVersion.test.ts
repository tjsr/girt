import { branchNameToVersion } from "./branchNameToVersion.js";

describe('branchNameToVersion', () => {
  test('Should replace disallowed characters except space with a dash', () => {
    expect(branchNameToVersion('feature/branch')).toBe('feature-branch');
    expect(branchNameToVersion('fix/bug-name')).toBe('fix-bug-name');
    expect(branchNameToVersion('fix/another_bug')).toBe('fix-another_bug');
    expect(branchNameToVersion('something.else/version1.23')).toBe('something.else-version1.23');
  });

  test('Should accept branch names containing numbers', () => {
    expect(branchNameToVersion('dev/task123')).toBe('dev-task123');
  });

  test('Should accept branch names containing numbers', () => {
    expect(branchNameToVersion('dev/task123')).toBe('dev-task123');
  });

  test('Should reject branch names beginning with a /', () => {
    expect(() => branchNameToVersion('/dev/task')).toThrow();
  });

  test('Should reject branch names containing invalid characters', () => {
    expect(() => branchNameToVersion('dev/illegal$name')).toThrow();
  });
});
