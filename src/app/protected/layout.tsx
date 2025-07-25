"use client"
import { ProtectedRoute } from "@/routes/protectedRoutes"
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
  useSidebar 
} from "@/components/ui/sidebar";

function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 mt-10">
        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">RoleKit</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <nav className="flex-1 p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/protected/dashboard" className="flex items-center gap-2">
                  <span className="sidebar-icon">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  </span>
                  <span>Dashboard</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/protected/profile" className="flex items-center gap-2">
                  <span className="sidebar-icon">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
                    </svg>
                  </span>
                  <span>Profile</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/protected/settings" className="flex items-center gap-2">
                  <span className="sidebar-icon">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09c.7 0 1.3-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06c.46.46 1.12.6 1.82.33h.09c.7 0 1.3-.4 1.51-1V3a2 2 0 0 1 4 0v.09c0 .7.4 1.3 1 1.51.7.27 1.36.13 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82c.27.7.13 1.36-.33 1.82-.21.61-.81 1.01-1.51 1.01z"/>
                    </svg>
                  </span>
                  <span>Settings</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </nav>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-2">
          <SidebarTrigger />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset>
        {/* Header with mobile trigger - visible only on mobile */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger />
        </header>
        
        <main className="flex-1 flex flex-col">
          <div className="container max-w-7xl mx-auto w-full h-full px-4 py-6">
            {children}
          </div>
          
          <footer className="w-full text-center text-xs text-muted-foreground py-4 border-t border-muted mt-auto">
            © {new Date().getFullYear()} RoleKit. All rights reserved.
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
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <SidebarLayout>{children}</SidebarLayout>
      </SidebarProvider>
    </ProtectedRoute>
  );
}