"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings2 } from "lucide-react"

export function DataTableColumnVisibility() {
  const { hideableColumns, isColumnVisible, toggleColumnVisibility, resetColumns } = useDataTableContext()

  if (hideableColumns.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 hidden sm:flex">
          <Settings2 className="h-4 w-4" />
          <span className="hidden lg:inline">View</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideableColumns.map((column) => {
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={isColumnVisible(column.id)}
              onCheckedChange={() => toggleColumnVisibility(column.id)}
            >
              {typeof column.header === "string" ? column.header : column.id}
            </DropdownMenuCheckboxItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItemCustom onClick={resetColumns}>
          Reset to default
        </DropdownMenuItemCustom>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Workaround for dropdown menu item acting as a button
const DropdownMenuItemCustom = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    {...props}
  />
))
DropdownMenuItemCustom.displayName = "DropdownMenuItemCustom"
