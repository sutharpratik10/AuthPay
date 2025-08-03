"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/routes/protectedRoutes"
import { ROUTES } from "@/routes/routeUtils"
import { 
  Sidebar, 
  SidebarProvider, 
  SidebarTrigger, 
  SidebarFooter, 
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { getAppName } from "@/lib/config"
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface SubscriptionStatus {
  hasSubscription: boolean;
  planName?: string;
  status?: string;
  price?: string;
  billingCycle?: string;
  expiryDate?: string;
}

function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  // Check if user has admin role
  useEffect(() => {    const checkAdminRole = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/user/admin-status');
          const data = await response.json();
          
          if (data.success) {
            setIsAdmin(data.data.isAdmin);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, [session?.user?.id]);

  // Check user subscription status
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/user/subscription-status');
          const data = await response.json();
          
          if (data.success) {
            setSubscriptionStatus(data.data);
          } else {
            setSubscriptionStatus(null);
          }
        } catch (error) {
          console.error('Error fetching subscription status:', error);
          setSubscriptionStatus(null);
        }
      } else {
        setSubscriptionStatus(null);
      }
    };

    fetchSubscriptionStatus();
  }, [session?.user?.id]);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/protected/dashboard',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
    },
    {
      name: 'Profile',
      href: '/protected/profile',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4"/>
          <path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
        </svg>
      ),
    },
    {
      name: 'Settings',
      href: '/protected/settings',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09c.7 0 1.3-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06c.46.46 1.12.6 1.82.33h.09c.7 0 1.3-.4 1.51-1V3a2 2 0 0 1 4 0v.09c0 .7.4 1.3 1 1.51.7.27 1.36.13 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82c.27.7.13 1.36-.33 1.82-.21.61-.81 1.01-1.51 1.01z"/>
        </svg>
      ),
    },
  ];
  // Add admin navigation items if user is admin
  const adminNavigation = [
    {
      name: 'Manage Users',
      href: '/protected/admin/users',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="m22 2-5 5"/>
          <path d="m16 7 5-5"/>
          <circle cx="18" cy="8" r="3"/>
        </svg>
      ),
    },
    {
      name: 'Subscription Plans',
      href: '/protected/admin/subscription-plans',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <path d="M9 9h6v6H9z"/>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <path d="M21 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4"/>
        </svg>
      ),
    },
  ];

  // Add 'Manage Subscription' item if user has an active subscription plan
  if (subscriptionStatus?.hasSubscription) {
    navigation.push({
      name: 'Manage Subscription',
      href: '/protected/manage-subscription',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M3 3h18v18H3z" />
          <path d="M9 9h6v6H9z" />
        </svg>
      ),
    });
  }

  // Combine regular navigation with admin navigation if user is admin
  const finalNavigation = isAdmin ? [...navigation, ...adminNavigation] : navigation;
  
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-16 items-center px-4">
          <Link href={ROUTES.PUBLIC.HOME} className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white font-bold text-sm">{(getAppName() ?? "").charAt(0)}</span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              {getAppName()}
            </h2>
          </Link>
        </div>      
      </SidebarHeader>
      <SidebarContent className={cn(
        "px-3 py-4",
        "group-data-[collapsible=icon]:px-2" // Reduce padding in collapsed state for better centering
      )}>        <SidebarMenu className="space-y-1">
          {finalNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  className={cn(
                    "w-full h-11 px-3 rounded-lg transition-all duration-200 relative group",
                    "group-data-[collapsible=icon]:px-0", // Remove horizontal padding in collapsed state
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm hover:scale-[1.02]",
                    "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-0 focus-visible:outline-none",
                    "data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-md",
                    isActive && "bg-sidebar-primary text-sidebar-primary-foreground shadow-md font-medium",
                    // Active state indicator
                    isActive && "before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-sidebar-primary before:rounded-r"
                  )}
                  data-active={isActive}>
                  <Link href={item.href} className={cn(
                    "flex items-center w-full min-w-0",
                    "group-data-[collapsible=icon]:justify-center" // Center the entire link in collapsed state
                  )}>
                    <div className={cn(
                      "flex items-center justify-center flex-shrink-0 transition-colors duration-200",
                      "w-5 h-5 mr-3", // Normal state spacing
                      "group-data-[collapsible=icon]:w-5 group-data-[collapsible=icon]:mr-0", // Collapsed state - maintain icon size
                      isActive 
                        ? "text-sidebar-primary-foreground" 
                        : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"
                    )}>
                      <div className="w-4 h-4 flex items-center justify-center">
                        {item.icon}
                      </div>
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-all duration-200 truncate",
                      "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:sr-only",
                      isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
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
          "group-data-[collapsible=icon]:px-2" // Reduce padding in collapsed state
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
      <SidebarInset className="flex-1">        
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 lg:hidden">
          <SidebarTrigger className="h-8 w-8 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-0 focus-visible:outline-none" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-md flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs">{(getAppName() ?? "").charAt(0)}</span>
            </div>
            <span className="text-sm font-semibold">{getAppName()}</span>
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
                © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME || "RoleKit"}. All rights reserved.
              </p>
            </div>
          </footer>
        </main>
      </SidebarInset>
    </div>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {  return (
    <ProtectedRoute>
      <SidebarProvider>
        <SidebarLayout>{children}</SidebarLayout>
        <Toaster />
      </SidebarProvider>
    </ProtectedRoute>
  );
}