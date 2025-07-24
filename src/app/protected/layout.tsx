"use client"

import { ProtectedRoute } from "@/routes/protectedRoutes"
import { Sidebar, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";

function SidebarContent({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar
        collapsible="icon"
        className="bg-sidebar text-sidebar-foreground border-r border-muted flex-shrink-0 flex flex-col pt-16 relative"
        style={{ '--sidebar-width-icon': '64px' } as React.CSSProperties}
      >
        <div className="absolute top-4 right-4 z-10">
          <SidebarTrigger />
        </div>
        <nav className="flex-1">
          <ul className="p-6 space-y-2">
            <li>
              <a className="flex py-2 rounded hover:bg-muted transition" href="/protected/dashboard">
                <span className="sidebar-icon">
                  {/* Dashboard icon */}
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </span>
                {!isCollapsed && <span className="sidebar-label ml-2">Dashboard</span>}
              </a>
            </li>
            <li>
              <a className="flex py-2 rounded hover:bg-muted transition" href="/protected/profile">
                <span className="sidebar-icon">
                  {/* Profile icon */}
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>
                </span>
                {!isCollapsed && <span className="sidebar-label ml-2">Profile</span>}
              </a>
            </li>
            <li>
              <a className="flex py-2 rounded hover:bg-muted transition" href="/protected/settings">
                <span className="sidebar-icon">
                  {/* Settings icon */}
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09c.7 0 1.3-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06c.46.46 1.12.6 1.82.33h.09c.7 0 1.3-.4 1.51-1V3a2 2 0 0 1 4 0v.09c0 .7.4 1.3 1 1.51.7.27 1.36.13 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82c.27.7.13 1.36-.33 1.82-.21.61-.81 1.01-1.51 1.01z"/></svg>
                </span>
                {!isCollapsed && <span className="sidebar-label ml-2">Settings</span>}
              </a>
            </li>
          </ul>
        </nav>
        <div className="p-6">
          <UserProfileDropdown />
        </div>
      </Sidebar>
      <main className="flex-1 flex flex-col items-start py-8 md:py-12 w-full h-full">
        <div className="container max-w-7xl mx-auto w-full h-full">
          {children}
        </div>
      </main>
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
        <SidebarContent>{children}</SidebarContent>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
