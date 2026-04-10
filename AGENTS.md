# AGENTS.md

## Build & Verify

```bash
npm run build        # Compile TypeScript to dist/
npm run check        # Type check only (--noEmit)
npm run lint         # Run oxlint
npm run lint:fix     # Run oxlint with auto-fix
npm run format       # Format code with oxfmt
npm run format:check # Check formatting without modifying
```

## Architecture

OpenCode TUI plugin that registers a `/copilot-multipliers` slash command. The plugin fetches GitHub Copilot model multipliers from GitHub Docs, parses the HTML table, caches results locally, and displays in a dialog.

**Entry point:** `src/plugin.ts` exports a `TuiPluginModule` with `id` and `tui` function. The `tui` function receives `TuiPluginApi` and `PluginOptions`, then registers commands via `api.command.register()`.

**Data flow:**

- `commandMultipliers.ts` orchestrates: check cache → fetch if stale → validate → cache
- `fetchMultipliers.ts` scrapes HTML from GitHub Docs and extracts model/multiplier table
- `cache.ts` handles atomic file writes (temp file + rename pattern)
- `validateTable.ts` normalizes and validates markdown table output

**Plugin registration:** Add to `tui.json`:

```json
{
  "plugin": [["./dist/plugin.js", { "cacheDir": "...", "forceRefresh": false }]],
  "plugin_enabled": { "copilot.multipliers": true }
}
```

## Key Constants

- `CACHE_TTL_MS` = 7 days (hardcoded in `types.ts`)
- `SOURCE_URL` = GitHub Docs URL for Copilot billing page

## Development Notes

- **ESM only** (`"type": "module"` in package.json, `"module": "NodeNext"` in tsconfig)
- **ES2023 target** (required for `Array.toSorted()`)
- **Oxlint rules:** `correctness: error`, `suspicious: warn`, `pedantic: warn`
- **In-flight deduplication:** `commandMultipliers.ts` uses a module-level `inflightRefresh` promise to prevent duplicate fetches
- **Fallback behavior:** On fetch error, returns stale cache with warning instead of throwing
- **Cache location:** `.opencode/cache/copilot-multipliers.md` and `.opencode/cache/copilot-multipliers.meta.json` relative to workspace
