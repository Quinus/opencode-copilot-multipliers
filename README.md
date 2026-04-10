# OpenCode Copilot Multipliers Plugin

Adds a `/copilot-multipliers` slash command to OpenCode that shows GitHub Copilot model multipliers.

## Behavior

- Fetches model multipliers from GitHub Docs.
- Caches results in `.opencode/cache/`.
- Reuses cache for 7 days.
- Refreshes only when cache is older than 7 days.
- Falls back to stale cache if refresh fails.

## Cache Files

- `.opencode/cache/copilot-multipliers.md`
- `.opencode/cache/copilot-multipliers.meta.json`

## Install/Use

1. Build plugin:

```bash
npm install
npm run build
```

2. Register plugin in your `tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [["./dist/plugin.js", { "forceRefresh": false }]]
}
```

3. In OpenCode, run:

```text
/copilot-multipliers
```

## Options

- `cacheDir` (string): override cache directory.
- `forceRefresh` (boolean): bypass weekly cache.
