import { MultipliersRow } from "./types.js"

function parseNumber(input: string): number {
  const normalized = input.trim().replace(/x$/i, "")
  const value = Number.parseFloat(normalized)
  if (Number.isNaN(value)) {
    throw new TypeError(`Invalid multiplier value: ${input}`)
  }
  return value
}

export function renderMultipliersTable(rows: MultipliersRow[]): string {
  const sorted = [...rows].toSorted(
    (a, b) => a.multiplier - b.multiplier || a.model.localeCompare(b.model),
  )
  const modelWidth = Math.max("Model".length, ...sorted.map((row) => row.model.length))
  const multiplierStrings = sorted.map((row) => formatMultiplier(row.multiplier))
  const multiplierWidth = Math.max(
    "Multiplier".length,
    ...multiplierStrings.map((value) => value.length),
  )

  const header = `| ${"Model".padEnd(modelWidth)} | ${"Multiplier".padEnd(multiplierWidth)} |`
  const divider = `| ${"-".repeat(modelWidth)} | ${"-".repeat(multiplierWidth)} |`
  const body = sorted.map((row, index) => {
    const multiplier = multiplierStrings[index]
    return `| ${row.model.padEnd(modelWidth)} | ${multiplier.padEnd(multiplierWidth)} |`
  })

  return [header, divider, ...body].join("\n")
}

// oxlint-disable-next-line max-lines-per-function -- table parsing logic is cohesive
export function validateAndNormalizeMultipliersTable(markdown: string): string {
  const lines = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 3) {
    throw new Error("Table output is too short")
  }

  const parsedRows: MultipliersRow[] = []
  let headerSeen = false

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!line.startsWith("|") || !line.endsWith("|")) {
      throw new Error("Output contains non-table content")
    }
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim())
    if (cells.length !== 2) {
      throw new Error("Table must have exactly two columns")
    }

    if (index === 0) {
      if (cells[0] !== "Model" || cells[1] !== "Multiplier") {
        throw new Error("Table header must be exactly: Model | Multiplier")
      }
      headerSeen = true
      continue
    }

    if (index === 1) {
      continue
    }

    const model = cells[0]
    const multiplier = parseNumber(cells[1])
    parsedRows.push({ model, multiplier })
  }

  if (!headerSeen || parsedRows.length === 0) {
    throw new Error("Table has no rows")
  }

  const seen = new Set<string>()
  for (const row of parsedRows) {
    const key = row.model.toLowerCase()
    if (seen.has(key)) {
      throw new Error(`Duplicate model row: ${row.model}`)
    }
    seen.add(key)
  }

  const sorted = [...parsedRows].toSorted(
    (a, b) => a.multiplier - b.multiplier || a.model.localeCompare(b.model),
  )
  return renderMultipliersTable(sorted)
}

function formatMultiplier(value: number): string {
  const normalized = Number.isInteger(value) ? value.toString() : value.toString()
  return normalized
}
