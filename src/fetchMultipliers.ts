import { MultipliersRow, SOURCE_URL } from "./types.js"
import { renderMultipliersTable } from "./validateTable.js"

const DEFAULT_TIMEOUT_MS = 15000

export async function fetchMultipliersTableMarkdown(): Promise<string> {
  const rows = await fetchMultipliersRows()
  return renderMultipliersTable(rows)
}

export async function fetchMultipliersRows(): Promise<MultipliersRow[]> {
  const html = await fetchHtml(SOURCE_URL)
  const table = extractPaidPlanTable(html)
  const rows = parseRows(table)
  if (rows.length === 0) {
    throw new Error("No model multiplier rows found")
  }
  return rows
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Failed to fetch model multipliers: ${response.status}`)
    }
    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

function extractPaidPlanTable(html: string): string {
  const tableRegex = /<table[\s\S]*?<\/table>/gi
  const tables = html.match(tableRegex) ?? []

  for (const table of tables) {
    // Try to extract the header cells of the first row
    const headerRowMatch = table.match(/<tr[\s\S]*?<\/tr>/i)
    const headerRow = headerRowMatch ? headerRowMatch[0] : undefined
    if (!headerRow) continue

    const cellRegex = /<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi
    const headers: string[] = []
    let m: RegExpExecArray | null
    while ((m = cellRegex.exec(headerRow)) !== null) {
      const txt = decodeEntities(stripTags(m[2])).trim()
      headers.push(txt.toLowerCase())
    }

    if (headers.length >= 2) {
      const h0 = headers[0]
      const h1 = headers[1]
      if (h0.includes("model") && h1.includes("multiplier")) {
        return table
      }
    }
  }

  // As a fallback, return the first table that contains the words "model" and "multiplier"
  for (const table of tables) {
    const txt = decodeEntities(stripTags(table)).toLowerCase()
    if (txt.includes("model") && txt.includes("multiplier")) return table
  }

  throw new Error("Could not find paid plans multiplier table")
}

function parseRows(tableHtml: string): MultipliersRow[] {
  const rowRegex = /<tr[\s\S]*?<\/tr>/gi
  const cellRegex = /<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi
  const rows: MultipliersRow[] = []
  const seen = new Set<string>()

  const trMatches = tableHtml.match(rowRegex) ?? []
  for (const tr of trMatches) {
    const cells: string[] = []
    let match: RegExpExecArray | null
    while ((match = cellRegex.exec(tr)) !== null) {
      const value = decodeEntities(stripTags(match[2])).replaceAll(/\s+/g, " ").trim()
      cells.push(value)
    }

    if (cells.length < 2) continue
    const first = cells[0]
    const second = cells[1]
    if (first.toLowerCase() === "model") continue

    const multiplier = parseMultiplier(second)
    if (multiplier === null) continue

    const key = first.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    rows.push({ model: first, multiplier })
  }

  return rows
}

function parseMultiplier(input: string): number | null {
  const cleaned = input.replaceAll(/\s+/g, " ").trim()
  const firstNumber = cleaned.match(/\d+(?:\.\d+)?/)
  if (!firstNumber) return null
  const value = Number.parseFloat(firstNumber[0])
  if (Number.isNaN(value)) return null
  return value
}

function stripTags(input: string): string {
  return input.replaceAll(/<[^>]+>/g, " ")
}

function decodeEntities(input: string): string {
  return input
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
}
