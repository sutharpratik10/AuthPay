import type { FilterOperator, FilterState } from "../types"
import { valueToString } from "./formatters"

/**
 * Apply a single filter to a value
 */
export function applyFilter(
  value: unknown,
  filter: FilterState
): boolean {
  const { operator, value: filterValue, valueTo } = filter

  switch (operator) {
    // ─── Text Operators ───
    case "contains":
      return valueToString(value)
        .toLowerCase()
        .includes(valueToString(filterValue).toLowerCase())

    case "equals":
      return (
        valueToString(value).toLowerCase() ===
        valueToString(filterValue).toLowerCase()
      )

    case "not_equals":
      return (
        valueToString(value).toLowerCase() !==
        valueToString(filterValue).toLowerCase()
      )

    case "starts_with":
      return valueToString(value)
        .toLowerCase()
        .startsWith(valueToString(filterValue).toLowerCase())

    case "ends_with":
      return valueToString(value)
        .toLowerCase()
        .endsWith(valueToString(filterValue).toLowerCase())

    // ─── Numeric Operators ───
    case "eq": {
      const numA = toNumber(value)
      const numB = toNumber(filterValue)
      if (numA == null || numB == null) return false
      return numA === numB
    }

    case "gt": {
      const numA = toNumber(value)
      const numB = toNumber(filterValue)
      if (numA == null || numB == null) return false
      return numA > numB
    }

    case "gte": {
      const numA = toNumber(value)
      const numB = toNumber(filterValue)
      if (numA == null || numB == null) return false
      return numA >= numB
    }

    case "lt": {
      const numA = toNumber(value)
      const numB = toNumber(filterValue)
      if (numA == null || numB == null) return false
      return numA < numB
    }

    case "lte": {
      const numA = toNumber(value)
      const numB = toNumber(filterValue)
      if (numA == null || numB == null) return false
      return numA <= numB
    }

    case "between": {
      const numVal = toNumber(value)
      const numMin = toNumber(filterValue)
      const numMax = toNumber(valueTo)
      if (numVal == null || numMin == null || numMax == null) return false
      return numVal >= numMin && numVal <= numMax
    }

    // ─── Date Operators ───
    case "before": {
      const dateA = toDate(value)
      const dateB = toDate(filterValue)
      if (!dateA || !dateB) return false
      return dateA < dateB
    }

    case "after": {
      const dateA = toDate(value)
      const dateB = toDate(filterValue)
      if (!dateA || !dateB) return false
      return dateA > dateB
    }

    case "date_between": {
      const dateVal = toDate(value)
      const dateMin = toDate(filterValue)
      const dateMax = toDate(valueTo)
      if (!dateVal || !dateMin || !dateMax) return false
      return dateVal >= dateMin && dateVal <= dateMax
    }

    // ─── Set Operators ───
    case "in": {
      const arr = Array.isArray(filterValue) ? filterValue : [filterValue]
      const strValue = valueToString(value).toLowerCase()
      return arr.some(
        (item) => valueToString(item).toLowerCase() === strValue
      )
    }

    case "not_in": {
      const arr = Array.isArray(filterValue) ? filterValue : [filterValue]
      const strValue = valueToString(value).toLowerCase()
      return !arr.some(
        (item) => valueToString(item).toLowerCase() === strValue
      )
    }

    default:
      return true
  }
}

/**
 * Apply all filters to a data row
 */
export function applyFilters<T>(
  row: T,
  filters: FilterState[],
  getValueForColumn: (row: T, columnId: string) => unknown
): boolean {
  return filters.every((filter) => {
    const value = getValueForColumn(row, filter.id)
    return applyFilter(value, filter)
  })
}

/**
 * Get the default operator for a filter type
 */
export function getDefaultOperator(
  filterType: string
): FilterOperator {
  switch (filterType) {
    case "text":
      return "contains"
    case "number":
      return "eq"
    case "date":
      return "after"
    case "select":
    case "multi-select":
      return "in"
    case "boolean":
      return "eq"
    default:
      return "contains"
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function toNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === "number") return value
  const parsed = parseFloat(String(value))
  return isNaN(parsed) ? null : parsed
}

function toDate(value: unknown): Date | null {
  if (value == null) return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  const parsed = new Date(String(value))
  return isNaN(parsed.getTime()) ? null : parsed
}
