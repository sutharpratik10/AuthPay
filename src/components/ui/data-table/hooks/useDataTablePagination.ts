"use client"

import { useState, useCallback, useMemo } from "react"
import type { PaginationState } from "../types"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "../constants"

interface UseDataTablePaginationOptions {
  initialPage?: number
  initialPageSize?: number
  pageSizeOptions?: number[]
  total?: number
  onPageChange?: (page: number, pageSize: number) => void
}

export function useDataTablePagination({
  initialPage = 1,
  initialPageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = [...DEFAULT_PAGE_SIZE_OPTIONS],
  total = 0,
  onPageChange,
}: UseDataTablePaginationOptions = {}) {
  const [paginationState, setPaginationState] = useState<PaginationState>({
    page: initialPage,
    pageSize: initialPageSize,
    total,
  })

  // Update total when it changes externally
  const setTotal = useCallback((newTotal: number) => {
    setPaginationState((prev) => ({ ...prev, total: newTotal }))
  }, [])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(paginationState.total / paginationState.pageSize)),
    [paginationState.total, paginationState.pageSize]
  )

  const startItem = useMemo(
    () =>
      paginationState.total === 0
        ? 0
        : Math.min(
            (paginationState.page - 1) * paginationState.pageSize + 1,
            paginationState.total
          ),
    [paginationState]
  )

  const endItem = useMemo(
    () =>
      Math.min(
        paginationState.page * paginationState.pageSize,
        paginationState.total
      ),
    [paginationState]
  )

  const setPage = useCallback(
    (page: number) => {
      const clampedPage = Math.max(1, Math.min(page, totalPages))
      setPaginationState((prev) => {
        onPageChange?.(clampedPage, prev.pageSize)
        return { ...prev, page: clampedPage }
      })
    },
    [totalPages, onPageChange]
  )

  const setPageSize = useCallback(
    (pageSize: number) => {
      setPaginationState((prev) => {
        // Reset to page 1 when page size changes
        onPageChange?.(1, pageSize)
        return { ...prev, pageSize, page: 1 }
      })
    },
    [onPageChange]
  )

  const goToFirst = useCallback(() => setPage(1), [setPage])
  const goToLast = useCallback(() => setPage(totalPages), [setPage, totalPages])
  const goToNext = useCallback(
    () => setPage(paginationState.page + 1),
    [setPage, paginationState.page]
  )
  const goToPrevious = useCallback(
    () => setPage(paginationState.page - 1),
    [setPage, paginationState.page]
  )

  /** Reset to page 1 (call when search/filter changes) */
  const resetPage = useCallback(() => {
    setPaginationState((prev) => ({ ...prev, page: 1 }))
  }, [])

  const canGoNext = paginationState.page < totalPages
  const canGoPrevious = paginationState.page > 1

  /**
   * Paginate data client-side
   */
  const paginateData = useCallback(
    <T,>(data: T[]): T[] => {
      const start = (paginationState.page - 1) * paginationState.pageSize
      return data.slice(start, start + paginationState.pageSize)
    },
    [paginationState.page, paginationState.pageSize]
  )

  /**
   * Generate page number array for UI
   */
  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = []
    const current = paginationState.page
    const total = totalPages

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
      return pages
    }

    // Always show first page
    pages.push(1)

    if (current > 3) {
      pages.push("ellipsis")
    }

    // Show pages around current
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < total - 2) {
      pages.push("ellipsis")
    }

    // Always show last page
    if (total > 1) {
      pages.push(total)
    }

    return pages
  }, [paginationState.page, totalPages])

  return {
    paginationState,
    setPaginationState,
    totalPages,
    startItem,
    endItem,
    setPage,
    setPageSize,
    setTotal,
    goToFirst,
    goToLast,
    goToNext,
    goToPrevious,
    resetPage,
    canGoNext,
    canGoPrevious,
    paginateData,
    pageNumbers,
    pageSizeOptions,
  }
}
