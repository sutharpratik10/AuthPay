"use client"

import * as React from "react"
import { ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ value, onValueChange, options, placeholder = "Select...", className, disabled = false }, ref) => {
    const selectedOption = options.find(option => option.value === value)
    const [open, setOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const searchInputRef = React.useRef<HTMLInputElement>(null)
    
    // Filter options based on search term
    const filteredOptions = React.useMemo(() => {
      if (!searchTerm) return options
      return options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }, [options, searchTerm])

    // Focus search input when dropdown opens
    React.useEffect(() => {
      if (open && searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.focus()
        }, 100)
      } else {
        setSearchTerm("")
      }
    }, [open])

    // Debugging the value and selectedOption
    React.useEffect(() => {
      console.log('Select component - value:', value, 'selectedOption:', selectedOption, 'options:', options);
    }, [value, selectedOption, options])

    // Debugging the value and options
    React.useEffect(() => {
      console.log('Select component - value:', value, 'options:', options.map(option => option.value));
    }, [value, options]);
    
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            disabled={disabled}            
            className={cn(
              "w-full justify-between bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground",
              (!selectedOption || !value || value === selectedOption.label) && "text-muted-foreground",
              className
            )}
          >
            {selectedOption && value && value !== '' ? selectedOption.label : placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>        <DropdownMenuContent 
          className="w-full min-w-[8rem] bg-popover border-border p-0"
          style={{
            width: 'var(--radix-dropdown-menu-trigger-width)'
          }}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 bg-background border-input text-foreground placeholder-muted-foreground focus:border-ring"
                onKeyDown={(e) => {
                  // Prevent dropdown from closing when typing
                  e.stopPropagation()
                }}
              />
            </div>
          </div>
          
          {/* Scrollable Options Container */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-2 px-2 text-sm text-muted-foreground text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                    setSearchTerm("")
                  }}
                  className={cn(
                    "cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                >
                  {option.label}
                </DropdownMenuItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)

Select.displayName = "Select"

export { Select }
export type { SelectOption, SelectProps }
