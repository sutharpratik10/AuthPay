import { format as dateFnsFormat } from "date-fns"
import { STATUS_COLOR_MAP } from "../constants"
import type { DataTableColumn } from "../types"

/**
 * Get the raw value from a row using column's accessorKey or accessorFn
 */
export function getCellValue<T>(row: T, column: DataTableColumn<T>): unknown {
  if (column.accessorFn) {
    return column.accessorFn(row)
  }
  if (column.accessorKey) {
    // Support nested keys like "user.name"
    const keys = column.accessorKey.split(".")
    let value: unknown = row
    for (const key of keys) {
      if (value == null) return undefined
      value = (value as Record<string, any>)[key]
    }
    return value
  }
  return undefined
}

/**
 * Format a date value
 */
export function formatDate(
  value: unknown,
  formatStr: string = "MMM d, yyyy"
): string {
  if (!value) return "—"
  try {
    const date = value instanceof Date ? value : new Date(String(value))
    if (isNaN(date.getTime())) return String(value)
    return dateFnsFormat(date, formatStr)
  } catch {
    return String(value)
  }
}

/**
 * Format a datetime value
 */
export function formatDateTime(
  value: unknown,
  formatStr: string = "MMM d, yyyy HH:mm"
): string {
  return formatDate(value, formatStr)
}

/**
 * Format a currency value
 */
export function formatCurrency(
  value: unknown,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  if (value == null) return "—"
  const numValue = typeof value === "number" ? value : parseFloat(String(value))
  if (isNaN(numValue)) return String(value)
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(numValue)
  } catch {
    return `${currency} ${numValue.toFixed(2)}`
  }
}

/**
 * Format a number value
 */
export function formatNumber(
  value: unknown,
  decimals: number = 0,
  locale: string = "en-US"
): string {
  if (value == null) return "—"
  const numValue = typeof value === "number" ? value : parseFloat(String(value))
  if (isNaN(numValue)) return String(value)
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue)
}

/**
 * Format a percentage value
 */
export function formatPercentage(
  value: unknown,
  decimals: number = 1
): string {
  if (value == null) return "—"
  const numValue = typeof value === "number" ? value : parseFloat(String(value))
  if (isNaN(numValue)) return String(value)
  return `${numValue.toFixed(decimals)}%`
}

/**
 * Get the CSS classes for a status badge
 */
export function getStatusClasses(
  status: string,
  colorMap?: Record<string, string>
): string {
  const normalizedStatus = status.toLowerCase().trim()
  const mergedMap = { ...STATUS_COLOR_MAP, ...colorMap }

  return (
    mergedMap[normalizedStatus] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"
  )
}

/**
 * Format a cell value based on column format settings
 */
export function formatCellValue<T>(
  value: unknown,
  column: DataTableColumn<T>
): string {
  if (value == null) return "—"

  switch (column.format) {
    case "date":
      return formatDate(value, column.formatOptions?.dateFormat)
    case "datetime":
      return formatDateTime(value, column.formatOptions?.dateFormat)
    case "currency":
      return formatCurrency(
        value,
        column.formatOptions?.currency,
        column.formatOptions?.locale
      )
    case "number":
      return formatNumber(
        value,
        column.formatOptions?.decimals,
        column.formatOptions?.locale
      )
    case "percentage":
      return formatPercentage(value, column.formatOptions?.decimals)
    case "boolean":
      return value ? (column.formatOptions?.trueLabel || "Yes") : (column.formatOptions?.falseLabel || "No")
    default:
      return String(value)
  }
}

/**
 * Convert a value to a string for search/filter comparison
 */
export function valueToString(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "boolean") return value ? "true" : "false"
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}
