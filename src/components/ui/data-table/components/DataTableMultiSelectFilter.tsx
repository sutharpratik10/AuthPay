"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import type { DataTableColumn } from "../types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, Filter } from "lucide-react"
import { cn } from "@/lib/utils/helpers"

interface DataTableMultiSelectFilterProps<T> {
  column: DataTableColumn<T>
}

export function DataTableMultiSelectFilter<T extends Record<string, any>>({
  column,
}: DataTableMultiSelectFilterProps<T>) {
  const { columnSearchValues, setColumnSearchValue } = useDataTableContext<T>()
  
  const valueStr = columnSearchValues[column.id] || ""
  const selectedValues: string[] = React.useMemo(() => {
    if (valueStr.startsWith('["') && valueStr.endsWith('"]')) {
      try {
        const parsed = JSON.parse(valueStr)
        if (Array.isArray(parsed)) return parsed
      } catch (e) {
        // ignore
      }
    }
    return []
  }, [valueStr])

  const toggleOption = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue]
    
    if (newValues.length === 0) {
      setColumnSearchValue(column.id, "")
    } else {
      setColumnSearchValue(column.id, JSON.stringify(newValues))
    }
  }

  // Handle both our internal 'options' and the standard 'filterOptions'
  const options = (column as any).options || column.filterOptions || []

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 w-full min-w-[100px] justify-between text-xs border-dashed",
            selectedValues.length > 0 && "border-primary bg-primary/5"
          )}
        >
          <div className="flex items-center gap-1 overflow-hidden">
            <Filter className="mr-1 h-3 w-3 shrink-0" />
            <span className="truncate">
              {selectedValues.length === 0 && (typeof column.header === "string" ? column.header : "Filter")}
              {selectedValues.length > 0 && `${selectedValues.length} selected`}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
          {options.length === 0 && (
            <p className="text-xs text-muted-foreground p-2 text-center">No options</p>
          )}
          {options.map((option: any) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`filter-${column.id}-${option.value}`}
                checked={selectedValues.includes(option.value)}
                onCheckedChange={() => toggleOption(option.value)}
              />
              <label
                htmlFor={`filter-${column.id}-${option.value}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
        {selectedValues.length > 0 && (
          <div className="p-2 border-t flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-full text-xs"
              onClick={() => setColumnSearchValue(column.id, "")}
            >
              Clear filters
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
