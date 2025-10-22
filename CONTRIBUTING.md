# Contributing to Silo

## Automated Version Management

This project uses [semantic-release](https://semantic-release.gitbook.io/semantic-release/) for automated version management and package publishing. This means:

- **No manual version bumps needed** - versions are automatically determined from commit messages
- **Automatic changelog generation** - based on your commit messages
- **Automatic GitHub releases** - created on every merge to main (if there are releaseable commits)

## Commit Message Convention

We follow the [Angular Commit Message Convention](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit). Each commit message should be structured as follows:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### Type

The `type` must be one of the following:

- **feat**: A new feature (triggers a **MINOR** version bump, e.g., 0.1.0 → 0.2.0)
- **fix**: A bug fix (triggers a **PATCH** version bump, e.g., 0.1.0 → 0.1.1)
- **docs**: Documentation only changes (no version bump)
- **style**: Changes that don't affect the meaning of the code (no version bump)
- **refactor**: A code change that neither fixes a bug nor adds a feature (no version bump)
- **perf**: A code change that improves performance (triggers a **PATCH** version bump)
- **test**: Adding missing tests or correcting existing tests (no version bump)
- **build**: Changes that affect the build system or external dependencies (no version bump)
- **ci**: Changes to our CI configuration files and scripts (no version bump)
- **chore**: Other changes that don't modify src or test files (no version bump)

### Breaking Changes

To trigger a **MAJOR** version bump (e.g., 0.1.0 → 1.0.0), you must include `BREAKING CHANGE:` in the commit footer:

```
feat(api): remove deprecated endpoints

BREAKING CHANGE: The `/api/v1/old-endpoint` has been removed.
Use `/api/v2/new-endpoint` instead.
```

Alternatively, you can append `!` after the type/scope:

```
feat!: remove support for Node 14
```

### Examples

#### Feature (Minor version bump)

```
feat(ui): add dark mode toggle to settings

Users can now switch between light and dark themes in the settings page.
```

#### Bug Fix (Patch version bump)

```
fix(tauri): resolve window resize issue on macOS

Fixed a bug where the window would not properly resize on macOS Big Sur and later.
```

#### Breaking Change (Major version bump)

```
feat(api)!: restructure configuration format

BREAKING CHANGE: The configuration file format has changed from JSON to TOML.
Users will need to migrate their existing config.json files to config.toml.
```

#### Non-release commit (No version bump)

```
docs: update installation instructions

Added instructions for installing via Homebrew.
```

## How It Works

1. **Write your code** - Make your changes as usual
2. **Commit with conventional format** - Use the commit message format above
3. **Push or merge to main** - The CI workflow will:
   - Analyze your commit messages
   - Determine the next version number
   - Update `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`
   - Generate/update `CHANGELOG.md`
   - Create a git tag
   - Commit the changes with `[skip ci]`
   - Build and publish the macOS app
   - Create a GitHub release

## Tools to Help

### Commitizen (Optional)

You can use [Commitizen](https://github.com/commitizen/cz-cli) to help format your commits:

```bash
bun add -D commitizen cz-conventional-changelog
bunx git-cz
```

### Commitlint (Optional)

To validate commit messages locally:

```bash
bun add -D @commitlint/cli @commitlint/config-conventional
echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js
```

## Versioning Files

The following files are automatically updated with each release:

- `package.json` - NPM package version
- `src-tauri/tauri.conf.json` - Tauri app version
- `src-tauri/Cargo.toml` - Rust package version
- `src-tauri/Cargo.lock` - Auto-updated by Cargo
- `CHANGELOG.md` - Automatically generated release notes

**Never manually edit version numbers in these files.**

## Testing Locally

To see what version would be released without actually releasing:

```bash
bunx semantic-release --dry-run
```

This will show you:

- What the next version would be
- What commits would be included
- What the changelog would look like

## Questions?

- See the [semantic-release documentation](https://semantic-release.gitbook.io/semantic-release/)
- Check the [Angular Commit Convention](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
