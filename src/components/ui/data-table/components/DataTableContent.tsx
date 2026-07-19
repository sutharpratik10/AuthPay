"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import { cn } from "@/lib/utils/helpers"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { DataTableHeader } from "./DataTableHeader"
import { DataTableRow } from "./DataTableRow"
import { DataTableEmptyState } from "./DataTableEmptyState"
import { DataTableLoadingState } from "./DataTableLoadingState"
import { Loader2 } from "lucide-react"

export function DataTableContent<T extends Record<string, any>>() {
  const {
    paginatedData,
    visibleColumns,
    isLoading,
    error,
    props,
    density,
  } = useDataTableContext<T>()

  const totalCols =
    visibleColumns.length +
    (props.selectable ? 1 : 0) +
    (props.actions?.length ? 1 : 0)

  // ─── Loading State ───
  if (isLoading && paginatedData.length === 0) {
    if (props.loadingState) {
      return <>{props.loadingState}</>
    }
    return <DataTableLoadingState />
  }

  // ─── Empty State ───
  if (!isLoading && paginatedData.length === 0) {
    if (props.emptyState) {
      return (
        <div className={cn("relative w-full border rounded-md", props.tableClassName)}>
          <Table>
            <DataTableHeader />
            <TableBody>
              <TableRow>
                <TableCell colSpan={totalCols} className="h-24 text-center">
                  {props.emptyState}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )
    }

    return (
      <div className={cn("relative w-full border rounded-md", props.tableClassName)}>
        <Table>
          <DataTableHeader />
          <TableBody>
            <TableRow>
              <TableCell colSpan={totalCols} className="h-32">
                <DataTableEmptyState />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  // ─── Data State ───
  return (
    <div className={cn("relative w-full border rounded-md overflow-auto", props.tableClassName)}>
      <Table>
        <DataTableHeader />
        <TableBody>
          {paginatedData.map((row, index) => (
            <DataTableRow key={props.idField ? String((row as Record<string, any>)[props.idField]) : index} row={row} rowIndex={index} />
          ))}
        </TableBody>
      </Table>
      
      {/* Loading overlay for subsequent fetches */}
      {isLoading && paginatedData.length > 0 && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10">
          <div className="bg-background border shadow-lg rounded-md px-4 py-2 flex items-center gap-2 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Loading...
          </div>
        </div>
      )}
    </div>
  )
}
