"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"

// ─── Core Column Definition ─────────────────────────────────────────

export type FilterOperator =
  // Text
  | "contains"
  | "equals"
  | "not_equals"
  | "starts_with"
  | "ends_with"
  // Numeric
  | "eq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  // Date
  | "before"
  | "after"
  | "date_between"
  // Set
  | "in"
  | "not_in"

export type FilterType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "multi-select"
  | "boolean"

export type CellFormat =
  | "date"
  | "datetime"
  | "currency"
  | "boolean"
  | "badge"
  | "avatar"
  | "status"
  | "percentage"
  | "number"

export type Density = "compact" | "normal" | "comfortable"

export type ExportFormat = "csv" | "json" | "clipboard"

export type SelectionMode = "single" | "multiple"

export interface FilterOption {
  label: string
  value: string
  icon?: LucideIcon
  color?: string
}

export interface CellRenderProps<T> {
  row: T
  value: unknown
  rowIndex: number
  column: DataTableColumn<T>
}

export interface DataTableColumn<T> {
  /** Unique column identifier */
  id: string
  /** Column header text or node */
  header: string | React.ReactNode
  /** Key to access value from data row */
  accessorKey?: string
  /** Function to derive value from a row */
  accessorFn?: (row: T) => unknown
  /** Custom cell renderer */
  cell?: (props: CellRenderProps<T>) => React.ReactNode

  // ─── Behavior ───
  sortable?: boolean
  searchable?: boolean
  filterable?: boolean
  hideable?: boolean
  resizable?: boolean

  // ─── Display ───
  width?: number | string
  minWidth?: number
  maxWidth?: number
  align?: "left" | "center" | "right"
  sticky?: "left" | "right"
  /** Priority for responsive hiding. Lower = hidden first on small screens */
  priority?: number

  // ─── Formatting ───
  format?: CellFormat
  formatOptions?: {
    dateFormat?: string
    currency?: string
    locale?: string
    trueLabel?: string
    falseLabel?: string
    colorMap?: Record<string, string>
    decimals?: number
  }
  copyOnClick?: boolean
  tooltip?: boolean | string | ((row: T) => string)

  // ─── Filter Configuration ───
  filterType?: FilterType
  filterOptions?: FilterOption[]
  filterOperators?: FilterOperator[]

  // ─── Meta ───
  enableColumnSearch?: boolean
  /** If false, column is never visible (but data is still accessible) */
  visible?: boolean
}

// ─── State Types ─────────────────────────────────────────────────────

export interface SortState {
  id: string
  direction: "asc" | "desc"
}

export interface FilterState {
  id: string
  operator: FilterOperator
  value: unknown
  /** For "between" operators */
  valueTo?: unknown
}

export interface ColumnState {
  id: string
  visible: boolean
  order: number
  width?: number
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

// ─── Server-side Types ───────────────────────────────────────────────

export interface FetchParams {
  page: number
  pageSize: number
  search: string
  filters: FilterState[]
  sort: SortState[]
  columnSearch: Record<string, string>
}

export interface FetchResponse<T> {
  data: T[]
  total: number
}

// ─── Action Types ────────────────────────────────────────────────────

export interface BulkAction<T> {
  label: string
  icon?: LucideIcon
  onClick: (rows: T[]) => void | Promise<void>
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  /** Disable this action when condition is true */
  disabled?: boolean | ((rows: T[]) => boolean)
  /** Hide this action when condition is true */
  hidden?: boolean | ((rows: T[]) => boolean)
}

export interface RowAction<T> {
  label: string
  icon?: LucideIcon
  onClick: (row: T) => void | Promise<void>
  variant?: "default" | "destructive"
  /** Permission key to check against DataTablePermissions */
  permission?: string
  /** Hide this action when condition is true */
  hidden?: boolean | ((row: T) => boolean)
  /** Disable this action when condition is true */
  disabled?: boolean | ((row: T) => boolean)
  /** Separator before this item */
  separator?: boolean
}

export interface DataTablePermissions {
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canExport?: boolean
  canBulkDelete?: boolean
  canCreate?: boolean
  [key: string]: boolean | undefined
}

// ─── Event Callback Types ────────────────────────────────────────────

export interface DataTableEvents<T> {
  onRowClick?: (row: T) => void
  onRowDoubleClick?: (row: T) => void
  onSelectionChange?: (rows: T[]) => void
  onSortChange?: (sort: SortState[]) => void
  onFilterChange?: (filters: FilterState[]) => void
  onSearchChange?: (search: string) => void
  onPageChange?: (page: number, pageSize: number) => void
  onRefresh?: () => void | Promise<void>
  onColumnVisibilityChange?: (columns: ColumnState[]) => void
}

// ─── Main DataTable Props ────────────────────────────────────────────

export interface DataTableProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[]
  /** Client-side data (mutually exclusive with fetchData) */
  data?: T[]

  // ─── Server-side ───
  /** Enable server-side mode */
  serverSide?: boolean
  /** Fetch function for server-side mode */
  fetchData?: (params: FetchParams) => Promise<FetchResponse<T>>
  /** Dependencies that trigger a re-fetch */
  fetchDeps?: unknown[]

  // ─── Feature Flags ───
  /** Enable global search */
  searchable?: boolean
  /** Enable per-column search */
  columnSearch?: boolean
  /** Enable row selection */
  selectable?: boolean | SelectionMode
  /** Enable pagination */
  pagination?: boolean
  /** Enable filter panel */
  filters?: boolean
  /** Enable export (true = all formats, or specify formats) */
  export?: boolean | ExportFormat[]
  /** Enable refresh button */
  refresh?: boolean
  /** Enable density toggle */
  density?: boolean
  /** Enable sticky header */
  stickyHeader?: boolean
  /** Enable column resizing */
  resizable?: boolean

  // ─── Configuration ───
  /** Default page size */
  pageSize?: number
  /** Available page size options */
  pageSizeOptions?: number[]
  /** Persist state to localStorage (true = auto key, string = custom key) */
  persistState?: boolean | string
  /** Field used as unique row identifier */
  idField?: string
  /** Default density */
  defaultDensity?: Density
  /** Search debounce in ms */
  searchDebounce?: number
  /** Enable multi-column sort */
  multiSort?: boolean
  /** Auto-refresh interval in ms (0 = disabled) */
  autoRefresh?: number
  /** Table title for export filenames */
  title?: string

  // ─── Actions ───
  /** Bulk actions shown when rows selected */
  bulkActions?: BulkAction<T>[]
  /** Row-level actions */
  actions?: RowAction<T>[]

  // ─── Permissions ───
  permissions?: DataTablePermissions

  // ─── Events ───
  onRowClick?: (row: T) => void
  onRowDoubleClick?: (row: T) => void
  onSelectionChange?: (rows: T[]) => void
  onSortChange?: (sort: SortState[]) => void
  onFilterChange?: (filters: FilterState[]) => void
  onSearchChange?: (search: string) => void
  onPageChange?: (page: number, pageSize: number) => void
  onRefresh?: () => void | Promise<void>

  // ─── Custom Renderers ───
  /** Custom toolbar content or override */
  toolbar?: React.ReactNode | false
  /** Custom empty state */
  emptyState?: React.ReactNode
  /** Custom loading state */
  loadingState?: React.ReactNode
  /** Custom footer */
  footer?: React.ReactNode
  /** Extra toolbar content (appended to default toolbar) */
  toolbarExtra?: React.ReactNode

  // ─── Styling ───
  className?: string
  tableClassName?: string
  rowClassName?: string | ((row: T, index: number) => string)
  headerClassName?: string

  // ─── Loading ───
  loading?: boolean
  /** Number of skeleton rows to show while loading */
  skeletonRows?: number
}

// ─── Context Type ────────────────────────────────────────────────────

export interface DataTableContextValue<T = Record<string, any>> {
  // Config
  columns: DataTableColumn<T>[]
  props: DataTableProps<T>

  // Data
  data: T[]
  processedData: T[]
  paginatedData: T[]
  isLoading: boolean
  error: string | null

  // Sort
  sortState: SortState[]
  handleSort: (columnId: string) => void
  clearSort: () => void

  // Search
  globalSearch: string
  setGlobalSearch: (value: string) => void
  columnSearchValues: Record<string, string>
  setColumnSearchValue: (columnId: string, value: string) => void
  clearSearch: () => void

  // Filter
  filterState: FilterState[]
  setFilterState: (filters: FilterState[]) => void
  addFilter: (filter: FilterState) => void
  removeFilter: (columnId: string) => void
  clearFilters: () => void
  activeFilterCount: number

  // Selection
  selectedRows: Set<string>
  selectedRowData: T[]
  toggleRow: (id: string) => void
  toggleAllOnPage: () => void
  toggleAllFiltered: () => void
  clearSelection: () => void
  isRowSelected: (id: string) => boolean
  isAllOnPageSelected: boolean
  isSomeOnPageSelected: boolean
  selectionCount: number

  // Pagination
  paginationState: PaginationState
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  totalPages: number
  startItem: number
  endItem: number

  // Columns
  columnStates: ColumnState[]
  visibleColumns: DataTableColumn<T>[]
  toggleColumnVisibility: (columnId: string) => void
  resetColumns: () => void
  setColumnOrder: (columnId: string, newOrder: number) => void

  // Density
  density: Density
  setDensity: (density: Density) => void

  // Actions
  refreshData: () => void | Promise<void>
  getRowId: (row: T) => string
}
