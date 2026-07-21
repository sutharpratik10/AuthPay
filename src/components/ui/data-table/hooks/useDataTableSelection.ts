"use client"

import { useState, useCallback, useMemo, useRef } from "react"

interface UseDataTableSelectionOptions {
  mode?: "single" | "multiple"
  onSelectionChange?: (selectedIds: string[]) => void
}

export function useDataTableSelection({
  mode = "multiple",
  onSelectionChange,
}: UseDataTableSelectionOptions = {}) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const lastClickedRef = useRef<string | null>(null)

  const toggleRow = useCallback(
    (id: string, shiftKey?: boolean, allVisibleIds?: string[]) => {
      setSelectedRows((prev) => {
        const next = new Set(prev)

        if (mode === "single") {
          // Single select: clear others and toggle
          if (next.has(id)) {
            next.clear()
          } else {
            next.clear()
            next.add(id)
          }
        } else {
          // Multi select with shift support
          if (shiftKey && lastClickedRef.current && allVisibleIds) {
            const lastIndex = allVisibleIds.indexOf(lastClickedRef.current)
            const currentIndex = allVisibleIds.indexOf(id)
            if (lastIndex >= 0 && currentIndex >= 0) {
              const start = Math.min(lastIndex, currentIndex)
              const end = Math.max(lastIndex, currentIndex)
              for (let i = start; i <= end; i++) {
                next.add(allVisibleIds[i])
              }
            }
          } else if (next.has(id)) {
            next.delete(id)
          } else {
            next.add(id)
          }
        }

        lastClickedRef.current = id
        onSelectionChange?.(Array.from(next))
        return next
      })
    },
    [mode, onSelectionChange]
  )

  const toggleAllOnPage = useCallback(
    (pageIds: string[]) => {
      if (mode === "single") return

      setSelectedRows((prev) => {
        const next = new Set(prev)
        const allSelected = pageIds.every((id) => next.has(id))

        if (allSelected) {
          // Deselect all on page
          pageIds.forEach((id) => next.delete(id))
        } else {
          // Select all on page
          pageIds.forEach((id) => next.add(id))
        }

        onSelectionChange?.(Array.from(next))
        return next
      })
    },
    [mode, onSelectionChange]
  )

  const toggleAllFiltered = useCallback(
    (filteredIds: string[]) => {
      if (mode === "single") return

      setSelectedRows((prev) => {
        const next = new Set(prev)
        const allSelected = filteredIds.every((id) => next.has(id))

        if (allSelected) {
          filteredIds.forEach((id) => next.delete(id))
        } else {
          filteredIds.forEach((id) => next.add(id))
        }

        onSelectionChange?.(Array.from(next))
        return next
      })
    },
    [mode, onSelectionChange]
  )

  const selectAll = useCallback(
    (allIds: string[]) => {
      if (mode === "single") return

      setSelectedRows(() => {
        const next = new Set(allIds)
        onSelectionChange?.(allIds)
        return next
      })
    },
    [mode, onSelectionChange]
  )

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set())
    lastClickedRef.current = null
    onSelectionChange?.([])
  }, [onSelectionChange])

  const isRowSelected = useCallback(
    (id: string): boolean => selectedRows.has(id),
    [selectedRows]
  )

  const selectionCount = useMemo(() => selectedRows.size, [selectedRows])

  const checkPageSelection = useCallback(
    (pageIds: string[]): { allSelected: boolean; someSelected: boolean } => {
      if (pageIds.length === 0) return { allSelected: false, someSelected: false }
      const allSelected = pageIds.every((id) => selectedRows.has(id))
      const someSelected = !allSelected && pageIds.some((id) => selectedRows.has(id))
      return { allSelected, someSelected }
    },
    [selectedRows]
  )

  return {
    selectedRows,
    setSelectedRows,
    toggleRow,
    toggleAllOnPage,
    toggleAllFiltered,
    selectAll,
    clearSelection,
    isRowSelected,
    selectionCount,
    checkPageSelection,
  }
}
