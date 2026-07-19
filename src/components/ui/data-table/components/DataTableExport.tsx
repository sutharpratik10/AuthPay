"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileJson, FileSpreadsheet, ClipboardCopy } from "lucide-react"
import { exportCSV, exportJSON, exportClipboard } from "../utils/export-utils"

export function DataTableExport() {
  const { props, visibleColumns, processedData, selectedRowData, paginationState } = useDataTableContext()

  if (!props.export) return null

  const allowedFormats = Array.isArray(props.export)
    ? props.export
    : ["csv", "json", "clipboard"]
    
  const hasSelection = selectedRowData.length > 0
  
  const handleExport = async (format: "csv" | "json" | "clipboard", scope: "all" | "selected") => {
    const dataToExport = scope === "selected" ? selectedRowData : processedData
    const filename = `${props.title || "export"}_${new Date().toISOString().split("T")[0]}`
    
    const options = {
      columns: visibleColumns,
      data: dataToExport,
      filename
    }

    if (format === "csv") {
      exportCSV(options)
    } else if (format === "json") {
      exportJSON(options)
    } else if (format === "clipboard") {
      await exportClipboard(options)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 hidden sm:flex">
          <Download className="h-4 w-4" />
          <span className="hidden lg:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {hasSelection && (
          <>
            <DropdownMenuLabel>Selected Rows ({selectedRowData.length})</DropdownMenuLabel>
            {allowedFormats.includes("csv") && (
              <DropdownMenuItem onClick={() => handleExport("csv", "selected")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> CSV
              </DropdownMenuItem>
            )}
            {allowedFormats.includes("json") && (
              <DropdownMenuItem onClick={() => handleExport("json", "selected")}>
                <FileJson className="mr-2 h-4 w-4" /> JSON
              </DropdownMenuItem>
            )}
            {allowedFormats.includes("clipboard") && (
              <DropdownMenuItem onClick={() => handleExport("clipboard", "selected")}>
                <ClipboardCopy className="mr-2 h-4 w-4" /> Copy to Clipboard
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuLabel>All Filtered Rows ({paginationState.total})</DropdownMenuLabel>
        {allowedFormats.includes("csv") && (
          <DropdownMenuItem onClick={() => handleExport("csv", "all")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> CSV
          </DropdownMenuItem>
        )}
        {allowedFormats.includes("json") && (
          <DropdownMenuItem onClick={() => handleExport("json", "all")}>
            <FileJson className="mr-2 h-4 w-4" /> JSON
          </DropdownMenuItem>
        )}
        {allowedFormats.includes("clipboard") && (
          <DropdownMenuItem onClick={() => handleExport("clipboard", "all")}>
            <ClipboardCopy className="mr-2 h-4 w-4" /> Copy to Clipboard
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
