import { createBranchProtectionSettingsPayload, createReviewProtection } from "./protect.js";

import { BranchProtectionContext } from "./testTypes.js";
import { basicContext } from "./testTypes.js";

describe<BranchProtectionContext>('createReviewProtection', () => {
  beforeEach(basicContext);

  test('Should exclude reviewers node if value is undefined', (context: BranchProtectionContext) => {
    // Arrange
    const reviewers = undefined;

    // Act
    const result = createReviewProtection(context.branch, context.repoOwner, context.repoName, reviewers);

    // Assert
    expect(result).not.toHaveProperty('required_approving_review_count');
  });

  test('Should have reviewers value provided as a parameter.', (context: BranchProtectionContext) => {
    // Arrange
    const reviewers = 3;

    // Act
    const result = createReviewProtection(context.branch, context.repoOwner, context.repoName, reviewers);

    // Assert
    expect(result.required_approving_review_count).toEqual(3);
  });
});

describe('createBranchProtectionSettingsPayload', () => {
  beforeEach(basicContext);

  test('Should exclude reviewers node if value is undefined', (context: BranchProtectionContext) => {
    // Arrange
    const reviewers = undefined;
    const enforceAdmins = false;

    // Act
    const result = createBranchProtectionSettingsPayload(context.branch, context.repoOwner, context.repoName, reviewers, enforceAdmins);

    // Assert
    expect(result.required_pull_request_reviews).not.toHaveProperty('required_approving_review_count');
  });

  test('Should have the value provided for number of reviewers', (context: BranchProtectionContext) => {
    // Arrange
    const reviewers = 2;
    const enforceAdmins = false;

    // Act
    const result = createBranchProtectionSettingsPayload(context.branch, context.repoOwner, context.repoName, reviewers, enforceAdmins);

    // Assert
    expect(result.required_pull_request_reviews.required_approving_review_count).toEqual(2);
  });


  test('Should set enforce admins false if value is already set false', (context: BranchProtectionContext) => {
    // Arrange
    const reviewers = undefined;
    const enforceAdmins = false;

    // Act
    const result = createBranchProtectionSettingsPayload(context.branch, context.repoOwner, context.repoName, reviewers, enforceAdmins);

    // Assert
    expect(result).toHaveProperty('enforce_admins', false);
  });

  test('Should set enforce admins node if value is undefined', (context: BranchProtectionContext) => {
    // Arrange
    const reviewers = undefined;
    const enforceAdmins = undefined;

    // Act
    const result = createBranchProtectionSettingsPayload(context.branch, context.repoOwner, context.repoName, reviewers, enforceAdmins);

    // Assert
    expect(result).toHaveProperty('enforce_admins', true);
  });

});

