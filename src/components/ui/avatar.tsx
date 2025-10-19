import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils/helpers"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg"
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-8 w-8 text-sm",
      md: "h-10 w-10 text-base", 
      lg: "h-12 w-12 text-lg"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full bg-muted",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src ? (
          <Image
            src={src}
            alt={alt || "User avatar"}
            width={size === "sm" ? 32 : size === "md" ? 40 : 48}
            height={size === "sm" ? 32 : size === "md" ? 40 : 48}
            className="aspect-square h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800  text-white font-medium">
            {fallback}
          </div>
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }
