"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

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
              !selectedOption && "text-muted-foreground",
              className
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-full min-w-[8rem]"
          style={{
            width: 'var(--radix-dropdown-menu-trigger-width)'
          }}
        >
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => {
                onValueChange(option.value)
                setOpen(false)
              }}
              className={cn(
                "cursor-pointer",
                value === option.value && "bg-accent text-accent-foreground"
              )}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)

Select.displayName = "Select"

export { Select }
export type { SelectOption, SelectProps }
