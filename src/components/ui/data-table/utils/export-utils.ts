import type { DataTableColumn } from "../types"
import { getCellValue, formatCellValue } from "./formatters"

export type ExportScope = "current" | "selected" | "all"

interface ExportOptions<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  filename?: string
}

/**
 * Build export rows from data using visible column definitions
 */
function buildExportRows<T>(
  data: T[],
  columns: DataTableColumn<T>[]
): { headers: string[]; rows: string[][] } {
  const headers = columns.map((col) =>
    typeof col.header === "string" ? col.header : col.id
  )

  const rows = data.map((row) =>
    columns.map((col) => {
      const value = getCellValue(row, col)
      return formatCellValue(value, col)
    })
  )

  return { headers, rows }
}

/**
 * Export data as CSV and trigger download
 */
export function exportCSV<T>({
  columns,
  data,
  filename = "export",
}: ExportOptions<T>): void {
  if (!data.length) return

  const { headers, rows } = buildExportRows(data, columns)

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\r\n")

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  })
  downloadBlob(blob, `${filename}.csv`)
}

/**
 * Export data as JSON and trigger download
 */
export function exportJSON<T>({
  columns,
  data,
  filename = "export",
}: ExportOptions<T>): void {
  if (!data.length) return

  const jsonData = data.map((row) => {
    const obj: Record<string, string> = {}
    columns.forEach((col) => {
      const key = typeof col.header === "string" ? col.header : col.id
      const value = getCellValue(row, col)
      obj[key] = formatCellValue(value, col)
    })
    return obj
  })

  const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
    type: "application/json;charset=utf-8;",
  })
  downloadBlob(blob, `${filename}.json`)
}

/**
 * Copy data to clipboard as tab-separated values
 */
export async function exportClipboard<T>({
  columns,
  data,
}: ExportOptions<T>): Promise<boolean> {
  if (!data.length) return false

  const { headers, rows } = buildExportRows(data, columns)

  const text = [
    headers.join("\t"),
    ...rows.map((row) => row.join("\t")),
  ].join("\n")

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function escapeCSV(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return `"${value}"`
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
