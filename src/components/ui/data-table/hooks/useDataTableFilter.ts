"use client"

import { useState, useCallback, useMemo } from "react"
import type { FilterState } from "../types"
import { applyFilters } from "../utils/filter-utils"

interface UseDataTableFilterOptions {
  onFilterChange?: (filters: FilterState[]) => void
  initialFilters?: FilterState[]
}

export function useDataTableFilter({
  onFilterChange,
  initialFilters = [],
}: UseDataTableFilterOptions = {}) {
  const [filterState, setFilterStateInternal] = useState<FilterState[]>(initialFilters)

  const setFilterState = useCallback(
    (filters: FilterState[]) => {
      setFilterStateInternal(filters)
      onFilterChange?.(filters)
    },
    [onFilterChange]
  )

  const addFilter = useCallback(
    (filter: FilterState) => {
      setFilterStateInternal((prev) => {
        // Replace existing filter for same column, or add new
        const existing = prev.findIndex((f) => f.id === filter.id)
        let next: FilterState[]
        if (existing >= 0) {
          next = [...prev]
          next[existing] = filter
        } else {
          next = [...prev, filter]
        }
        onFilterChange?.(next)
        return next
      })
    },
    [onFilterChange]
  )

  const updateFilter = useCallback(
    (columnId: string, updates: Partial<FilterState>) => {
      setFilterStateInternal((prev) => {
        const next = prev.map((f) =>
          f.id === columnId ? { ...f, ...updates } : f
        )
        onFilterChange?.(next)
        return next
      })
    },
    [onFilterChange]
  )

  const removeFilter = useCallback(
    (columnId: string) => {
      setFilterStateInternal((prev) => {
        const next = prev.filter((f) => f.id !== columnId)
        onFilterChange?.(next)
        return next
      })
    },
    [onFilterChange]
  )

  const clearFilters = useCallback(() => {
    setFilterStateInternal([])
    onFilterChange?.([])
  }, [onFilterChange])

  const activeFilterCount = useMemo(() => filterState.length, [filterState])

  const hasActiveFilters = activeFilterCount > 0

  const getFilterForColumn = useCallback(
    (columnId: string): FilterState | undefined => {
      return filterState.find((f) => f.id === columnId)
    },
    [filterState]
  )

  /**
   * Filter data client-side based on current filter state
   */
  const filterData = useCallback(
    <T,>(
      data: T[],
      getValueForColumn: (row: T, columnId: string) => unknown
    ): T[] => {
      if (filterState.length === 0) return data
      return data.filter((row) =>
        applyFilters(row, filterState, getValueForColumn)
      )
    },
    [filterState]
  )

  return {
    filterState,
    setFilterState,
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    activeFilterCount,
    hasActiveFilters,
    getFilterForColumn,
    filterData,
  }
}
