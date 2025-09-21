"use client"
import { ProtectedRoute } from "@/routes/protectedRoutes";
import { 
  SidebarProvider, 
  SidebarTrigger, 
  SidebarInset,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { AppSidebar } from "@/components/SidebarMenu";

function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <SidebarInset className="flex-1">        
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 lg:hidden">
          <SidebarTrigger className="h-8 w-8 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-0 focus-visible:outline-none" />
        </header>
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 mx-auto w-full px-4 py-6 lg:px-8">
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
        <Toaster />
      </SidebarProvider>
    </ProtectedRoute>
  );
}