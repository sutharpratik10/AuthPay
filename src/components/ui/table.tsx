import * as React from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils/helpers"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// Sortable Table Head with sorting indicators
interface TableHeadSortableProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean
  sortDirection?: "asc" | "desc" | null
  onSort?: () => void
}

const TableHeadSortable = React.forwardRef<
  HTMLTableCellElement,
  TableHeadSortableProps
>(({ className, sortable = false, sortDirection, onSort, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      sortable && "cursor-pointer select-none hover:bg-muted/50",
      className
    )}
    onClick={sortable ? onSort : undefined}
    {...props}
  >
    <div className="flex items-center gap-2">
      {children}
      {sortable && (
        <span className="inline-flex">
          {sortDirection === "asc" && <ChevronUp className="h-4 w-4" />}
          {sortDirection === "desc" && <ChevronDown className="h-4 w-4" />}
          {sortDirection === null && <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />}
        </span>
      )}
    </div>
  </th>
))
TableHeadSortable.displayName = "TableHeadSortable"

// Column Search Input
interface TableColumnSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void
}

const TableColumnSearch = React.forwardRef<
  HTMLInputElement,
  TableColumnSearchProps
>(({ className, onSearch, ...props }, ref) => {
  const [value, setValue] = React.useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    onSearch?.(newValue)
  }

  return (
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={handleChange}
      className={cn(
        "w-full px-2 py-1 text-sm border border-input rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
        className
      )}
      {...props}
    />
  )
})
TableColumnSearch.displayName = "TableColumnSearch"

// Pagination Controls
interface TablePaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  className?: string
}

const TablePagination = React.forwardRef<HTMLDivElement, TablePaginationProps>(
  (
    {
      currentPage,
      totalPages,
      pageSize,
      totalItems,
      onPageChange,
      onPageSizeChange,
      pageSizeOptions = [10, 25, 50, 100],
      className,
    },
    ref
  ) => {
    const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems)
    const endItem = Math.min(currentPage * pageSize, totalItems)

    const handlePrevious = () => {
      if (currentPage > 1) {
        onPageChange(currentPage - 1)
      }
    }

    const handleNext = () => {
      if (currentPage < totalPages) {
        onPageChange(currentPage + 1)
      }
    }

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onPageSizeChange?.(Number(e.target.value))
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between px-4 py-3 border-t bg-background",
          className
        )}
      >
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Showing {startItem} to {endItem} of {totalItems} results
          </span>
          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="page-size">Rows per page:</label>
              <select
                id="page-size"
                value={pageSize}
                onChange={handlePageSizeChange}
                className="border border-input rounded px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-input rounded bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-input rounded bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    )
  }
)
TablePagination.displayName = "TablePagination"

// Selection Checkbox
interface TableSelectionCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  indeterminate?: boolean
}

const TableSelectionCheckbox = React.forwardRef<
  HTMLInputElement,
  TableSelectionCheckboxProps
>(({ className, checked, onCheckedChange, indeterminate, ...props }, ref) => {
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useImperativeHandle(ref, () => inputRef.current!)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate ?? false
    }
  }, [indeterminate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked)
  }

  return (
    <input
      ref={inputRef}
      type="checkbox"
      checked={checked}
      onChange={handleChange}
      className={cn(
        "h-4 w-4 rounded border-input cursor-pointer focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
      {...props}
    />
  )
})
TableSelectionCheckbox.displayName = "TableSelectionCheckbox"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableHeadSortable,
  TableColumnSearch,
  TablePagination,
  TableSelectionCheckbox,
}
