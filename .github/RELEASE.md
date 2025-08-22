# Release Process

This repository uses [Changesets](https://github.com/changesets/changesets) for version management and automated publishing to npm with GitHub releases.

## How it works

1. **Making changes**: When you make changes that should trigger a release, create a changeset:
   ```bash
   bun run changesets
   ```
   This will prompt you to describe your changes and select which packages are affected.

2. **Release workflow**: The CI workflow (`.github/workflows/release.yml`) automatically:
   - Runs on every push to the `master` branch
   - Builds and tests all packages
   - Creates a "Version Packages" pull request when there are unreleased changesets
   - When the PR is merged, publishes packages to npm and creates GitHub releases

## Setup Requirements

To use this workflow, you need to configure the following secrets in your GitHub repository:

### Required Secrets

1. **NPM_TOKEN**: Token for publishing to npm
   - Go to [npm.com](https://www.npmjs.com/) and create an access token
   - Add it as a repository secret named `NPM_TOKEN`

### Repository Permissions

The workflow requires the following permissions (already configured):
- `contents: write` - To create releases and tags
- `pull-requests: write` - To create version bump PRs  
- `id-token: write` - For npm publishing with provenance

## Changeset Commands

- `bun run changesets` - Create a new changeset
- `bun run changesets:version` - Consume changesets and bump versions
- `bun run changesets:publish` - Publish packages to npm

## Release Types

When creating a changeset, you can choose:
- **Patch** (0.0.X) - Bug fixes
- **Minor** (0.X.0) - New features (backward compatible)
- **Major** (X.0.0) - Breaking changes

## Example Workflow

1. Make your changes
2. Run `bun run changesets` and describe your changes
3. Commit and push to a feature branch
4. Create a pull request
5. After the PR is merged, the CI will create a "Version Packages" PR
6. Review and merge the "Version Packages" PR
7. CI automatically publishes to npm and creates GitHub releases
