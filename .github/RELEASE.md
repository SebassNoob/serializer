# Release Process

This repository uses [Changesets](https://github.com/changesets/changesets) for version management and automated publishing to npm with GitHub releases.

## How it works

1. **Making changes**: When you make changes that should trigger a release, create a changeset:
   ```bash
   bun run changesets
   ```
   This will prompt you to describe your changes and select which packages are affected.
   Commit the changeset file.

2. **Manual release workflow**: The CI workflow (`.github/workflows/release.yml`) is triggered manually:
   - Go to the "Actions" tab in your GitHub repository
   - Select the "Release" workflow
   - Click "Run workflow"
   - The workflow will automatically check if there are changesets to process
   - If changesets exist, it will version the packages and publish to npm
   - GitHub releases will be created automatically for published packages

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
3. Commit and push your changes (including the changeset file)
4. Go to GitHub Actions and manually trigger the "Release" workflow
5. The workflow will automatically:
   - Check if there are changesets to process
   - Version the packages using `changeset version` (this removes changeset files and updates versions/changelogs)
   - Commit the version changes back to the repository
   - Publish packages to npm
   - Create GitHub releases with changelog information

## What happens to changeset files?

**Yes, changeset files are removed during the release process.** This is the intended behavior:

1. Changeset files (`.changeset/*.md`) are temporary files that describe pending changes
2. When `changeset version` runs, it:
   - Consumes (deletes) the changeset files
   - Updates package versions in `package.json`
   - Adds entries to `CHANGELOG.md` files
3. These changes are committed back to your repository
4. The packages are then published to npm

This is the standard Changesets workflow - the changeset files are meant to be consumed and removed once they've been processed into version bumps and changelog entries.

## Manual Workflow Options

When running the workflow manually, you have the following options:

- **Normal run**: The workflow will only proceed if there are changeset files to process
- **Force run**: Check the "Force publish even if no changesets exist" option to bypass the changeset check (use with caution)
