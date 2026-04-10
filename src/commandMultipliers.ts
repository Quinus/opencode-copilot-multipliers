import { readCache, resolveCacheDir, writeCache } from "./cache.js"
import { fetchMultipliersTableMarkdown } from "./fetchMultipliers.js"
import { MultipliersCommandResult, PluginOptions } from "./types.js"
import { validateAndNormalizeMultipliersTable } from "./validateTable.js"

let inflightRefresh: Promise<string> | undefined

export async function runMultipliersCommand(params: {
  workspaceDir: string
  options?: PluginOptions
}): Promise<MultipliersCommandResult> {
  const cacheRoot = resolveCacheDir(params.workspaceDir, params.options?.cacheDir)
  const cache = await readCache(cacheRoot)
  const forceRefresh = params.options?.forceRefresh === true

  if (!forceRefresh && cache.isFresh && cache.tableMarkdown) {
    return {
      markdown: cache.tableMarkdown,
      fromCache: true,
    }
  }

  try {
    const table = await refreshTable(cacheRoot)
    return {
      markdown: table,
      fromCache: false,
    }
  } catch (error) {
    if (cache.hasTable && cache.tableMarkdown) {
      const reason = error instanceof Error ? error.message : "Unknown fetch error"
      return {
        markdown: cache.tableMarkdown,
        fromCache: true,
        warning: `Showing stale weekly cache because refresh failed: ${reason}`,
      }
    }
    throw error
  }
}

async function refreshTable(cacheRoot: string): Promise<string> {
  if (inflightRefresh) return inflightRefresh

  inflightRefresh = (async () => {
    const raw = await fetchMultipliersTableMarkdown()
    const normalized = validateAndNormalizeMultipliersTable(raw)
    await writeCache(cacheRoot, normalized)
    return normalized
  })()

  try {
    return await inflightRefresh
  } finally {
    inflightRefresh = undefined
  }
}
