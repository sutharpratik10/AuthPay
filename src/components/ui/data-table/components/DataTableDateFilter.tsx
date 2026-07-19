"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Select } from "@/components/ui/select"
import { format } from "date-fns"
import type { DataTableColumn } from "../types"
import { cn } from "@/lib/utils/helpers"
import type { DateRange } from "react-day-picker"

export type DateFilterState = {
  mode: "single" | "multiple" | "range"
  single?: Date
  multiple?: Date[]
  range?: DateRange
}

interface DataTableDateFilterProps<T> {
  column: DataTableColumn<T>
}

export function DataTableDateFilter<T extends Record<string, any>>({
  column,
}: DataTableDateFilterProps<T>) {
  const { columnSearchValues, setColumnSearchValue } = useDataTableContext<T>()

  const value = columnSearchValues[column.id]
  const [isOpen, setIsOpen] = React.useState(false)

  const parsedValue: DateFilterState = React.useMemo(() => {
    if (!value) return { mode: "range" }
    try {
      const parsed = JSON.parse(value)
      return {
        mode: parsed.mode || "range",
        single: parsed.single ? new Date(parsed.single) : undefined,
        multiple: parsed.multiple ? parsed.multiple.map((d: string) => new Date(d)) : undefined,
        range: parsed.range ? {
          from: parsed.range.from ? new Date(parsed.range.from) : undefined,
          to: parsed.range.to ? new Date(parsed.range.to) : undefined,
        } : undefined
      }
    } catch {
      return { mode: "range" }
    }
  }, [value])

  const [state, setState] = React.useState<DateFilterState>(parsedValue)

  // Sync state when popup opens
  React.useEffect(() => {
    if (isOpen) setState(parsedValue)
  }, [isOpen, parsedValue])

  const applyFilter = (newState: DateFilterState) => {
    // Only apply if there is an actual date selected
    let hasValue = false
    if (newState.mode === "single" && newState.single) hasValue = true
    if (newState.mode === "multiple" && newState.multiple && newState.multiple.length > 0) hasValue = true
    if (newState.mode === "range" && newState.range && (newState.range.from || newState.range.to)) hasValue = true

    if (hasValue) {
      setColumnSearchValue(column.id, JSON.stringify(newState))
    } else {
      setColumnSearchValue(column.id, "")
    }
  }

  const handleModeChange = (val: string) => {
    const newMode = val as "single" | "multiple" | "range"
    const newState = { mode: newMode }
    setState(newState)
  }

  const clearFilter = (e: React.MouseEvent) => {
    e.stopPropagation()
    setColumnSearchValue(column.id, "")
    setState({ mode: "range" })
  }

  // Display text
  let displayText = "Filter date"
  if (parsedValue.mode === "single" && parsedValue.single) {
    displayText = format(parsedValue.single, "PP")
  } else if (parsedValue.mode === "multiple" && parsedValue.multiple?.length) {
    displayText = `${parsedValue.multiple.length} selected`
  } else if (parsedValue.mode === "range" && parsedValue.range?.from) {
    if (parsedValue.range.to) {
      displayText = `${format(parsedValue.range.from, "LLL dd")} - ${format(parsedValue.range.to, "LLL dd")}`
    } else {
      displayText = format(parsedValue.range.from, "PP")
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 w-full min-w-[120px] justify-start text-left font-normal text-xs px-2",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
          <span className="truncate flex-1">{displayText}</span>
          {value && (
            <X
              className="h-3.5 w-3.5 ml-1 opacity-50 hover:opacity-100"
              onClick={clearFilter}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex flex-col gap-3">
          <Select
            value={state.mode}
            onValueChange={handleModeChange}
            options={[
              { value: "single", label: "Single Date" },
              { value: "multiple", label: "Multiple Dates" },
              { value: "range", label: "Date Range" }
            ]}
          />

          <div className="border rounded-md p-1">
            {state.mode === "single" && (
              <Calendar
                mode="single"
                selected={state.single}
                onSelect={(d) => {
                  const s = { ...state, single: d }
                  setState(s)
                  applyFilter(s)
                  if (d) setIsOpen(false)
                }}
                initialFocus
              />
            )}
            {state.mode === "multiple" && (
              <Calendar
                mode="multiple"
                selected={state.multiple}
                onSelect={(d) => {
                  const s = { ...state, multiple: d }
                  setState(s)
                  applyFilter(s)
                }}
                initialFocus
              />
            )}
            {state.mode === "range" && (
              <Calendar
                mode="range"
                selected={state.range}
                onSelect={(d) => {
                  const s = { ...state, range: d }
                  setState(s)
                  applyFilter(s)
                }}
                initialFocus
              />
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
