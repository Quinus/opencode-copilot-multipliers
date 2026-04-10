import { createHash } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

import { CACHE_TTL_MS, MultipliersMeta, SCHEMA_VERSION, SOURCE_URL } from "./types.js"

export interface CachePaths {
  tablePath: string
  metaPath: string
}

export interface CacheReadResult {
  tableMarkdown?: string
  meta?: MultipliersMeta
  hasTable: boolean
  isFresh: boolean
}

export function getCachePaths(cacheRoot: string): CachePaths {
  return {
    tablePath: join(cacheRoot, "copilot-multipliers.md"),
    metaPath: join(cacheRoot, "copilot-multipliers.meta.json"),
  }
}

export function resolveCacheDir(baseDir: string, optionDir?: string): string {
  if (optionDir && optionDir.trim().length > 0) {
    return optionDir
  }
  return join(baseDir, ".opencode", "cache")
}

export function isFresh(lastFetchedAt: string, nowMs = Date.now()): boolean {
  const parsed = Date.parse(lastFetchedAt)
  if (Number.isNaN(parsed)) return false
  return nowMs - parsed < CACHE_TTL_MS
}

export async function readCache(cacheRoot: string): Promise<CacheReadResult> {
  const paths = getCachePaths(cacheRoot)
  let tableMarkdown: string | undefined
  let meta: MultipliersMeta | undefined

  try {
    tableMarkdown = await readFile(paths.tablePath, "utf8")
  } catch {
    tableMarkdown = undefined
  }

  try {
    const rawMeta = await readFile(paths.metaPath, "utf8")
    const parsed = JSON.parse(rawMeta) as MultipliersMeta
    if (
      parsed &&
      typeof parsed.lastFetchedAt === "string" &&
      typeof parsed.sourceUrl === "string"
    ) {
      meta = parsed
    }
  } catch {
    meta = undefined
  }

  const hasTable = typeof tableMarkdown === "string" && tableMarkdown.trim().length > 0
  const fresh = hasTable && !!meta && isFresh(meta.lastFetchedAt)

  return {
    tableMarkdown,
    meta,
    hasTable,
    isFresh: fresh,
  }
}

export async function writeCache(
  cacheRoot: string,
  markdown: string,
  nowMs = Date.now(),
): Promise<MultipliersMeta> {
  const paths = getCachePaths(cacheRoot)
  const hash = createHash("sha256").update(markdown).digest("hex")
  const meta: MultipliersMeta = {
    schemaVersion: SCHEMA_VERSION,
    sourceUrl: SOURCE_URL,
    lastFetchedAt: new Date(nowMs).toISOString(),
    contentHash: `sha256:${hash}`,
  }

  await mkdir(dirname(paths.tablePath), { recursive: true })
  await atomicWrite(paths.tablePath, markdown)
  await atomicWrite(paths.metaPath, `${JSON.stringify(meta, null, 2)}\n`)
  return meta
}

async function atomicWrite(filePath: string, contents: string): Promise<void> {
  const tempPath = `${filePath}.tmp-${Date.now()}`
  await writeFile(tempPath, contents, "utf8")
  await rename(tempPath, filePath)
}
