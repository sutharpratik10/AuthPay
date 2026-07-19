"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Columns, AlignJustify, Baseline, Check } from "lucide-react"

export function DataTableDensityToggle() {
  const { density, setDensity, props } = useDataTableContext()

  if (!props.density) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 hidden sm:flex">
          {density === "compact" ? (
            <AlignJustify className="h-4 w-4" />
          ) : density === "comfortable" ? (
            <Columns className="h-4 w-4" />
          ) : (
            <Baseline className="h-4 w-4" />
          )}
          <span className="hidden lg:inline">Density</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuItem onClick={() => setDensity("compact")}>
          <AlignJustify className="mr-2 h-4 w-4" />
          Compact
          {density === "compact" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDensity("normal")}>
          <Baseline className="mr-2 h-4 w-4" />
          Normal
          {density === "normal" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDensity("comfortable")}>
          <Columns className="mr-2 h-4 w-4" />
          Comfortable
          {density === "comfortable" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
