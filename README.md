# OpenCode Copilot Multipliers Plugin

[![npm version](https://img.shields.io/npm/v/opencode-copilot-multipliers.svg)](https://www.npmjs.com/package/opencode-copilot-multipliers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Adds a `/copilot-multipliers` slash command to OpenCode that shows GitHub Copilot model multipliers.

## Features

- Fetches model multipliers from GitHub Docs
- Caches results locally for 7 days
- Falls back to stale cache if refresh fails
- Displays multipliers in a clean dialog within OpenCode

## Installation

### From npm (Recommended)

```bash
npm install opencode-copilot-multipliers
```

Then add to your `tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [["opencode-copilot-multipliers", { "forceRefresh": false }]]
}
```

### From Source (Development)

1. Clone and build:

```bash
git clone https://github.com/quinus/opencode-copilot-multipliers.git
cd opencode-copilot-multipliers
npm install
npm run build
```

2. Register in your `tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [["./dist/plugin.js", { "forceRefresh": false }]]
}
```

## Usage

In OpenCode, run:

```
/copilot-multipliers
```

This displays a dialog showing the current GitHub Copilot model multipliers.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cacheDir` | string | `.opencode/cache/` | Custom cache directory path |
| `forceRefresh` | boolean | `false` | Bypass weekly cache and fetch fresh data |

## Cache Files

The plugin stores cache files in `.opencode/cache/` (or custom directory if specified):

- `copilot-multipliers.md` - Markdown table with model multipliers
- `copilot-multipliers.meta.json` - Metadata (last fetch time, cache status)

## Behavior

- **First run**: Fetches multipliers from GitHub Docs and caches locally
- **Subsequent runs**: Uses cached data if younger than 7 days
- **Stale cache (> 7 days)**: Automatically refreshes from GitHub Docs
- **Fetch error**: Falls back to stale cache with warning toast

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Type check
npm run check

# Lint
npm run lint

# Format
npm run format
```

## License

MIT © Quinten Schelfhout
