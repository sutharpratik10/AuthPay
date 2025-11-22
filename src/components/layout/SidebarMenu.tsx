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
} from "@/components/ui/sidebar";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils/helpers";
import { signOut } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useUserStatus } from "@/hooks/use-UserStatus";
import { useUserValidation } from "@/hooks/use-UserValidation";


interface NavItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

export function AppSidebar() {
  const pathname = usePathname();
  const { subscriptionStatus } = useSubscription();
  const { isAdmin } = useUserStatus();
  const { exists, shouldSignOut } = useUserValidation();

  // Handle user validation - sign out if user doesn't exist in database
  useEffect(() => {
    if (shouldSignOut && !exists) {
      signOut({ callbackUrl: '/auth/signin' });
    }
  }, [shouldSignOut, exists]);

  const navigation: NavItem[] = useMemo(() => {
    const nav: NavItem[] = [
      {
        name: 'Dashboard',
        href: isAdmin
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
  }, [isAdmin, subscriptionStatus?.hasSubscription]);

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
      href: '/protected/admin/transactions',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <rect x="6" y="14" width="4" height="2" rx="1" ry="1" />
        </svg>
      ),
    },
  ], []);



  // Combine regular navigation with admin navigation if user is admin
  const finalNavigation = useMemo<NavItem[]>(() => (isAdmin ? [...navigation, ...adminNavigation] : navigation), [isAdmin, navigation, adminNavigation]);
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
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-16 items-center px-4">
          <Logo />
        </div>
      </SidebarHeader>
      <SidebarContent className={cn(
        "px-3 py-4",
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
                        "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:sr-only",
                        anyActiveChild ? "text-sidebar-accent-foreground dark:text-white" : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                      )}>
                        {item.name}
                      </span>
                      <svg className={cn("w-3 h-3 ml-2 transform origin-center transition-transform duration-200", open ? "rotate-90" : "rotate-0")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <SidebarFooter className={cn(
        "border-t border-sidebar-border p-4",
        "group-data-[collapsible=icon]:px-2"
      )}>
        <div className={cn(
          "flex",
        )}>
          <SidebarTrigger className="h-8 w-8 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-0 focus-visible:outline-none" />
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