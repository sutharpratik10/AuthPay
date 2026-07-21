"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, RefreshCw } from "lucide-react"
import { DataTableColumnVisibility } from "./DataTableColumnVisibility"
import { DataTableDensityToggle } from "./DataTableDensityToggle"
import { DataTableFilterPanel } from "./DataTableFilterPanel"
import { DataTableExport } from "./DataTableExport"
import { DataTableBulkActions } from "./DataTableBulkActions"

export function DataTableToolbar() {
  const { props, globalSearch, setGlobalSearch, refreshData, isLoading } = useDataTableContext()

  if (props.toolbar === false) return null

  // If a custom toolbar is provided, render it (plus extra content if any)
  if (props.toolbar && React.isValidElement(props.toolbar)) {
    return (
      <div className="flex flex-col gap-4">
        {props.toolbar}
        {props.toolbarExtra && <div>{props.toolbarExtra}</div>}
        <DataTableBulkActions />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 mb-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left side: Search & Filters */}
        <div className="flex flex-1 items-center space-x-2">
          {props.searchable && (
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="h-8 pl-8 pr-8 w-full lg:w-[250px]"
              />
              {globalSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setGlobalSearch("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {props.filters && <DataTableFilterPanel />}
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center space-x-2">
          {props.toolbarExtra}

          {props.refresh && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={refreshData}
              disabled={isLoading}
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh</span>
            </Button>
          )}

          <DataTableColumnVisibility />
          <DataTableDensityToggle />
          <DataTableExport />
        </div>
      </div>

      {/* Bulk Actions row */}
      <DataTableBulkActions />
    </div>
  )
}
