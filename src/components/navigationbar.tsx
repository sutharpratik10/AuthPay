"use client"

import * as React from "react"
import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { NavigationService, ProjectInfo } from "@/lib/constants" 
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  // Get navigation items directly from the service
  const navItems = NavigationService.navigationItems;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 border-b border-border/40">        
        {/* Logo on the left */}        
        <div className="flex items-center">
          <Link href={ROUTES.PUBLIC.HOME}>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-lg">{ProjectInfo.companyName}</span>
            </div>
          </Link>
        </div>
        
        {/* Desktop Navigation in the middle - hidden on mobile */}
        <NavigationMenu className="mx-auto hidden md:flex">
          <NavigationMenuList>
            {navItems.map((item, index) => (
              item.href ? (
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
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {item.items?.map((subItem, subIndex) => (
                        <ListItem
                          key={subIndex}
                          title={subItem.title}
                          href={subItem.href || ''}
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
        <div className="flex items-center gap-2">          {/* Auth links on desktop */}
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
              <div className="flex items-center space-x-4">
                {/* Show user email and verification status */}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">{user?.email}</span>
                  {!isEmailVerified && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded-full">
                      Pending Verification
                    </span>
                  )}
                  {isEmailVerified && (
                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
                <Link
                  href={ROUTES.PROTECTED.DASHBOARD}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            ) : null}
          </div>

          <ModeToggle />
          
          {/* Mobile menu button - only visible on mobile */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile menu - Only show when menu is open */}
      <>
        {/* Overlay background */}
        <div 
          className={`fixed inset-0 bg-background/70 backdrop-blur-md z-50 md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-100 backdrop-blur-md' : 'opacity-0 pointer-events-none'}`}
          onClick={closeMenu}
          aria-hidden="true"
        />        {/* Mobile menu sidebar */}
        <div 
          ref={sidebarRef}
          className={`fixed inset-y-0 right-0 z-[60] w-64 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-xl md:hidden h-screen flex flex-col overflow-x-hidden transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >          {/* Menu header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-zinc-800">
            <Link href={ROUTES.PUBLIC.HOME} className="flex items-center space-x-2" onClick={closeMenu}>
              <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                {ProjectInfo.companyName}
              </h2>
            </Link>
            <button
              onClick={closeMenu}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-900 dark:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Menu items with accordion dropdowns */}
          <div className="py-4 flex-1 overflow-y-auto overflow-x-hidden">
            <Accordion type="single" collapsible className="w-full">
              {navItems.map((item, index) => 
                item.href ? (                  <div key={index} className="mb-1 px-4">
                    <Link 
                      href={item.href}
                      className="block py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md px-3"
                      onClick={closeMenu}
                    >
                      {item.title}
                    </Link>
                  </div>
                ) : (                <AccordionItem key={index} value={`item-${index}`} className="border-none">
                    <AccordionTrigger className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-all duration-300 ease-in-out">
                      {item.title}
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-2">
                      <div className="space-y-1">
                        {item.items?.map((subItem, subIndex) => (                          <Link 
                            key={`${index}-${subIndex}`}
                            href={subItem.href || ''} 
                            className="flex items-center pl-8 pr-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md mx-4 transition-all duration-300 ease-in-out hover:translate-x-[5px]"
                            onClick={closeMenu}
                          >
                            <span>{subItem.title}</span>
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              )}
            </Accordion>            {/* Authentication Links */}
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-zinc-800 px-4">
              <div className="flex flex-col space-y-2">
                {!loading && !isAuthenticated ? (
                  <>
                    <Link 
                      href={ROUTES.AUTH.LOGIN} 
                      onClick={closeMenu}
                      className="block py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md px-3"
                    >
                      Login
                    </Link>
                    <Link 
                      href={ROUTES.AUTH.SIGNUP} 
                      onClick={closeMenu}
                      className="block py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md px-3"
                    >
                      Sign Up
                    </Link>
                  </>
                ) : !loading && isAuthenticated ? (
                  <>
                    {/* User info section */}
                    <div className="px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-md">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.email}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {!isEmailVerified ? (
                          <span className="text-yellow-600 dark:text-yellow-400">
                            ⚠️ Pending verification
                          </span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">
                            ✅ Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <Link 
                      href={ROUTES.PROTECTED.DASHBOARD} 
                      onClick={closeMenu}
                      className="block py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md px-3"
                    >
                      Dashboard
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="justify-start w-full py-2 h-auto font-medium text-gray-900 dark:text-white text-left rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </>
                ) : null}
              </div>
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
