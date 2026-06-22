"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Check } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="border-secondary/20 dark:text-neutral-100 dark:border-neutral-300 dark:hover:bg-neutral-600">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-background/95 backdrop-blur-sm border border-secondary/20 shadow-lg shadow-secondary/10 w-36 animate-in fade-in-80 dark:bg-neutral-800/95 dark:border-neutral-700"
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")} 
          className="hover:bg-secondary/20 focus:bg-secondary/20 focus:outline-none transition-colors cursor-pointer flex justify-between dark:text-white dark:hover:bg-neutral-700/50 dark:focus:bg-neutral-700/50"
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </div>
          {theme === "light" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")} 
          className="hover:bg-secondary/20 focus:bg-secondary/20 focus:outline-none transition-colors cursor-pointer flex justify-between dark:text-white dark:hover:bg-neutral-700/50 dark:focus:bg-neutral-700/50"
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </div>
          {theme === "dark" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")} 
          className="hover:bg-secondary/20 focus:bg-secondary/20 focus:outline-none transition-colors cursor-pointer flex justify-between dark:text-white dark:hover:bg-neutral-700/50 dark:focus:bg-neutral-700/50"
        >
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span>System</span>
          </div>
          {theme === "system" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
