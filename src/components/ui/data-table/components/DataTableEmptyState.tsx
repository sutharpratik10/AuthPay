"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import { Button } from "@/components/ui/button"
import { SearchX, FilterX, AlertCircle, FileX2 } from "lucide-react"

export interface DataTableEmptyStateProps {
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
}

export function DataTableEmptyState() {
  const {
    paginatedData,
    isLoading,
    error,
    globalSearch,
    hasActiveFilters,
    clearSearch,
    clearFilters,
  } = useDataTableContext()

  // Don't render if there's data or it's loading
  if (isLoading || paginatedData.length > 0) return null

  // 1. Error State
  if (error) {
    return (
      <EmptyStateTemplate
        icon={<AlertCircle className="h-10 w-10 text-destructive" />}
        title="Error loading data"
        description={error}
      />
    )
  }

  // 2. Search Empty State (No results for query)
  if (globalSearch) {
    return (
      <EmptyStateTemplate
        icon={<SearchX className="h-10 w-10 text-muted-foreground" />}
        title="No results found"
        description={`No records found matching "${globalSearch}"`}
        action={
          <Button variant="outline" onClick={clearSearch}>
            Clear search
          </Button>
        }
      />
    )
  }

  // 3. Filter Empty State
  if (hasActiveFilters) {
    return (
      <EmptyStateTemplate
        icon={<FilterX className="h-10 w-10 text-muted-foreground" />}
        title="No records match filters"
        description="Try adjusting your filters or clearing them to see results."
        action={
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        }
      />
    )
  }

  // 4. Default Empty State
  return (
    <EmptyStateTemplate
      icon={<FileX2 className="h-10 w-10 text-muted-foreground" />}
      title="No records available"
      description="There are no records to display in this view."
    />
  )
}

function EmptyStateTemplate({
  icon,
  title,
  description,
  action,
}: DataTableEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-10 px-4 text-center">
      {icon && <div className="text-muted-foreground/50">{icon}</div>}
      <div className="space-y-1">
        <h4 className="text-sm font-medium">{title}</h4>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
