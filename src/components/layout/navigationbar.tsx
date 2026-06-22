"use client"
import * as React from "react"
import Link from "next/link"
import { useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils/helpers"
import { APP_CONFIG } from "@/lib/utils/constants"
import { getAppName } from "@/lib/utils/config"
import type { NavigationItem, NavigationSubItem } from "@/lib/utils/constants"
import { Menu, X, ChevronRight, User, Settings, LogOut, Shield, LayoutDashboard } from "lucide-react"
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import { ROUTES } from "@/routes/routeUtils"
import { ROUTE_POLICIES } from "@/lib/rbac/routing-utils"
import { useUserValidation } from "@/contexts/UserValidationContext"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { ModeToggle } from "@/components/shared/mode-toggle"
import { UserProfileDropdown } from "@/components/user/UserProfileDropdown"

export function Navigationbar() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const sidebarRef = React.useRef<HTMLDivElement>(null)

  // Get isAdmin from UserValidation context (already fetched, no extra API call)
  const { isAdmin, isLoading: isUserLoading } = useUserValidation()

  // Check if user is authenticated and email is verified
  // Also check if we're not on auth pages (login/signup) - if middleware redirected us there, we're not really authenticated
  const isOnAuthPage = pathname?.startsWith('/auth/login') || pathname?.startsWith('/auth/signup')
  const isAuthenticated = status === "authenticated" && !!session?.user && !isOnAuthPage
  const isEmailVerified = session?.user?.isEmailVerified
  const user = session?.user

  // Use /protected as the dashboard link - it will redirect to the correct dashboard server-side
  // This avoids race conditions where isAdmin hasn't loaded yet
  const dashboardPath = useMemo(() => {
    // If we know the user's role, use the specific dashboard path for better UX
    // Otherwise, use /protected which handles the redirect server-side
    if (!isUserLoading && isAuthenticated) {
      return isAdmin
        ? ROUTE_POLICIES.ADMIN_DASHBOARD.path
        : ROUTE_POLICIES.USER_DASHBOARD.path
    }
    // While loading or not authenticated, use the generic /protected path
    return '/protected'
  }, [isAdmin, isUserLoading, isAuthenticated])

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push(ROUTES.PUBLIC.HOME)
    closeMenu()
  }

  // Handle clicks outside the sidebar to close the menu
  useEffect(() => {
    const handleMouseClickOutside = (event: MouseEvent) => {
      if (isMenuOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleTouchOutside = (event: TouchEvent) => {
      if (isMenuOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleMouseClickOutside);
    document.addEventListener('touchstart', handleTouchOutside);

    return () => {
      document.removeEventListener('mousedown', handleMouseClickOutside);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [isMenuOpen]);

  // Prevent background scrolling when menu is open
  useEffect(() => {
    // Create custom event with menu state
    const event = new CustomEvent('mobile-menu-toggle', {
      detail: { isOpen: isMenuOpen }
    });

    // Dispatch the event
    window.dispatchEvent(event);

    // Prevent background scrolling when menu is open
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);  // Get navigation items from the new configuration
  const navItems = APP_CONFIG.NAVIGATION.MAIN;
  // Use navItems directly, do not add Dashboard link
  const navigationItems: readonly NavigationItem[] = navItems;

  // After a successful login, redirect users to their role-based dashboard if they landed on an auth page
  // This is a one-time redirect, not on every navigation
  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) return;
    // If current path is an auth page, redirect to dashboard once
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      const isAuthPage = path.startsWith('/auth/') && path !== '/auth/verify'
      if (isAuthPage && dashboardPath) {
        router.replace(dashboardPath)
      }
    }
  }, [mounted, isAuthenticated, dashboardPath, router])

  // Type guard functions
  const hasHref = (item: NavigationItem): item is NavigationItem & { href: string } => {
    return item.href !== undefined;
  };

  const hasItems = (item: NavigationItem): item is NavigationItem & { items: NavigationSubItem[] } => {
    return item.items !== undefined;
  };
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Logo on the left */}
        <div className="flex items-center">
          <Link href={ROUTES.PUBLIC.HOME}>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{(getAppName() ?? "").charAt(0)}</span>
              </div>
              <span className="font-semibold text-lg text-sidebar-foreground">{getAppName()}</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation in the middle - hidden on mobile */}
        <NavigationMenu className="mx-auto hidden md:flex">
          <NavigationMenuList>
            {/* User Dashboard link only for authenticated users and only on Home page */}
            {isAuthenticated && pathname === "/" && (
              <NavigationMenuItem>
                <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                  <Link href={dashboardPath}>
                    Dashboard
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
            {navigationItems.map((item, index) => (
              hasHref(item) ? (
                // Direct link, no dropdown
                <NavigationMenuItem key={index}>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                    <Link href={item.href}>
                      {item.title}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : (
                // Dropdown menu
                <NavigationMenuItem key={index}>
                  <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-white dark:bg-neutral-700 rounded-md shadow-lg">
                      {hasItems(item) && item.items.map((subItem: NavigationSubItem, subIndex: number) => (
                        <ListItem
                          key={subIndex}
                          title={subItem.title}
                          href={subItem.href}
                        >
                          {subItem.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        {/* Right side with theme toggle and mobile menu button */}
        <div className="flex items-center gap-2">
          {/* Auth links on desktop - always show buttons first to prevent layout shift */}
          <div className="hidden md:block">
            {mounted && isAuthenticated ? (
              <UserProfileDropdown />
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href={ROUTES.AUTH.LOGIN}
                  className="text-sm font-medium text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors"
                >
                  Login
                </Link>
                <Link
                  href={ROUTES.AUTH.SIGNUP}
                  className="text-sm font-medium bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 px-4 py-2 rounded-md transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Show theme toggle only for non-authenticated users */}
          <ModeToggle />

          {/* Mobile menu button - only visible on mobile */}          <button
            onClick={toggleMenu}
            className="md:hidden relative p-2 rounded-xl hover:bg-sidebar-accent focus:outline-none focus:ring-2 focus:ring-sidebar-ring transition-all duration-200 cursor-pointer"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            <div className="relative w-5 h-5">
              <span className={`absolute inset-0 transition-all duration-300 text-sidebar-foreground ${isMenuOpen ? 'rotate-45 opacity-0' : 'rotate-0 opacity-100'}`}>
                <Menu className="h-5 w-5" />
              </span>
              <span className={`absolute inset-0 transition-all duration-300 text-sidebar-foreground ${isMenuOpen ? 'rotate-0 opacity-100' : '-rotate-45 opacity-0'}`}>
                <X className="h-5 w-5" />
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu - Only show when menu is open */}
      <>
        {/* Overlay background with blur effect */}
        <div
          className={`fixed inset-0 bg-black/20 backdrop-blur-lg z-50 md:hidden transition-all duration-300 ease-out ${isMenuOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 pointer-events-none backdrop-blur-none'
            }`}
          onClick={closeMenu}
          aria-hidden="true"
        />
        {/* Mobile menu sidebar */}
        <div
          ref={sidebarRef}
          className={`fixed inset-y-0 right-0 z-[60] w-80 bg-sidebar backdrop-blur-md shadow-2xl md:hidden h-screen flex flex-col overflow-hidden transition-all duration-300 ease-out border-l border-sidebar-border ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          {/* Menu header with improved styling */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border bg-gradient-to-r from-sidebar to-sidebar/90">
            <Link href={ROUTES.PUBLIC.HOME} className="flex items-center space-x-3" onClick={closeMenu}>
              <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{(getAppName() ?? "").charAt(0)}</span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-sidebar-foreground">
                {getAppName()}
              </h2>
            </Link>
            <button
              onClick={closeMenu}
              className="p-2 rounded-xl hover:bg-sidebar-accent transition-colors duration-200"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-sidebar-foreground" />
            </button>
          </div>
          {/* User profile section for authenticated users */}
          {mounted && isAuthenticated && (
            <div className="px-6 py-4 bg-gradient-to-r from-sidebar-accent/30 to-sidebar-accent/50 border-b border-sidebar-border">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 text-sidebar-primary-foreground dark:text-white font-semibold text-lg shadow-lg">
                    {(user?.name || user?.email)?.charAt(0).toUpperCase()}
                  </div>
                  {isEmailVerified && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Shield className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate text-sidebar-foreground">
                    {user?.name || user?.email?.split("@")[0] || "User"}
                  </div>
                  <div className="text-xs text-sidebar-foreground/70 truncate">
                    {user?.email}
                  </div>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isEmailVerified
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                      {isEmailVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Menu items with modern accordion styling */}
          <div className="flex-1 overflow-y-auto py-2">
            <div className="px-3 space-y-1">              
              {navigationItems.map((item, index) =>
              hasHref(item) ? (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl hover:bg-sidebar-accent transition-all duration-200 group text-sidebar-foreground"
                  onClick={closeMenu}
                >
                  <span>{item.title}</span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sidebar-foreground/70" />
                </Link>
              ) : (
                <Accordion key={index} type="single" collapsible className="w-full">
                  <AccordionItem value={`item-${index}`} className="border-none">
                    <AccordionTrigger className="px-4 py-3 text-sm font-medium rounded-xl hover:bg-sidebar-accent transition-all duration-200 hover:no-underline [&[data-state=open]>svg]:rotate-90 text-sidebar-foreground">
                      {item.title}
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-2">
                      <div className="space-y-1 ml-4">
                        {hasItems(item) && item.items.map((subItem: NavigationSubItem, subIndex: number) => (
                          <Link
                            key={`${index}-${subIndex}`}
                            href={subItem.href}
                            className="flex items-center justify-between px-4 py-2.5 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground rounded-lg hover:bg-sidebar-accent/50 transition-all duration-200 group"
                            onClick={closeMenu}
                          >
                            <span>{subItem.title}</span>
                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )
            )}
            </div>
            {/* Authentication and user actions - always show auth buttons first */}
            <div className="px-3 mt-6 pt-4 border-t border-border/20">
              {mounted && isAuthenticated ? (
                <div className="space-y-2">
                  {/* Dashboard link for authenticated users - only on home page */}
                  {pathname === "/" && (
                    <Link
                      href={dashboardPath}
                      onClick={closeMenu}
                      className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted/60 dark:hover:bg-slate-800/60 transition-all duration-200 group text-foreground"
                    >
                      <div className="flex items-center space-x-3">
                        <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                        <span>Dashboard</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground" />
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={closeMenu}
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted/60 dark:hover:bg-slate-800/60 transition-all duration-200 group text-foreground"
                  >
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>Profile</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/settings"
                    onClick={closeMenu}
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted/60 dark:hover:bg-slate-800/60 transition-all duration-200 group text-foreground"
                  >
                    <div className="flex items-center space-x-3">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span>Settings</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground" />
                  </Link>
                  <button
                    className="flex items-center space-x-3 w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href={ROUTES.AUTH.LOGIN}
                    onClick={closeMenu}
                    className="flex items-center justify-center px-4 py-3 text-sm font-medium bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-950 dark:hover:from-slate-700 dark:hover:to-slate-900 transition-all duration-200 shadow-lg"
                  >
                    <span>Login</span>
                  </Link>
                  <Link
                    href={ROUTES.AUTH.SIGNUP}
                    onClick={closeMenu}
                    className="flex items-center justify-center px-4 py-3 text-sm font-medium bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-950 dark:hover:from-slate-700 dark:hover:to-slate-900 transition-all duration-200 shadow-lg"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>          
          {/* Footer with theme toggle */}
          <div className="px-6 py-4 border-t border-border/20 bg-gradient-to-r from-muted/30 to-muted/50 dark:from-slate-200/30 dark:to-slate-700/30">
            <div className="flex items-center justify-between">
              <ModeToggle />
            </div>
          </div>
        </div>
      </>
    </div>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          href={href || "#"}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"