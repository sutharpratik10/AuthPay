"use client"

import { useState, useCallback } from "react"
import type { SortState } from "../types"

interface UseDataTableSortOptions {
  multiSort?: boolean
  onSortChange?: (sort: SortState[]) => void
  initialSort?: SortState[]
}

export function useDataTableSort({
  multiSort = false,
  onSortChange,
  initialSort = [],
}: UseDataTableSortOptions = {}) {
  const [sortState, setSortState] = useState<SortState[]>(initialSort)

  const handleSort = useCallback(
    (columnId: string) => {
      setSortState((prev) => {
        let next: SortState[]

        const existing = prev.find((s) => s.id === columnId)

        if (!existing) {
          // New sort: start ascending
          const newSort: SortState = { id: columnId, direction: "asc" }
          next = multiSort ? [...prev, newSort] : [newSort]
        } else if (existing.direction === "asc") {
          // Toggle to descending
          next = prev.map((s) =>
            s.id === columnId ? { ...s, direction: "desc" as const } : s
          )
        } else {
          // Remove sort (was desc → remove)
          next = prev.filter((s) => s.id !== columnId)
        }

        onSortChange?.(next)
        return next
      })
    },
    [multiSort, onSortChange]
  )

  const clearSort = useCallback(() => {
    setSortState([])
    onSortChange?.([])
  }, [onSortChange])

  const getSortDirection = useCallback(
    (columnId: string): "asc" | "desc" | null => {
      const sort = sortState.find((s) => s.id === columnId)
      return sort?.direction ?? null
    },
    [sortState]
  )

  const getSortIndex = useCallback(
    (columnId: string): number | null => {
      if (!multiSort || sortState.length <= 1) return null
      const index = sortState.findIndex((s) => s.id === columnId)
      return index >= 0 ? index + 1 : null
    },
    [multiSort, sortState]
  )

  /**
   * Sort data client-side based on current sort state
   */
  const sortData = useCallback(
    <T,>(data: T[], getValueForColumn: (row: T, columnId: string) => unknown): T[] => {
      if (sortState.length === 0) return data

      return [...data].sort((a, b) => {
        for (const sort of sortState) {
          const aValue = getValueForColumn(a, sort.id)
          const bValue = getValueForColumn(b, sort.id)
          const comparison = compareValues(aValue, bValue)

          if (comparison !== 0) {
            return sort.direction === "asc" ? comparison : -comparison
          }
        }
        return 0
      })
    },
    [sortState]
  )

  return {
    sortState,
    setSortState,
    handleSort,
    clearSort,
    getSortDirection,
    getSortIndex,
    sortData,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function compareValues(a: unknown, b: unknown): number {
  // Handle null/undefined
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1

  // Numbers
  if (typeof a === "number" && typeof b === "number") {
    return a - b
  }

  // Dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime()
  }

  // Try to parse as dates
  const dateA = tryParseDate(a)
  const dateB = tryParseDate(b)
  if (dateA && dateB) {
    return dateA.getTime() - dateB.getTime()
  }

  // Booleans
  if (typeof a === "boolean" && typeof b === "boolean") {
    return a === b ? 0 : a ? 1 : -1
  }

  // Try numeric comparison
  const numA = parseFloat(String(a))
  const numB = parseFloat(String(b))
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB
  }

  // String comparison
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

function tryParseDate(value: unknown): Date | null {
  if (value instanceof Date) return value
  if (typeof value !== "string") return null
  // Quick check to avoid parsing random strings as dates
  if (!/^\d{4}[-/]/.test(value) && !/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value))
    return null
  const date = new Date(value)
  return isNaN(date.getTime()) ? null : date
}
