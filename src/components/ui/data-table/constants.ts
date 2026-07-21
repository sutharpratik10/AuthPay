import type { Density } from "./types"

// ─── Pagination ──────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 25

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 500] as const

// ─── Search ──────────────────────────────────────────────────────────

export const DEFAULT_SEARCH_DEBOUNCE_MS = 300

// ─── Density ─────────────────────────────────────────────────────────

export const DEFAULT_DENSITY: Density = "normal"

export const DENSITY_CLASSES: Record<Density, { cell: string; row: string }> = {
  compact: {
    cell: "px-3 py-1 text-xs",
    row: "h-8",
  },
  normal: {
    cell: "px-4 py-3 text-sm",
    row: "h-12",
  },
  comfortable: {
    cell: "px-4 py-4 text-sm",
    row: "h-14",
  },
} as const

// ─── Filter Operators ────────────────────────────────────────────────

export const TEXT_OPERATORS = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "starts_with", label: "Starts With" },
  { value: "ends_with", label: "Ends With" },
] as const

export const NUMBER_OPERATORS = [
  { value: "eq", label: "Equals" },
  { value: "gt", label: "Greater Than" },
  { value: "gte", label: "Greater or Equal" },
  { value: "lt", label: "Less Than" },
  { value: "lte", label: "Less or Equal" },
  { value: "between", label: "Between" },
] as const

export const DATE_OPERATORS = [
  { value: "before", label: "Before" },
  { value: "after", label: "After" },
  { value: "date_between", label: "Between" },
] as const

export const DEFAULT_OPERATORS_BY_TYPE = {
  text: TEXT_OPERATORS,
  number: NUMBER_OPERATORS,
  date: DATE_OPERATORS,
  select: [{ value: "in", label: "Is" }],
  "multi-select": [{ value: "in", label: "Includes" }],
  boolean: [{ value: "eq", label: "Equals" }],
} as const

// ─── Status Colors ───────────────────────────────────────────────────

export const STATUS_COLOR_MAP: Record<string, string> = {
  // Success
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",

  // Warning
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  trialing: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  processing: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",

  // Danger
  inactive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  deleted: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  denied: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  expired: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",

  // Info
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",

  // Neutral
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400",
  unknown: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400",
  "free-trial": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
} as const

// ─── Skeleton ────────────────────────────────────────────────────────

export const DEFAULT_SKELETON_ROWS = 5

// ─── Local Storage Key ───────────────────────────────────────────────

export const STORAGE_KEY_PREFIX = "datatable_state_"
