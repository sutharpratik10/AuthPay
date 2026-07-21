"use client"

import * as React from "react"
import { cn } from "@/lib/utils/helpers"
import type { DataTableProps } from "./types"
import { DataTableProvider } from "./DataTableProvider"
import { DataTableContent } from "./components/DataTableContent"
import { DataTableToolbar } from "./components/DataTableToolbar"
import { DataTablePagination } from "./components/DataTablePagination"

export function DataTable<T extends Record<string, any>>(
  props: DataTableProps<T>
) {
  return (
    <DataTableProvider tableProps={props}>
      <div className={cn("w-full flex flex-col space-y-4", props.className)}>
        <DataTableToolbar />
        
        <DataTableContent />
        
        {props.pagination !== false && <DataTablePagination />}
      </div>
    </DataTableProvider>
  )
}
