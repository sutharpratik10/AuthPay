"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { DataTableHeader } from "./DataTableHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { DENSITY_CLASSES, DEFAULT_SKELETON_ROWS } from "../constants"
import { cn } from "@/lib/utils/helpers"
import { Loader2 } from "lucide-react"

export function DataTableLoadingState() {
  const { props, visibleColumns, density } = useDataTableContext()

  const rows = props.skeletonRows ?? DEFAULT_SKELETON_ROWS

  return (
    <div className={cn("relative w-full border rounded-md", props.tableClassName)}>
      <Table>
        <DataTableHeader />
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i} className={DENSITY_CLASSES[density].row}>
              {props.selectable && (
                <TableCell className={cn(DENSITY_CLASSES[density].cell, "w-12")}>
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
              )}
              {visibleColumns.map((col) => (
                <TableCell key={col.id} className={DENSITY_CLASSES[density].cell}>
                  <Skeleton className="h-4 w-[80%]" />
                </TableCell>
              ))}
              {props.actions?.length && (
                <TableCell className={cn(DENSITY_CLASSES[density].cell, "w-12")}>
                  <Skeleton className="h-8 w-8 rounded-md" />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function DataTableSpinnerOverlay() {
  return (
    <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10">
      <div className="bg-background border shadow-lg rounded-md px-4 py-2 flex items-center gap-2 text-sm font-medium">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Loading...
      </div>
    </div>
  )
}
