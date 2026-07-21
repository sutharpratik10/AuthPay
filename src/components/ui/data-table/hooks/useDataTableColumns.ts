"use client"

import { useState, useCallback, useMemo } from "react"
import type { ColumnState, DataTableColumn } from "../types"

interface UseDataTableColumnsOptions<T> {
  columns: DataTableColumn<T>[]
  onColumnVisibilityChange?: (columns: ColumnState[]) => void
  initialColumnStates?: ColumnState[]
}

export function useDataTableColumns<T>({
  columns,
  onColumnVisibilityChange,
  initialColumnStates,
}: UseDataTableColumnsOptions<T>) {
  // Build initial column states from column definitions or provided states
  const defaultColumnStates = useMemo(
    (): ColumnState[] =>
      columns.map((col, index) => ({
        id: col.id,
        visible: col.visible !== false,
        order: index,
        width: typeof col.width === "number" ? col.width : undefined,
      })),
    [columns]
  )

  const [columnStates, setColumnStates] = useState<ColumnState[]>(
    initialColumnStates ?? defaultColumnStates
  )

  // Compute visible columns in the correct order
  const visibleColumns = useMemo(() => {
    const stateMap = new Map(columnStates.map((s) => [s.id, s]))

    return columns
      .filter((col) => {
        const state = stateMap.get(col.id)
        return state ? state.visible : col.visible !== false
      })
      .sort((a, b) => {
        const stateA = stateMap.get(a.id)
        const stateB = stateMap.get(b.id)
        const orderA = stateA?.order ?? columns.indexOf(a)
        const orderB = stateB?.order ?? columns.indexOf(b)
        return orderA - orderB
      })
  }, [columns, columnStates])

  // Hideable columns (for the visibility panel)
  const hideableColumns = useMemo(
    () => columns.filter((col) => col.hideable !== false),
    [columns]
  )

  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      setColumnStates((prev) => {
        const next = prev.map((s) =>
          s.id === columnId ? { ...s, visible: !s.visible } : s
        )
        onColumnVisibilityChange?.(next)
        return next
      })
    },
    [onColumnVisibilityChange]
  )

  const setColumnVisible = useCallback(
    (columnId: string, visible: boolean) => {
      setColumnStates((prev) => {
        const next = prev.map((s) =>
          s.id === columnId ? { ...s, visible } : s
        )
        onColumnVisibilityChange?.(next)
        return next
      })
    },
    [onColumnVisibilityChange]
  )

  const setColumnOrder = useCallback(
    (columnId: string, newOrder: number) => {
      setColumnStates((prev) => {
        const next = [...prev]
        const currentIndex = next.findIndex((s) => s.id === columnId)
        if (currentIndex < 0) return prev

        // Remove item and re-insert at new position
        const [item] = next.splice(currentIndex, 1)
        next.splice(newOrder, 0, item)

        // Update order values
        const reordered = next.map((s, i) => ({ ...s, order: i }))
        onColumnVisibilityChange?.(reordered)
        return reordered
      })
    },
    [onColumnVisibilityChange]
  )

  const setColumnWidth = useCallback(
    (columnId: string, width: number) => {
      setColumnStates((prev) =>
        prev.map((s) => (s.id === columnId ? { ...s, width } : s))
      )
    },
    []
  )

  const resetColumns = useCallback(() => {
    setColumnStates(defaultColumnStates)
    onColumnVisibilityChange?.(defaultColumnStates)
  }, [defaultColumnStates, onColumnVisibilityChange])

  const isColumnVisible = useCallback(
    (columnId: string): boolean => {
      const state = columnStates.find((s) => s.id === columnId)
      return state ? state.visible : true
    },
    [columnStates]
  )

  const visibleColumnCount = useMemo(
    () => columnStates.filter((s) => s.visible).length,
    [columnStates]
  )

  const totalColumnCount = columns.length

  return {
    columnStates,
    setColumnStates,
    visibleColumns,
    hideableColumns,
    toggleColumnVisibility,
    setColumnVisible,
    setColumnOrder,
    setColumnWidth,
    resetColumns,
    isColumnVisible,
    visibleColumnCount,
    totalColumnCount,
  }
}
