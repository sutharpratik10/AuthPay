# Advanced Table Component Usage Guide

This guide explains how to use the enhanced Table component with sorting, column search, pagination, and multi-row selection features.

## Features

- ✅ **Column-level sorting** with visual indicators (ascending/descending/unsorted)
- ✅ **Column search boxes** below each header for filtering data
- ✅ **Pagination** with customizable page sizes
- ✅ **Multi-row selection** with select all functionality
- ✅ **Responsive design** with proper styling
- ✅ **Accessible** with proper ARIA labels

## Components

### Basic Components (Original)
- `Table` - Main table wrapper
- `TableHeader` - Table header section
- `TableBody` - Table body section
- `TableFooter` - Table footer section
- `TableRow` - Table row
- `TableHead` - Table header cell
- `TableCell` - Table data cell
- `TableCaption` - Table caption

### New Enhanced Components
- `TableHeadSortable` - Sortable header cell with sort indicators
- `TableColumnSearch` - Search input for column filtering
- `TablePagination` - Pagination controls
- `TableSelectionCheckbox` - Checkbox for row selection

## Installation

Make sure you have `lucide-react` installed for the icons:

```bash
npm install lucide-react
```

## Basic Usage

### 1. Simple Table with Sorting

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableHeadSortable,
} from "@/components/ui/table"

function MyTable() {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Your table rows */}
      </TableBody>
    </Table>
  )
}
```

### 2. Table with Column Search

```tsx
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableColumnSearch,
} from "@/components/ui/table"

function MyTable() {
  const [filters, setFilters] = useState({ name: "", email: "" })

  const handleFilter = (column: string, value: string) => {
    setFilters(prev => ({ ...prev, [column]: value }))
  }

  return (
    <Table>
      <TableHeader>
        {/* Header row */}
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
        </TableRow>
        
        {/* Search row */}
        <TableRow>
          <TableHead>
            <TableColumnSearch
              placeholder="Search name..."
              onSearch={(value) => handleFilter("name", value)}
            />
          </TableHead>
          <TableHead>
            <TableColumnSearch
              placeholder="Search email..."
              onSearch={(value) => handleFilter("email", value)}
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Your filtered table rows */}
      </TableBody>
    </Table>
  )
}
```

### 3. Table with Pagination

```tsx
import {
  Table,
  TableBody,
  TablePagination,
} from "@/components/ui/table"

function MyTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const totalItems = 100
  const totalPages = Math.ceil(totalItems / pageSize)

  return (
    <div className="border rounded-lg">
      <Table>
        {/* Table content */}
      </Table>
      
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </div>
  )
}
```

### 4. Table with Multi-Row Selection

```tsx
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSelectionCheckbox,
} from "@/components/ui/table"

function MyTable() {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  
  const data = [
    { id: "1", name: "John" },
    { id: "2", name: "Jane" },
  ]

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRows(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(data.map(row => row.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const allSelected = data.every(row => selectedRows.has(row.id))
  const someSelected = data.some(row => selectedRows.has(row.id)) && !allSelected

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <TableSelectionCheckbox
              checked={allSelected}
              indeterminate={someSelected}
              onCheckedChange={handleSelectAll}
            />
          </TableHead>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(row => (
          <TableRow
            key={row.id}
            data-state={selectedRows.has(row.id) ? "selected" : undefined}
          >
            <TableCell>
              <TableSelectionCheckbox
                checked={selectedRows.has(row.id)}
                onCheckedChange={(checked) => handleSelectRow(row.id, checked)}
              />
            </TableCell>
            <TableCell>{row.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

## Complete Example

See `table-example.tsx` for a complete working example that combines all features:
- Column sorting
- Column filtering
- Pagination
- Multi-row selection

## API Reference

### TableHeadSortable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sortable` | `boolean` | `false` | Enable sorting for this column |
| `sortDirection` | `"asc" \| "desc" \| null` | `null` | Current sort direction |
| `onSort` | `() => void` | - | Callback when header is clicked |

### TableColumnSearch Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSearch` | `(value: string) => void` | - | Callback when search value changes |
| `placeholder` | `string` | - | Input placeholder text |

### TablePagination Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | - | Current page number (1-indexed) |
| `totalPages` | `number` | - | Total number of pages |
| `pageSize` | `number` | - | Number of items per page |
| `totalItems` | `number` | - | Total number of items |
| `onPageChange` | `(page: number) => void` | - | Callback when page changes |
| `onPageSizeChange` | `(size: number) => void` | - | Callback when page size changes |
| `pageSizeOptions` | `number[]` | `[10, 25, 50, 100]` | Available page size options |

### TableSelectionCheckbox Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | Whether checkbox is checked |
| `onCheckedChange` | `(checked: boolean) => void` | - | Callback when checkbox state changes |
| `indeterminate` | `boolean` | `false` | Show indeterminate state (for "select all") |

## Styling

The components use Tailwind CSS classes and are compatible with the shadcn/ui design system. They automatically adapt to your theme configuration.

### Custom Styling

You can override styles by passing a `className` prop to any component:

```tsx
<TableHeadSortable
  className="bg-blue-100"
  sortable
  onSort={handleSort}
>
  Custom Styled Header
</TableHeadSortable>
```

## Accessibility

All components include proper ARIA attributes:
- Sortable headers indicate sort direction
- Checkboxes have proper labels
- Pagination controls are keyboard navigable
- Search inputs have proper focus management

## Tips & Best Practices

1. **Performance**: For large datasets, implement server-side sorting, filtering, and pagination
2. **Memoization**: Use `useMemo` to avoid recalculating sorted/filtered data on every render
3. **Reset pagination**: When filters change, reset to page 1
4. **Loading states**: Show loading indicators during data fetching
5. **Empty states**: Display helpful messages when no data is available
6. **Debounce search**: For better performance, debounce search input changes

## Examples in the Wild

Check out the complete example in `table-example.tsx` to see all features working together.
