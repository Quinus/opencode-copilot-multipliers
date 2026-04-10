export const PLUGIN_ID = "copilot.multipliers"
export const SOURCE_URL =
  "https://docs.github.com/en/copilot/concepts/billing/copilot-requests#model-multipliers"
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
export const SCHEMA_VERSION = 1

export interface MultipliersMeta {
  schemaVersion: number
  sourceUrl: string
  lastFetchedAt: string
  contentHash?: string
}

export interface MultipliersRow {
  model: string
  multiplier: number
}

export interface MultipliersCommandResult {
  markdown: string
  fromCache: boolean
  warning?: string
}

export interface PluginOptions {
  cacheDir?: string
  forceRefresh?: boolean
}
