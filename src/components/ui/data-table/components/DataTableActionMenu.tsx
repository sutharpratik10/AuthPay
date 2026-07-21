"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

interface DataTableActionMenuProps<T> {
  row: T
}

export function DataTableActionMenu<T extends Record<string, any>>({
  row,
}: DataTableActionMenuProps<T>) {
  const { props } = useDataTableContext<T>()
  const actions = props.actions

  if (!actions || actions.length === 0) return null

  // Filter out hidden actions
  const visibleActions = actions.filter((action) => {
    const isHidden = typeof action.hidden === "function" ? action.hidden(row) : action.hidden
    if (isHidden) return false

    // Check permissions if specified
    if (action.permission && props.permissions) {
      return props.permissions[action.permission] !== false
    }

    return true
  })

  if (visibleActions.length === 0) return null

  // If there's only 1 action and no separator, just render it as a button
  if (visibleActions.length === 1 && !visibleActions[0].separator) {
    const action = visibleActions[0]
    const isDisabled = typeof action.disabled === "function" ? action.disabled(row) : action.disabled
    const Icon = action.icon

    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        disabled={isDisabled}
        onClick={(e) => {
          e.stopPropagation()
          action.onClick(row)
        }}
        title={action.label}
      >
        {Icon ? <Icon className="h-4 w-4" /> : <span className="sr-only">{action.label}</span>}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 text-muted-foreground data-[state=open]:bg-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {visibleActions.map((action, i) => {
          const isDisabled = typeof action.disabled === "function" ? action.disabled(row) : action.disabled
          const Icon = action.icon

          return (
            <React.Fragment key={i}>
              {action.separator && i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                disabled={isDisabled}
                className={action.variant === "destructive" ? "text-destructive focus:bg-destructive focus:text-destructive-foreground" : ""}
                onClick={(e) => {
                  e.stopPropagation()
                  action.onClick(row)
                }}
              >
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {action.label}
              </DropdownMenuItem>
            </React.Fragment>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
