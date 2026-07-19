"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { DEFAULT_SEARCH_DEBOUNCE_MS } from "../constants"

interface UseDataTableSearchOptions {
  debounceMs?: number
  onSearchChange?: (value: string) => void
  initialSearch?: string
  initialColumnSearch?: Record<string, string>
}

export function useDataTableSearch({
  debounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
  onSearchChange,
  initialSearch = "",
  initialColumnSearch = {},
}: UseDataTableSearchOptions = {}) {
  // Global search
  const [globalSearch, setGlobalSearchRaw] = useState(initialSearch)
  const [debouncedGlobalSearch, setDebouncedGlobalSearch] = useState(initialSearch)
  const globalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Column search
  const [columnSearchValues, setColumnSearchValues] = useState<Record<string, string>>(
    initialColumnSearch
  )
  const [debouncedColumnSearch, setDebouncedColumnSearch] =
    useState<Record<string, string>>(initialColumnSearch)
  const columnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced global search
  const setGlobalSearch = useCallback(
    (value: string) => {
      setGlobalSearchRaw(value)

      if (globalTimerRef.current) {
        clearTimeout(globalTimerRef.current)
      }

      globalTimerRef.current = setTimeout(() => {
        setDebouncedGlobalSearch(value)
        onSearchChange?.(value)
      }, debounceMs)
    },
    [debounceMs, onSearchChange]
  )

  // Column search
  const setColumnSearchValue = useCallback(
    (columnId: string, value: string) => {
      setColumnSearchValues((prev) => ({ ...prev, [columnId]: value }))

      if (columnTimerRef.current) {
        clearTimeout(columnTimerRef.current)
      }

      columnTimerRef.current = setTimeout(() => {
        setDebouncedColumnSearch((prev) => ({ ...prev, [columnId]: value }))
      }, debounceMs)
    },
    [debounceMs]
  )

  // Clear all search
  const clearSearch = useCallback(() => {
    setGlobalSearchRaw("")
    setDebouncedGlobalSearch("")
    setColumnSearchValues({})
    setDebouncedColumnSearch({})
    onSearchChange?.("")
  }, [onSearchChange])

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (globalTimerRef.current) clearTimeout(globalTimerRef.current)
      if (columnTimerRef.current) clearTimeout(columnTimerRef.current)
    }
  }, [])

  // Active column search count
  const activeColumnSearchCount = useMemo(
    () =>
      Object.values(debouncedColumnSearch).filter(
        (v) => v != null && v !== ""
      ).length,
    [debouncedColumnSearch]
  )

  /**
   * Filter data client-side based on search values
   */
  const searchData = useCallback(
    <T,>(
      data: T[],
      searchableColumnIds: string[],
      getValueForColumn: (row: T, columnId: string) => unknown
    ): T[] => {
      let filtered = data

      // Global search
      if (debouncedGlobalSearch) {
        const searchLower = debouncedGlobalSearch.toLowerCase()
        filtered = filtered.filter((row) =>
          searchableColumnIds.some((colId) => {
            const value = getValueForColumn(row, colId)
            if (value == null) return false
            return String(value).toLowerCase().includes(searchLower)
          })
        )
      }

      // Column search
      const activeColumnFilters = Object.entries(debouncedColumnSearch).filter(
        ([, v]) => v != null && v !== ""
      )

      if (activeColumnFilters.length > 0) {
        filtered = filtered.filter((row) =>
          activeColumnFilters.every(([colId, searchValue]) => {
            const value = getValueForColumn(row, colId)
            if (value == null) return false
            
            // Check if it's our JSON date filter payload
            if (searchValue.startsWith('{"mode":')) {
              try {
                const parsed = JSON.parse(searchValue);
                const cellDate = new Date(String(value));
                if (isNaN(cellDate.getTime())) return false;
                
                // Remove time from cell date for comparison
                const cellDay = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate()).getTime();

                if (parsed.mode === "single" && parsed.single) {
                  const s = new Date(parsed.single);
                  return cellDay === new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
                }
                
                if (parsed.mode === "multiple" && parsed.multiple && parsed.multiple.length > 0) {
                  return parsed.multiple.some((mStr: string) => {
                    const m = new Date(mStr);
                    return cellDay === new Date(m.getFullYear(), m.getMonth(), m.getDate()).getTime();
                  });
                }
                
                if (parsed.mode === "range" && parsed.range) {
                  const from = parsed.range.from ? new Date(parsed.range.from) : null;
                  const to = parsed.range.to ? new Date(parsed.range.to) : null;
                  
                  if (from && to) {
                    const fDay = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
                    const tDay = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
                    return cellDay >= fDay && cellDay <= tDay;
                  } else if (from) {
                    const fDay = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
                    return cellDay >= fDay;
                  } else if (to) {
                    const tDay = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
                    return cellDay <= tDay;
                  }
                }
                return true;
              } catch (e) {
                // Not valid JSON or date parsing error, fallback to normal search
              }
            }

            // Multi-select array payload
            if (searchValue.startsWith('["') && searchValue.endsWith('"]')) {
              try {
                const parsed = JSON.parse(searchValue);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  return parsed.some((v: string) => String(value).toLowerCase() === String(v).toLowerCase());
                }
              } catch (e) {
                // Not a valid JSON array, fallback
              }
            }

            // Normal text search
            return String(value)
              .toLowerCase()
              .includes(searchValue.toLowerCase())
          })
        )
      }

      return filtered
    },
    [debouncedGlobalSearch, debouncedColumnSearch]
  )

  return {
    globalSearch,
    setGlobalSearch,
    debouncedGlobalSearch,
    columnSearchValues,
    setColumnSearchValue,
    debouncedColumnSearch,
    clearSearch,
    searchData,
    activeColumnSearchCount,
  }
}
