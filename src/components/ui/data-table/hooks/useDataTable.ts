"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import type {
  DataTableProps,
  DataTableColumn,
  SortState,
  FilterState,
  Density,
  FetchParams,
  ColumnState,
} from "../types"
import { DEFAULT_DENSITY, STORAGE_KEY_PREFIX } from "../constants"
import { getCellValue } from "../utils/formatters"
import { useDataTableSort } from "./useDataTableSort"
import { useDataTableSearch } from "./useDataTableSearch"
import { useDataTablePagination } from "./useDataTablePagination"
import { useDataTableFilter } from "./useDataTableFilter"
import { useDataTableSelection } from "./useDataTableSelection"
import { useDataTableColumns } from "./useDataTableColumns"

export function useDataTable<T extends Record<string, any>>(
  props: DataTableProps<T>
) {
  const {
    columns,
    data: clientData,
    serverSide = false,
    fetchData,
    fetchDeps = [],
    searchable = false,
    columnSearch = false,
    selectable = false,
    pagination: paginationEnabled = true,
    filters: filtersEnabled = false,
    pageSize: initialPageSize = 25,
    pageSizeOptions,
    idField = "id",
    defaultDensity = DEFAULT_DENSITY,
    searchDebounce,
    multiSort = false,
    persistState = false,
    title = "data",
    onRowClick,
    onSelectionChange,
    onSortChange,
    onFilterChange,
    onSearchChange,
    onPageChange,
    onRefresh,
    loading: externalLoading,
  } = props

  // ─── Loading & Error ───
  const [isLoading, setIsLoading] = useState(serverSide ? true : false)
  const [error, setError] = useState<string | null>(null)
  const [serverData, setServerData] = useState<T[]>([])
  const [serverTotal, setServerTotal] = useState(0)

  // ─── Density ───
  const [density, setDensity] = useState<Density>(defaultDensity)

  // ─── Persistence key ───
  const persistKey = useMemo(() => {
    if (!persistState) return null
    if (typeof persistState === "string") return persistState
    return `${STORAGE_KEY_PREFIX}${title.replace(/\s+/g, "_").toLowerCase()}`
  }, [persistState, title])

  // Load persisted state
  const loadPersistedState = useCallback(() => {
    if (!persistKey || typeof window === "undefined") return null
    try {
      const stored = localStorage.getItem(persistKey)
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
    return null
  }, [persistKey])

  const persisted = useRef(loadPersistedState())

  // ─── Compose sub-hooks ───

  const {
    sortState,
    handleSort,
    clearSort,
    getSortDirection,
    getSortIndex,
    sortData,
  } = useDataTableSort({
    multiSort,
    onSortChange,
    initialSort: persisted.current?.sort ?? [],
  })

  const {
    globalSearch,
    setGlobalSearch,
    debouncedGlobalSearch,
    columnSearchValues,
    setColumnSearchValue,
    debouncedColumnSearch,
    clearSearch,
    searchData,
  } = useDataTableSearch({
    debounceMs: searchDebounce,
    onSearchChange,
    initialSearch: persisted.current?.search ?? "",
    initialColumnSearch: persisted.current?.columnSearch ?? {},
  })

  const {
    filterState,
    setFilterState,
    addFilter,
    removeFilter,
    clearFilters,
    activeFilterCount,
    hasActiveFilters,
    getFilterForColumn,
    filterData,
  } = useDataTableFilter({
    onFilterChange,
    initialFilters: persisted.current?.filters ?? [],
  })

  const {
    paginationState,
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
    pageSizeOptions: resolvedPageSizeOptions,
  } = useDataTablePagination({
    initialPage: persisted.current?.page ?? 1,
    initialPageSize: persisted.current?.pageSize ?? initialPageSize,
    pageSizeOptions,
    total: serverSide ? serverTotal : 0,
    onPageChange,
  })

  const selectionMode = selectable === true ? "multiple" : selectable === false ? undefined : selectable

  const {
    selectedRows,
    toggleRow,
    toggleAllOnPage,
    toggleAllFiltered,
    clearSelection,
    isRowSelected,
    selectionCount,
    checkPageSelection,
  } = useDataTableSelection({
    mode: selectionMode ?? "multiple",
    onSelectionChange: onSelectionChange
      ? (ids) => {
        const allData = serverSide ? serverData : (clientData ?? [])
        const selected = allData.filter((row) => ids.includes(getRowId(row)))
        onSelectionChange(selected)
      }
      : undefined,
  })

  const {
    columnStates,
    visibleColumns,
    hideableColumns,
    toggleColumnVisibility,
    setColumnOrder,
    setColumnWidth,
    resetColumns,
    isColumnVisible,
    visibleColumnCount,
    totalColumnCount,
  } = useDataTableColumns({
    columns,
    initialColumnStates: persisted.current?.columns ?? undefined,
  })

  // ─── Row ID accessor ───
  const getRowId = useCallback(
    (row: T): string => {
      const value = (row as Record<string, any>)[idField]
      return value != null ? String(value) : ""
    },
    [idField]
  )

  // ─── Column value accessor ───
  const getValueForColumn = useCallback(
    (row: T, columnId: string): unknown => {
      const column = columns.find((c) => c.id === columnId)
      if (!column) return (row as Record<string, any>)[columnId]
      return getCellValue(row, column)
    },
    [columns]
  )

  // ─── Searchable column IDs ───
  const searchableColumnIds = useMemo(
    () => columns.filter((c) => c.searchable).map((c) => c.id),
    [columns]
  )

  // ─── Client-side data pipeline ───
  const processedData = useMemo(() => {
    if (serverSide) return serverData

    let data = clientData ?? []

    // Search
    if (searchable || columnSearch) {
      data = searchData(data, searchableColumnIds, getValueForColumn)
    }

    // Filter
    if (filtersEnabled) {
      data = filterData(data, getValueForColumn)
    }

    // Sort
    data = sortData(data, getValueForColumn)

    return data
  }, [
    serverSide,
    serverData,
    clientData,
    searchable,
    columnSearch,
    searchData,
    searchableColumnIds,
    getValueForColumn,
    filtersEnabled,
    filterData,
    sortData,
  ])

  // Update pagination total for client-side
  useEffect(() => {
    if (!serverSide) {
      setTotal(processedData.length)
    }
  }, [processedData.length, serverSide, setTotal])

  // ─── Paginated data ───
  const paginatedData = useMemo(() => {
    if (serverSide) return serverData
    if (!paginationEnabled) return processedData
    return paginateData(processedData)
  }, [serverSide, serverData, paginationEnabled, processedData, paginateData])

  // ─── Server-side fetching ───
  const fetchIdRef = useRef(0)

  const doFetch = useCallback(async () => {
    if (!serverSide || !fetchData) return

    const fetchId = ++fetchIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      const params: FetchParams = {
        page: paginationState.page,
        pageSize: paginationState.pageSize,
        search: debouncedGlobalSearch,
        filters: filterState,
        sort: sortState,
        columnSearch: debouncedColumnSearch,
      }

      const response = await fetchData(params)

      // Only update if this is still the latest request
      if (fetchId === fetchIdRef.current) {
        setServerData(response.data)
        setServerTotal(response.total)
        setTotal(response.total)
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [
    serverSide,
    fetchData,
    paginationState.page,
    paginationState.pageSize,
    debouncedGlobalSearch,
    filterState,
    sortState,
    debouncedColumnSearch,
    setTotal,
  ])

  // Trigger fetch on dependency changes
  useEffect(() => {
    if (serverSide) {
      doFetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doFetch, ...fetchDeps])

  // Reset page on search/filter change (client-side)
  useEffect(() => {
    if (!serverSide) {
      resetPage()
    }
  }, [debouncedGlobalSearch, filterState, serverSide, resetPage])

  // ─── Refresh ───
  const refreshData = useCallback(async () => {
    if (onRefresh) {
      await onRefresh()
    }
    if (serverSide) {
      await doFetch()
    }
  }, [onRefresh, serverSide, doFetch])

  // ─── Persist state ───
  useEffect(() => {
    if (!persistKey || typeof window === "undefined") return

    const state = {
      sort: sortState,
      search: globalSearch,
      columnSearch: columnSearchValues,
      filters: filterState,
      page: paginationState.page,
      pageSize: paginationState.pageSize,
      columns: columnStates,
      density,
    }

    try {
      localStorage.setItem(persistKey, JSON.stringify(state))
    } catch {
      // ignore quota errors
    }
  }, [
    persistKey,
    sortState,
    globalSearch,
    columnSearchValues,
    filterState,
    paginationState,
    columnStates,
    density,
  ])

  // ─── Page IDs (for selection) ───
  const pageIds = useMemo(
    () => paginatedData.map(getRowId),
    [paginatedData, getRowId]
  )

  const filteredIds = useMemo(
    () => processedData.map(getRowId),
    [processedData, getRowId]
  )

  const { allSelected: isAllOnPageSelected, someSelected: isSomeOnPageSelected } =
    checkPageSelection(pageIds)

  // Selected row data
  const selectedRowData = useMemo(() => {
    const allData = serverSide ? serverData : (clientData ?? [])
    return allData.filter((row) => selectedRows.has(getRowId(row)))
  }, [selectedRows, serverSide, serverData, clientData, getRowId])

  // ─── Effective loading state ───
  const effectiveLoading = externalLoading ?? isLoading

  return {
    // Config
    columns,
    props,
    visibleColumns,

    // Data
    data: clientData ?? [],
    processedData,
    paginatedData,
    isLoading: effectiveLoading,
    error,

    // Sort
    sortState,
    handleSort,
    clearSort,
    getSortDirection,
    getSortIndex,

    // Search
    globalSearch,
    setGlobalSearch,
    columnSearchValues,
    setColumnSearchValue,
    clearSearch,

    // Filter
    filterState,
    setFilterState,
    addFilter,
    removeFilter,
    clearFilters,
    activeFilterCount,
    hasActiveFilters,
    getFilterForColumn,

    // Selection
    selectedRows,
    selectedRowData,
    toggleRow: (id: string, shiftKey?: boolean) =>
      toggleRow(id, shiftKey, pageIds),
    toggleAllOnPage: () => toggleAllOnPage(pageIds),
    toggleAllFiltered: () => toggleAllFiltered(filteredIds),
    clearSelection,
    isRowSelected,
    isAllOnPageSelected,
    isSomeOnPageSelected,
    selectionCount,

    // Pagination
    paginationState,
    setPage,
    setPageSize,
    totalPages,
    startItem,
    endItem,
    goToFirst,
    goToLast,
    goToNext,
    goToPrevious,
    canGoNext,
    canGoPrevious,
    pageNumbers,
    pageSizeOptions: resolvedPageSizeOptions,

    // Columns
    columnStates,
    hideableColumns,
    toggleColumnVisibility,
    resetColumns,
    setColumnOrder,
    setColumnWidth,
    isColumnVisible,
    visibleColumnCount,
    totalColumnCount,

    // Density
    density,
    setDensity,

    // Actions
    refreshData,
    getRowId,
    getValueForColumn,
    searchableColumnIds,
  }
}

export type UseDataTableReturn<T extends Record<string, any>> = ReturnType<typeof useDataTable<T>>
