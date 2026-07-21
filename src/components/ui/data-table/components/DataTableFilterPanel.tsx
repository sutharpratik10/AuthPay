"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter } from "lucide-react"

export function DataTableFilterPanel() {
  const { props, activeFilterCount } = useDataTableContext()

  if (!props.filters) return null

  // For Phase 2, this is a simplified placeholder for the filter panel.
  // A fully-fledged filter builder is a complex component.
  // In a real application, this would render inputs based on `filterType`.

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 border-dashed">
          <Filter className="h-4 w-4" />
          <span className="hidden lg:inline">Filter</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="rounded-sm px-1 font-normal ml-1 lg:ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[300px] p-4">
        <div className="space-y-4">
          <h4 className="font-medium leading-none">Filters</h4>
          <p className="text-sm text-muted-foreground">
            Advanced filter builder will be implemented in Phase 3.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
