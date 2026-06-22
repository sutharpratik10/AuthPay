import { cn } from "@/lib/utils/helpers"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
  text?: string
}

export function LoadingSpinner({ 
  className, 
  size = "md", 
  text = "Loading..." 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div
          className={cn(
            "border-t-2 border-primary animate-spin rounded-full mx-auto",
            sizeClasses[size],
            className
          )}
        />
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

// Fast loading component for initial app load
export function FastLoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 border-t-2 border-blue-600 animate-spin rounded-full mx-auto" />
        <p className="text-sm text-gray-600 animate-pulse">
          Initializing app...
        </p>
      </div>
    </div>
  )
}
