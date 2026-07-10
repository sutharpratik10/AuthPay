"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarTrigger,
  SidebarFooter,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils/helpers";
import { useEffect, useState, useMemo } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { usePermissions } from "@/components/rbac/PermissionContext";


interface NavItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

export function AppSidebar() {
  const pathname = usePathname();
  const { subscriptionStatus } = useSubscription();
  const { isLoading: isPermissionsLoading, isAdmin, hasPolicy } = usePermissions();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  // Note: User validation and sign-out is handled globally by UserValidationProvider

  // Debug logging for admin status
  console.log('[AppSidebar] Render - isAdmin:', isAdmin, 'isPermissionsLoading:', isPermissionsLoading);

  const navigation: NavItem[] = useMemo(() => {
    const nav: NavItem[] = [
      {
        name: 'Dashboard',
        // Only use admin dashboard if isAdmin is true AND data has loaded
        href: (isAdmin === true && !isPermissionsLoading)
          ? '/protected/admin/dashboard'
          : '/protected/user/dashboard',
        icon: (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
      },
    ];

    // Add 'Manage Subscription' item if user has an active subscription plan
    if (subscriptionStatus?.hasSubscription) {
      nav.push({
        name: 'Manage Subscription',
        href: '/protected/user/manage-subscription',
        icon: (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M3 3h18v18H3z" />
            <path d="M9 9h6v6H9z" />
          </svg>
        ),
      });

    }

    return nav;
  }, [isAdmin, isPermissionsLoading, subscriptionStatus?.hasSubscription]);

  const [refundsEnabled, setRefundsEnabled] = useState(true);

  useEffect(() => {
    fetch('/api/public/platform-settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setRefundsEnabled(data.data.refundsEnabled);
        }
      })
      .catch(console.error);
  }, []);

  const adminNavigation: NavItem[] = useMemo(() => [
    {
      name: 'Manage Users',
      href: '/protected/admin/users',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="m22 2-5 5" />
          <path d="m16 7 5-5" />
          <circle cx="18" cy="8" r="3" />
        </svg>
      ),
    },
    {
      name: 'Manage Roles',
      href: '/protected/admin/roles',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      name: 'Manage Policies',
      href: '/protected/admin/policies',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },

    {
      name: 'Payment Gateway',
      href: '#',
      children: [
        {
          name: 'RazorPay',
          href: '/protected/admin/paymentgateway/razorpay',
          icon: (
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <path d="M9 9h6v6H9z" />
            </svg>
          ),
        },
        {
          name: 'Stripe',
          href: '/protected/admin/paymentgateway/stripe',
          icon: (
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M9.5 10c0-1.1.9-2 2-2h1.2c.9 0 1.8.5 1.8 1.6 0 .8-.5 1.3-1.2 1.5.8.2 1.4.8 1.4 1.8 0 1.2-.9 1.9-2.1 1.9H11a1.5 1.5 0 0 1-1.5-1.5V10z" />
            </svg>
          ),
        },
        {
          name: 'Settings',
          href: '/protected/admin/paymentgateway/settings',
          icon: (
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          ),
        },
        {
          name: 'Sales & Offers',
          href: '/protected/admin/paymentgateway/salesoffers',
          icon: (
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          ),
        },
      ],
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 2v6" />
          <path d="M5 7h14" />
          <path d="M6 21h12a2 2 0 0 0 2-2V9H4v10a2 2 0 0 0 2 2z" />
        </svg>
      ),
    },
    {
      name: 'Transactions',
      href: '#',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <rect x="6" y="14" width="4" height="2" rx="1" ry="1" />
        </svg>
      ),
      children: [
        {
          name: 'All Transactions',
          href: '/protected/admin/transactions',
          icon: (
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          ),
        },
        ...(refundsEnabled ? [{
          name: 'Refunds',
          href: '/protected/admin/refunds',
          icon: (
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          ),
        }] : [])
      ]
    },
  ], [hasPolicy, refundsEnabled]);

  // Combine regular navigation with admin navigation if user is admin
  // Only show admin navigation if:
  // 1. User data has finished loading (not in loading state)
  // 2. isAdmin is explicitly true (not undefined, null, or false)
  const finalNavigation = useMemo<NavItem[]>(() => {
    // Don't show admin nav while loading - wait for data
    if (isPermissionsLoading) {
      console.log('[Sidebar] User data still loading, hiding admin nav');
      return navigation;
    }
    const shouldShowAdminNav = isAdmin === true;
    console.log('[Sidebar] User loaded. isAdmin:', isAdmin, 'shouldShowAdminNav:', shouldShowAdminNav);

    // Filter admin navigation based on policies if needed
    // Currently, if they are isAdmin, we show all these items, but we can filter:
    const filteredAdminNav = adminNavigation.filter(item => {
      if (item.name === 'Manage Users' && !hasPolicy('user:manage')) return false;
      if (item.name === 'Manage Roles' && !hasPolicy('role:manage')) return false;
      if (item.name === 'Manage Policies' && !hasPolicy('policy:manage')) return false;
      return true;
    });

    return shouldShowAdminNav ? [...navigation, ...filteredAdminNav] : navigation;
  }, [isAdmin, isPermissionsLoading, navigation, adminNavigation, hasPolicy]);

  // Track which parent menu items are open (for submenus)
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  // Open any parent menu if one of its children matches the current pathname
  useEffect(() => {
    const newOpen: Record<string, boolean> = {};
    finalNavigation.forEach((item: NavItem) => {
      if (item.children && Array.isArray(item.children)) {
        const children = item.children as NavItem[];
        if (children.some((c) => pathname === c.href)) {
          newOpen[item.name] = true;
        }
      }
    });
    setOpenItems((prev) => ({ ...prev, ...newOpen }));
  }, [pathname, finalNavigation]);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader>
        <div className="flex h-16 items-center px-4">
          <Logo />
        </div>
      </SidebarHeader>
      <SidebarContent className={cn(
        "px-3",
        "group-data-[collapsible=icon]:px-2"
      )}>
        <SidebarMenu className="space-y-1">
          {finalNavigation.map((item: NavItem) => {
            // If item has children, render a collapsible submenu
            if (item.children && Array.isArray(item.children)) {
              const children = item.children as NavItem[];
              const anyActiveChild = children.some((c) => pathname === c.href);
              const open = !!openItems[item.name];

              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.name}
                    className={cn(
                      "w-full h-11 px-3 rounded-lg transition-all duration-200 relative group",
                      "group-data-[collapsible=icon]:px-0",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm hover:scale-[1.02]",
                      "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-0 focus-visible:outline-none",
                      anyActiveChild && "bg-sidebar-accent text-sidebar-accent-foreground shadow-md font-medium dark:bg-sidebar-accent/90 dark:text-sidebar-accent-foreground"
                    )}
                    data-active={anyActiveChild}>
                    <button
                      onClick={() => setOpenItems((prev) => ({ ...prev, [item.name]: !prev[item.name] }))}
                      className="flex items-center w-full min-w-0 text-left">
                      <div className={cn(
                        "flex items-center justify-center flex-shrink-0 transition-colors duration-200",
                        "w-5 h-5 mr-1",
                        "group-data-[collapsible=icon]:w-5 group-data-[collapsible=icon]:mr-0",
                        anyActiveChild ? "text-sidebar-accent-foreground dark:text-white" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"
                      )}>
                        <div className="w-4 h-4 flex items-center justify-center">
                          {item.icon}
                        </div>
                      </div>
                      <span className={cn(
                        "text-sm font-medium transition-all duration-200 truncate flex-1",
                        "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden",
                        anyActiveChild ? "text-sidebar-accent-foreground dark:text-white" : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                      )}>
                        {item.name}
                      </span>
                      <svg className={cn("w-3 h-3 ml-2 transform origin-center transition-all duration-200", open ? "rotate-90" : "rotate-0", "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:ml-0")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 6 15 12 9 18" />
                      </svg>
                    </button>
                  </SidebarMenuButton>

                  <SidebarMenuSub className={cn(
                    "space-y-1 pl-8 transform origin-top transition-all duration-600 overflow-hidden",
                    open ? "translate-y-0 opacity-100 pointer-events-auto max-h-96" : "-translate-y-1 opacity-0 pointer-events-none max-h-0"
                  )}>
                    {children.map((child: NavItem) => {
                      const isActiveChild = pathname === child.href;
                      return (
                        <SidebarMenuItem key={child.name}>
                          <SidebarMenuButton
                            asChild
                            tooltip={child.name}
                            className={cn(
                              "w-full h-9 px-3 rounded-lg transition-all duration-200 relative group",
                              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm",
                              isActiveChild && "bg-sidebar-accent text-sidebar-accent-foreground shadow-md font-medium dark:bg-sidebar-accent/90 dark:text-sidebar-accent-foreground"
                            )}
                            data-active={isActiveChild}>
                            <Link href={child.href} className="flex items-center w-full">
                              <div className={cn(
                                "flex items-center justify-center flex-shrink-0 transition-colors duration-200",
                                "w-4 h-4 mr-1",
                                isActiveChild ? "text-sidebar-accent-foreground dark:text-white" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"
                              )}>
                                <div className="w-3 h-3 flex items-center justify-center">
                                  {child.icon}
                                </div>
                              </div>
                              <span className={cn(
                                "text-sm font-medium truncate",
                                isActiveChild ? "text-sidebar-accent-foreground dark:text-white" : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                              )}>
                                {child.name}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              );
            }

            const isActive = pathname === item.href;
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.name}
                  className={cn(
                    "w-full h-11 px-3 rounded-lg transition-all duration-200 relative group",
                    "group-data-[collapsible=icon]:px-0",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm hover:scale-[1.02]",
                    "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-0 focus-visible:outline-none",
                    "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-md dark:data-[active=true]:bg-sidebar-accent/90 dark:data-[active=true]:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-md font-medium dark:bg-sidebar-accent/90 dark:text-sidebar-accent-foreground",
                    isActive && "before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-sidebar-accent before:rounded-r dark:before:bg-sidebar-accent/90"
                  )}
                  data-active={isActive}>
                  <Link href={item.href} className={cn(
                    "flex items-center w-full min-w-0",
                    "group-data-[collapsible=icon]:justify-center"
                  )}>
                    <div className={cn(
                      "flex items-center justify-center flex-shrink-0 transition-colors duration-200",
                      "w-5 h-5 mr-2",
                      "group-data-[collapsible=icon]:w-5 group-data-[collapsible=icon]:mr-0",
                      isActive
                        ? "text-sidebar-accent-foreground dark:text-white"
                        : "text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground"
                    )}>
                      <div className="w-4 h-4 flex items-center justify-center">
                        {item.icon}
                      </div>
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-all duration-200 truncate",
                      "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:sr-only",
                      isActive ? "text-sidebar-accent-foreground dark:text-white" : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                    )}>
                      {item.name}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <div className="flex">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger className="mb-1.5 h-8 w-8 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-0 focus-visible:outline-none" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 lg:hidden">
          <SidebarTrigger className="h-8 w-8 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-0 focus-visible:outline-none" />
          <div className="flex items-center gap-2">
            <Logo showName={false} size="sm" />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 container max-w-7xl mx-auto w-full px-4 py-6 lg:px-8">
            <div className="h-full">
              {children}
            </div>
          </div>

          {/* Footer */}
          <footer className="shrink-0 border-t bg-muted/30 px-4 py-3 lg:px-8">
            <div className="container max-w-7xl mx-auto">
              <p className="text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME}. All rights reserved.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default SidebarLayout;