"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableHeadSortable,
  TableColumnSearch,
  TablePagination,
  TableSelectionCheckbox,
} from "@/components/ui/table"

// Example data type
interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
}

// Example data
const sampleData: User[] = [
  { id: "1", name: "John Doe", email: "john@example.com", role: "Admin", status: "Active" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", role: "User", status: "Active" },
  { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "User", status: "Inactive" },
  { id: "4", name: "Alice Williams", email: "alice@example.com", role: "Manager", status: "Active" },
  { id: "5", name: "Charlie Brown", email: "charlie@example.com", role: "User", status: "Active" },
  { id: "6", name: "Diana Prince", email: "diana@example.com", role: "Admin", status: "Active" },
  { id: "7", name: "Eve Davis", email: "eve@example.com", role: "User", status: "Inactive" },
  { id: "8", name: "Frank Miller", email: "frank@example.com", role: "Manager", status: "Active" },
  { id: "9", name: "Grace Lee", email: "grace@example.com", role: "User", status: "Active" },
  { id: "10", name: "Henry Wilson", email: "henry@example.com", role: "User", status: "Inactive" },
]

type SortColumn = keyof User | null
type SortDirection = "asc" | "desc" | null

export function AdvancedTableExample() {
  // State for sorting
  const [sortColumn, setSortColumn] = React.useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null)

  // State for column filters
  const [columnFilters, setColumnFilters] = React.useState<Record<string, string>>({
    name: "",
    email: "",
    role: "",
    status: "",
  })

  // State for pagination
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // State for row selection
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())

  // Handle sorting
  const handleSort = (column: keyof User) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Handle column filter
  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [column]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  // Filter data based on column filters
  const filteredData = React.useMemo(() => {
    return sampleData.filter((row) => {
      return Object.entries(columnFilters).every(([column, filterValue]) => {
        if (!filterValue) return true
        const cellValue = String(row[column as keyof User]).toLowerCase()
        return cellValue.includes(filterValue.toLowerCase())
      })
    })
  }, [columnFilters])

  // Sort filtered data
  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = String(a[sortColumn])
      const bValue = String(b[sortColumn])

      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })
  }, [filteredData, sortColumn, sortDirection])

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page
  }

  // Handle row selection
  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRows(newSelected)
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedData.map((row) => row.id))
      setSelectedRows(allIds)
    } else {
      setSelectedRows(new Set())
    }
  }

  // Check if all rows are selected
  const allSelected = paginatedData.length > 0 && paginatedData.every((row) => selectedRows.has(row.id))
  const someSelected = paginatedData.some((row) => selectedRows.has(row.id)) && !allSelected

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Advanced Table Example</h2>
        {selectedRows.size > 0 && (
          <div className="text-sm text-muted-foreground">
            {selectedRows.size} row(s) selected
          </div>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            {/* Header row with sorting */}
            <TableRow>
              <TableHead className="w-12">
                <TableSelectionCheckbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all rows"
                />
              </TableHead>
              <TableHeadSortable
                sortable
                sortDirection={sortColumn === "name" ? sortDirection : null}
                onSort={() => handleSort("name")}
              >
                Name
              </TableHeadSortable>
              <TableHeadSortable
                sortable
                sortDirection={sortColumn === "email" ? sortDirection : null}
                onSort={() => handleSort("email")}
              >
                Email
              </TableHeadSortable>
              <TableHeadSortable
                sortable
                sortDirection={sortColumn === "role" ? sortDirection : null}
                onSort={() => handleSort("role")}
              >
                Role
              </TableHeadSortable>
              <TableHeadSortable
                sortable
                sortDirection={sortColumn === "status" ? sortDirection : null}
                onSort={() => handleSort("status")}
              >
                Status
              </TableHeadSortable>
            </TableRow>

            {/* Search row */}
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>
                <TableColumnSearch
                  placeholder="Search name..."
                  onSearch={(value) => handleColumnFilter("name", value)}
                />
              </TableHead>
              <TableHead>
                <TableColumnSearch
                  placeholder="Search email..."
                  onSearch={(value) => handleColumnFilter("email", value)}
                />
              </TableHead>
              <TableHead>
                <TableColumnSearch
                  placeholder="Search role..."
                  onSearch={(value) => handleColumnFilter("role", value)}
                />
              </TableHead>
              <TableHead>
                <TableColumnSearch
                  placeholder="Search status..."
                  onSearch={(value) => handleColumnFilter("status", value)}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={selectedRows.has(row.id) ? "selected" : undefined}
                >
                  <TableCell>
                    <TableSelectionCheckbox
                      checked={selectedRows.has(row.id)}
                      onCheckedChange={(checked) => handleSelectRow(row.id, checked)}
                      aria-label={`Select row ${row.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                        row.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {row.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={sortedData.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* Display selected rows */}
      {selectedRows.size > 0 && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <h3 className="font-semibold mb-2">Selected Row IDs:</h3>
          <p className="text-sm text-muted-foreground">
            {Array.from(selectedRows).join(", ")}
          </p>
        </div>
      )}
    </div>
  )
}
