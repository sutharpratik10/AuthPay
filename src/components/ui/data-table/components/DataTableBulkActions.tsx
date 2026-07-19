"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils/helpers"

export function DataTableBulkActions() {
  const { props, selectedRowData, clearSelection, selectionCount } = useDataTableContext()

  if (!props.bulkActions || props.bulkActions.length === 0 || selectionCount === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 bg-muted/50 p-1.5 px-3 rounded-md border text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-2 mr-2 font-medium text-muted-foreground border-r pr-4">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
          {selectionCount}
        </span>
        selected
      </div>

      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto no-scrollbar">
        {props.bulkActions.map((action, i) => {
          // Check if disabled/hidden
          const isHidden = typeof action.hidden === "function" ? action.hidden(selectedRowData) : action.hidden
          if (isHidden) return null

          const isDisabled = typeof action.disabled === "function" ? action.disabled(selectedRowData) : action.disabled

          const Icon = action.icon

          return (
            <Button
              key={i}
              variant={action.variant || "secondary"}
              size="sm"
              className={cn("h-7 text-xs px-2.5", Icon && "gap-1.5")}
              disabled={isDisabled}
              onClick={() => action.onClick(selectedRowData)}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {action.label}
            </Button>
          )
        })}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground shrink-0 ml-auto"
        onClick={clearSelection}
        title="Clear selection"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
