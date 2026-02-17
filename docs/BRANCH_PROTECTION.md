# Branch Protection Configuration

This document provides instructions for manually configuring branch protection rules in GitHub to enforce CI status checks before merging.

## Overview

Branch protection rules ensure that all required CI checks pass before code can be merged into protected branches. This prevents broken code from being merged and maintains code quality.

## Required Status Checks

The following CI checks must pass before merging:

| Check     | Command             | Purpose                                     |
| --------- | ------------------- | ------------------------------------------- |
| Lint      | `bun run lint`      | ESLint validation for all JS/TS/Astro files |
| Typecheck | `bun run typecheck` | TypeScript strict mode validation           |
| Test      | `bun run test`      | Unit test suite execution                   |
| Build     | `bun run build`     | Production build verification               |

## Manual Setup Instructions

### Step 1: Navigate to Repository Settings

1. Go to the repository on GitHub: https://github.com/MasuRii/CITUCourseBuilder
2. Click **Settings** tab
3. In the left sidebar, click **Branches** under "Code and automation"

### Step 2: Create Branch Protection Rule

1. Click **Add branch protection rule**
2. In "Branch name pattern", enter: `main`

### Step 3: Configure Protection Settings

#### Protect matching branches

- [x] **Require a pull request before merging**
  - [x] Require approvals: 0 (for solo development) or 1+ (for team development)
  - [x] Dismiss stale pull request approvals when new commits are pushed

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging

  Add the following required status checks:
  - `build` - Build verification
  - `lint` - ESLint validation
  - `test` - Unit tests
  - `typecheck` - TypeScript validation

- [x] **Require conversation resolution before merging**
  - Ensures all review comments are resolved

- [x] **Do not allow bypassing the above settings**
  - Prevents administrators from bypassing protection rules

### Step 4: Save Changes

Click **Create** or **Save changes** to apply the protection rule.

## CI Workflow Reference

The status checks are defined in `.github/workflows/deploy.yml`:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # ... checkout and setup steps ...

      - name: Run lint
        run: bun run lint

      - name: Run typecheck
        run: bun run typecheck
        working-directory: ./course-scheduler-astro

      - name: Run tests
        run: bun run test
        working-directory: ./course-scheduler-astro

      - name: Build project
        run: bun run build
        working-directory: ./course-scheduler-astro
```

## Status Check Behavior

- **Pass**: All steps complete with exit code 0
- **Fail**: Any step exits with non-zero code
- **Block Merge**: Pull request cannot be merged until all required checks pass

## Troubleshooting

### Status checks not appearing

1. Ensure the workflow has run at least once on the branch
2. Check that the job name matches exactly (case-sensitive)
3. Verify the workflow file is on the target branch

### Checks passing locally but failing in CI

1. Ensure same Node.js/Bun versions are used
2. Run `bun install --frozen-lockfile` to match CI behavior
3. Check for environment-specific configurations

## Related Documentation

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Status Checks Documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
