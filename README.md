# Silo

An AI-powered desktop app built with Tauri + SvelteKit + TypeScript.

[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer).

## Installation

To install Silo with Homebrew:

```bash
# First add the homebrew tap
brew tap julien-blanchon/homebrew-tap

# Then install silo
brew install --cask silo
```

## Development

This project uses automated version management with [semantic-release](https://semantic-release.gitbook.io/semantic-release/).

**Important**: Use [conventional commit messages](https://www.conventionalcommits.org/) for your commits:

- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `feat!:` or `BREAKING CHANGE:` - Breaking changes (major version bump)

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

### Local Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build
```
