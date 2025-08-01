"use client"
import * as React from "react"
import Link from "next/link"
import { User, Settings, UserCircle, LogOut } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/routes/routeUtils"

interface UserProfileDropdownProps {
  className?: string
}

export function UserProfileDropdown({ className }: UserProfileDropdownProps) {
  const { data: session } = useSession()
  const router = useRouter()
    const user = session?.user
  const isEmailVerified = session?.user?.isEmailVerified

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push(ROUTES.PUBLIC.HOME)
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name.charAt(0).toUpperCase()
  }

  const getDisplayName = () => {
    return user?.name || user?.email?.split("@")[0] || "User"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`relative flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring ${className}`}>
          <Avatar
            src={user?.image || undefined}
            fallback={getInitials(user?.name || user?.email)}
            size="md"
            className="cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-offset-background hover:ring-ring transition-all"
          />
          <span className="hidden sm:block text-sm font-medium text-foreground">
            {getDisplayName()}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background border border-border shadow-lg rounded-md p-2">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-foreground">{getDisplayName()}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
            {isEmailVerified && (
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200 px-2 py-1 rounded-full w-fit">
                Verified
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuItem 
          asChild
          className="cursor-pointer focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Link href="/protected/profile">
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          asChild
          className="cursor-pointer focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Link href="/protected/account">
            <User className="mr-2 h-4 w-4" />
            <span>Account</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          asChild
          className="cursor-pointer focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Link href="/protected/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-100 dark:focus:bg-red-800 hover:bg-red-100 dark:hover:bg-red-100 focus:text-red-600 dark:focus:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}