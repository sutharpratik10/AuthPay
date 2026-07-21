"use client"

import * as React from "react"
import type { DataTableProps } from "./types"
import { useDataTable, type UseDataTableReturn } from "./hooks/useDataTable"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataTableContext = React.createContext<any>(null)

export function useDataTableContext<T extends Record<string, any>>() {
  const context = React.useContext(DataTableContext) as UseDataTableReturn<T> | null
  if (!context) {
    throw new Error("useDataTableContext must be used within a DataTableProvider")
  }
  return context
}

interface DataTableProviderProps<T extends Record<string, any>> {
  children: React.ReactNode
  tableProps: DataTableProps<T>
}

export function DataTableProvider<T extends Record<string, any>>({
  children,
  tableProps,
}: DataTableProviderProps<T>) {
  const tableState = useDataTable<T>(tableProps)

  return (
    <DataTableContext.Provider value={tableState}>
      {children}
    </DataTableContext.Provider>
  )
}
