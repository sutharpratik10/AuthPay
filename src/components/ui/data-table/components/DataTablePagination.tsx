"use client"

import * as React from "react"
import { useDataTableContext } from "../DataTableProvider"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react"

export function DataTablePagination() {
  const {
    paginationState,
    totalPages,
    startItem,
    endItem,
    setPage,
    setPageSize,
    goToFirst,
    goToLast,
    goToNext,
    goToPrevious,
    canGoNext,
    canGoPrevious,
    pageNumbers,
    pageSizeOptions,
    props,
  } = useDataTableContext()

  if (props.pagination === false || paginationState.total === 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 text-sm text-muted-foreground">
      {/* Total Records */}
      <div className="flex-1 flex items-center justify-center sm:justify-start">
        Showing {startItem} to {endItem} of {paginationState.total} records
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
        {/* Page Size Selector */}
        <div className="flex items-center space-x-2">
          <p className="font-medium text-foreground text-xs whitespace-nowrap">Rows per page</p>
          <Select
            value={String(paginationState.pageSize)}
            onValueChange={(val) => setPageSize(Number(val))}
            options={pageSizeOptions.map((size) => ({
              value: String(size),
              label: String(size),
            }))}
            className="h-8 w-[70px]"
            side="top"
          />
        </div>

        {/* Page Navigation */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center text-xs font-medium text-foreground mr-2">
            Page {paginationState.page} of {totalPages}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={goToFirst}
              disabled={!canGoPrevious}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={goToPrevious}
              disabled={!canGoPrevious}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page Numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {pageNumbers.map((page, i) =>
                page === "ellipsis" ? (
                  <div key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center">
                    <MoreHorizontal className="h-4 w-4 opacity-50" />
                  </div>
                ) : (
                  <Button
                    key={page}
                    variant={paginationState.page === page ? "default" : "outline"}
                    className="h-8 w-8 p-0"
                    onClick={() => setPage(page as number)}
                  >
                    {page}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={goToNext}
              disabled={!canGoNext}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={goToLast}
              disabled={!canGoNext}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
