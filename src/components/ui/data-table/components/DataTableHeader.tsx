"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import { DENSITY_CLASSES } from "../constants"
import { cn } from "@/lib/utils/helpers"
import { TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { DataTableColumnSearch } from "./DataTableColumnSearch"

export function DataTableHeader<T extends Record<string, any>>() {
  const {
    visibleColumns,
    density,
    sortState,
    handleSort,
    props,
    isAllOnPageSelected,
    isSomeOnPageSelected,
    toggleAllOnPage,
  } = useDataTableContext<T>()

  const hasSearchableColumns =
    props.columnSearch && visibleColumns.some((col) => col.searchable)

  return (
    <TableHeader className={cn(props.stickyHeader && "sticky top-0 z-20 bg-background")}>
      <TableRow className={DENSITY_CLASSES[density].row}>
        {/* Selection Checkbox */}
        {props.selectable && (
          <TableHead className={cn(DENSITY_CLASSES[density].cell, "w-12")}>
            <Checkbox
              checked={
                isAllOnPageSelected
                  ? true
                  : isSomeOnPageSelected
                  ? "indeterminate"
                  : false
              }
              onCheckedChange={toggleAllOnPage}
              aria-label="Select all on page"
            />
          </TableHead>
        )}

        {/* Column Headers */}
        {visibleColumns.map((column) => {
          const sort = sortState.find((s) => s.id === column.id)
          const isSortable = props.onSortChange !== undefined || column.sortable !== false

          // Use sortable=false if explicitly disabled or if we have no client sort and no server sort callback
          const canSort = column.sortable !== false && (!props.serverSide || props.onSortChange)

          return (
            <TableHead
              key={column.id}
              className={cn(
                DENSITY_CLASSES[density].cell,
                column.align === "center" && "text-center",
                column.align === "right" && "text-right",
                column.sticky && "sticky z-20 bg-background",
                canSort && "cursor-pointer select-none hover:bg-muted/50"
              )}
              style={{
                width: column.width,
                minWidth: column.minWidth,
                maxWidth: column.maxWidth,
                ...(column.sticky === "left" ? { left: 0 } : {}),
                ...(column.sticky === "right" ? { right: 0 } : {}),
              }}
              onClick={() => canSort && handleSort(column.id)}
            >
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  column.align === "center" && "justify-center",
                  column.align === "right" && "justify-end"
                )}
              >
                <span>{column.header}</span>
                {canSort && (
                  <span className="flex-shrink-0 text-muted-foreground">
                    {sort?.direction === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : sort?.direction === "desc" ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    )}
                  </span>
                )}
              </div>
            </TableHead>
          )
        })}

        {/* Actions Column Header */}
        {props.actions && props.actions.length > 0 && (
          <TableHead className={cn(DENSITY_CLASSES[density].cell, "w-12")}>
            <span className="sr-only">Actions</span>
          </TableHead>
        )}
      </TableRow>

      {/* Column Search Row */}
      {hasSearchableColumns && (
        <TableRow className="bg-muted/30">
          {props.selectable && <TableHead></TableHead>}
          {visibleColumns.map((column) => (
            <TableHead key={column.id} className="p-2">
              <DataTableColumnSearch column={column} />
            </TableHead>
          ))}
          {props.actions && props.actions.length > 0 && <TableHead></TableHead>}
        </TableRow>
      )}
    </TableHeader>
  )
}
