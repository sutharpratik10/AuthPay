"use client"
import * as React from "react"
import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { APP_CONFIG } from "@/lib/constants"
import { getAppName } from "@/lib/config"
import type { NavigationItem, NavigationSubItem } from "@/lib/constants" 
import { Menu, X, ChevronRight, User, Settings, LogOut, Shield } from "lucide-react"
import { useAuth } from "@/lib"
import { ROUTES } from "@/routes/routeUtils"
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
import { ModeToggle } from "@/components/mode-toggle"
import { UserProfileDropdown } from "@/components/UserProfileDropdown"

export function Navigationbar() {
  const { isAuthenticated, isEmailVerified, user, logout, loading } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const sidebarRef = React.useRef<HTMLDivElement>(null)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
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
  }, [isMenuOpen]);

  // Get navigation items from the new configuration
  const navItems = APP_CONFIG.NAVIGATION.MAIN;
  
  // Add Dashboard link for authenticated users, but only once and not if already present in navItems
  const dashboardLink = { title: "Dashboard", href: ROUTES.PROTECTED.DASHBOARD };
  const navItemsHasDashboard = navItems.some(item => item.title === "Dashboard" && item.href === ROUTES.PROTECTED.DASHBOARD);
  const navigationItems: readonly NavigationItem[] = isAuthenticated && !navItemsHasDashboard
    ? [dashboardLink, ...navItems]
    : navItems;

  // Type guard functions
  const hasHref = (item: NavigationItem): item is NavigationItem & { href: string } => {
    return item.href !== undefined;
  };

  const hasItems = (item: NavigationItem): item is NavigationItem & { items: NavigationSubItem[] } => {
    return item.items !== undefined;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-neutral-800 border-b border-border/40">
      <div className="flex items-center justify-between h-16 px-4">        
        {/* Logo on the left */}          
        <div className="flex items-center">
          <Link href={ROUTES.PUBLIC.HOME}>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{(getAppName() ?? "").charAt(0)}</span>
              </div>
              <span className="font-semibold text-lg">{getAppName()}</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation in the middle - hidden on mobile */}
        <NavigationMenu className="mx-auto hidden md:flex">
          <NavigationMenuList>
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
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-primary dark:bg-neutral-700 rounded-md shadow-lg">
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
          {/* Auth links on desktop */}
          <div className="hidden md:block">
            {!loading && !isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  href={ROUTES.AUTH.LOGIN}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Login
                </Link>
                <Link
                  href={ROUTES.AUTH.SIGNUP}
                  className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            ) : !loading && isAuthenticated ? (
              <UserProfileDropdown />
            ) : null}
          </div>

          {/* Show theme toggle only for non-authenticated users */}
          {!isAuthenticated && <ModeToggle />}
          
          {/* Mobile menu button - only visible on mobile */}
          <button
            onClick={toggleMenu}
            className="md:hidden relative p-2 rounded-xl hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            <div className="relative w-5 h-5">
              <span className={`absolute inset-0 transition-all duration-300 ${isMenuOpen ? 'rotate-45 opacity-0' : 'rotate-0 opacity-100'}`}>
                <Menu className="h-5 w-5" />
              </span>
              <span className={`absolute inset-0 transition-all duration-300 ${isMenuOpen ? 'rotate-0 opacity-100' : '-rotate-45 opacity-0'}`}>
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
          className={`fixed inset-0 bg-black/20 backdrop-blur-lg z-50 md:hidden transition-all duration-300 ease-out ${
            isMenuOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 pointer-events-none backdrop-blur-none'
          }`}
          onClick={closeMenu}
          aria-hidden="true"
        />

        {/* Mobile menu sidebar */}
        <div 
          ref={sidebarRef}
          className={`fixed inset-y-0 right-0 z-[60] w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl md:hidden h-screen flex flex-col overflow-hidden transition-all duration-300 ease-out border-l border-border/20 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Menu header with improved styling */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30">
            <Link href={ROUTES.PUBLIC.HOME} className="flex items-center space-x-3" onClick={closeMenu}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{(getAppName() ?? "").charAt(0)}</span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight">
                {getAppName()}
              </h2>
            </Link>
            <button
              onClick={closeMenu}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User profile section for authenticated users */}
          {!loading && isAuthenticated && (
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50/30 to-purple-50/30 dark:from-blue-950/20 dark:to-purple-950/20 border-b border-border/20">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                    {(user?.name || user?.email)?.charAt(0).toUpperCase()}
                  </div>
                  {isEmailVerified && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Shield className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {user?.name || user?.email?.split("@")[0] || "User"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </div>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isEmailVerified 
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
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl hover:bg-accent/50 transition-all duration-200 group"
                    onClick={closeMenu}
                  >
                    <span>{item.title}</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </Link>
                ) : (
                  <Accordion key={index} type="single" collapsible className="w-full">
                    <AccordionItem value={`item-${index}`} className="border-none">
                      <AccordionTrigger className="px-4 py-3 text-sm font-medium rounded-xl hover:bg-accent/50 transition-all duration-200 hover:no-underline [&[data-state=open]>svg]:rotate-90">
                        {item.title}
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-2">
                        <div className="space-y-1 ml-4">
                          {hasItems(item) && item.items.map((subItem: NavigationSubItem, subIndex: number) => (
                            <Link 
                              key={`${index}-${subIndex}`}
                              href={subItem.href} 
                              className="flex items-center justify-between px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/30 transition-all duration-200 group"
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

            {/* Authentication and user actions */}
            <div className="px-3 mt-6 pt-4 border-t border-border/20">
              {!loading && !isAuthenticated ? (
                <div className="space-y-2">
                  <Link 
                    href={ROUTES.AUTH.LOGIN} 
                    onClick={closeMenu}
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl hover:bg-accent/50 transition-all duration-200 group"
                  >
                    <span>Login</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </Link>
                  <Link 
                    href={ROUTES.AUTH.SIGNUP} 
                    onClick={closeMenu}
                    className="flex items-center justify-center px-4 py-3 text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : !loading && isAuthenticated ? (
                <div className="space-y-2">
                  <Link 
                    href="/profile" 
                    onClick={closeMenu}
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl hover:bg-accent/50 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </Link>
                  
                  <Link 
                    href="/settings" 
                    onClick={closeMenu}
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl hover:bg-accent/50 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </Link>
                  
                  <Link 
                    href={ROUTES.PROTECTED.DASHBOARD} 
                    onClick={closeMenu}
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl hover:bg-accent/50 transition-all duration-200 group"
                  >
                    <span>Dashboard</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </Link>
                  
                  <button 
                    className="flex items-center space-x-3 w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Footer with theme toggle */}
          <div className="px-6 py-4 border-t border-border/20 bg-gradient-to-r from-blue-50/30 to-purple-50/30 dark:from-blue-950/20 dark:to-purple-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Theme</span>
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