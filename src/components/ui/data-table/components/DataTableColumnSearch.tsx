"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import { Input } from "@/components/ui/input"
import type { DataTableColumn } from "../types"
import { DataTableDateFilter } from "./DataTableDateFilter"
import { DataTableMultiSelectFilter } from "./DataTableMultiSelectFilter"

interface DataTableColumnSearchProps<T> {
  column: DataTableColumn<T>
}

export function DataTableColumnSearch<T extends Record<string, any>>({
  column,
}: DataTableColumnSearchProps<T>) {
  const { columnSearchValues, setColumnSearchValue, props } = useDataTableContext<T>()

  if (!props.columnSearch || !column.searchable) {
    return <div className="h-8" /> // Placeholder to maintain row height
  }

  const value = columnSearchValues[column.id] || ""

  // In Phase 2, we just support text inputs.
  // In a full implementation, this could render different inputs (select, date picker) based on column.filterType.

  if (column.filterType === "date") {
    return <DataTableDateFilter column={column} />
  }

  if (column.filterType === "multi-select" || column.filterType === "select") {
    return <DataTableMultiSelectFilter column={column} />
  }

  return (
    <Input
      placeholder={`Search ${typeof column.header === "string" ? column.header : "..."}`}
      value={value}
      onChange={(e) => setColumnSearchValue(column.id, e.target.value)}
      className="h-8 text-xs w-full min-w-[100px]"
    />
  )
}
