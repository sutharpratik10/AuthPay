"use client"

import { forwardRef, InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium leading-6"
          >
            {label}
          </label>
        )}
        <div className={`${label ? "mt-2" : ""}`}>
          <input
            id={id}
            className={cn(
              "block w-full rounded-md border border-secondary/20 bg-background px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm sm:leading-6",
              error && "border-destructive focus:border-destructive focus:ring-destructive",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
