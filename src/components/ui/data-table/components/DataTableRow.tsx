"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import { DENSITY_CLASSES } from "../constants"
import { getCellValue, formatCellValue, getStatusClasses } from "../utils/formatters"
import type { DataTableColumn, CellRenderProps } from "../types"
import { cn } from "@/lib/utils/helpers"
import { TableRow, TableCell } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Check, X, Copy, CheckCheck } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DataTableActionMenu } from "./DataTableActionMenu"

interface DataTableRowProps<T extends Record<string, any>> {
  row: T
  rowIndex: number
}

export function DataTableRow<T extends Record<string, any>>({
  row,
  rowIndex,
}: DataTableRowProps<T>) {
  const {
    visibleColumns,
    density,
    getRowId,
    isRowSelected,
    toggleRow,
    props,
  } = useDataTableContext<T>()

  const rowId = getRowId(row)
  const isSelected = props.selectable ? isRowSelected(rowId) : false
  const rowClassNames = typeof props.rowClassName === "function"
    ? props.rowClassName(row, rowIndex)
    : props.rowClassName

  const handleClick = (e: React.MouseEvent) => {
    props.onRowClick?.(row)

    // If selectable and clicking on the row (not a button/link inside it)
    if (props.selectable) {
      const target = e.target as HTMLElement
      if (
        target.tagName !== "BUTTON" &&
        target.tagName !== "A" &&
        !target.closest("button") &&
        !target.closest("a") &&
        !target.closest('[role="menuitem"]')
      ) {
        // Don't toggle on row click — let checkboxes handle it
      }
    }
  }

  const handleDoubleClick = () => {
    props.onRowDoubleClick?.(row)
  }

  return (
    <TableRow
      data-state={isSelected ? "selected" : undefined}
      className={cn(
        "transition-colors",
        props.onRowClick && "cursor-pointer",
        isSelected && "bg-muted/50",
        rowClassNames
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Selection checkbox */}
      {props.selectable && (
        <TableCell className={cn(DENSITY_CLASSES[density].cell, "w-12")}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => { }}
            onClick={(e) => {
              e.stopPropagation()
              toggleRow(rowId, e.shiftKey)
            }}
            aria-label={`Select row ${rowIndex + 1}`}
          />
        </TableCell>
      )}

      {/* Data cells */}
      {visibleColumns.map((column) => (
        <DataTableCell
          key={column.id}
          row={row}
          rowIndex={rowIndex}
          column={column}
        />
      ))}

      {/* Actions column */}
      {props.actions && props.actions.length > 0 && (
        <TableCell className={cn(DENSITY_CLASSES[density].cell, "w-12 text-right")}>
          <DataTableActionMenu row={row} />
        </TableCell>
      )}
    </TableRow>
  )
}

// ─── Cell Component ──────────────────────────────────────────────────

interface DataTableCellProps<T extends Record<string, any>> {
  row: T
  rowIndex: number
  column: DataTableColumn<T>
}

function DataTableCell<T extends Record<string, any>>({
  row,
  rowIndex,
  column,
}: DataTableCellProps<T>) {
  const { density } = useDataTableContext<T>()
  const [copied, setCopied] = React.useState(false)

  const value = getCellValue(row, column)

  // Custom renderer
  if (column.cell) {
    const cellProps: CellRenderProps<T> = {
      row,
      value,
      rowIndex,
      column,
    }
    return (
      <TableCell
        className={cn(
          DENSITY_CLASSES[density].cell,
          column.align === "center" && "text-center",
          column.align === "right" && "text-right",
          column.sticky && "sticky z-10 bg-background"
        )}
        style={{
          width: column.width,
          minWidth: column.minWidth,
          maxWidth: column.maxWidth,
          ...(column.sticky === "left" ? { left: 0 } : {}),
          ...(column.sticky === "right" ? { right: 0 } : {}),
        }}
      >
        {column.cell(cellProps)}
      </TableCell>
    )
  }

  // Format-based rendering
  const content = renderFormattedContent(value, column)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(String(value ?? ""))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  const cellContent = (
    <div className="flex items-center gap-1.5">
      {content}
      {column.copyOnClick && value != null && (
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover/cell:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
          aria-label="Copy value"
        >
          {copied ? (
            <CheckCheck className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      )}
    </div>
  )

  const cell = (
    <TableCell
      className={cn(
        DENSITY_CLASSES[density].cell,
        "group/cell",
        column.align === "center" && "text-center",
        column.align === "right" && "text-right",
        column.sticky && "sticky z-10 bg-background",
        column.copyOnClick && "cursor-pointer"
      )}
      style={{
        width: column.width,
        minWidth: column.minWidth,
        maxWidth: column.maxWidth,
        ...(column.sticky === "left" ? { left: 0 } : {}),
        ...(column.sticky === "right" ? { right: 0 } : {}),
      }}
    >
      {cellContent}
    </TableCell>
  )

  // Tooltip wrapper
  if (column.tooltip) {
    const tooltipText =
      typeof column.tooltip === "function"
        ? column.tooltip(row)
        : typeof column.tooltip === "string"
          ? column.tooltip
          : String(value ?? "")

    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{cell}</TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return cell
}

// ─── Format Helpers ──────────────────────────────────────────────────

function renderFormattedContent<T>(
  value: unknown,
  column: DataTableColumn<T>
): React.ReactNode {
  if (value == null) return <span className="text-muted-foreground">—</span>

  switch (column.format) {
    case "boolean":
      return value ? (
        <div className="flex items-center gap-1.5">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-green-700 dark:text-green-400">
            {column.formatOptions?.trueLabel ?? "Yes"}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <X className="h-4 w-4 text-red-500 dark:text-red-400" />
          <span className="text-red-600 dark:text-red-400">
            {column.formatOptions?.falseLabel ?? "No"}
          </span>
        </div>
      )

    case "badge":
      return (
        <Badge variant="secondary" className="font-medium">
          {String(value)}
        </Badge>
      )

    case "status": {
      const statusStr = String(value)
      const colorClasses = getStatusClasses(
        statusStr,
        column.formatOptions?.colorMap
      )
      return (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
            colorClasses
          )}
        >
          {statusStr.charAt(0).toUpperCase() + statusStr.slice(1)}
        </span>
      )
    }

    case "avatar": {
      const name = String(value)
      const initial = name.charAt(0).toUpperCase()
      return (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 text-white text-xs font-semibold">
            {initial}
          </div>
          <span>{name}</span>
        </div>
      )
    }

    default:
      return <span>{formatCellValue(value, column)}</span>
  }
}
