import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { useServerAdminCheck } from "@/hooks/useServerAdminCheck";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useServerAdminCheck();

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0 overflow-x-hidden overflow-hidden isolate">
          <header className="flex h-14 items-center gap-2 border-b border-border px-4 md:hidden">
            <SidebarTrigger />
            <span className="text-sm font-orbitron font-bold text-primary tracking-wider">THE PACT</span>
          </header>
          <div className="hidden md:flex items-center justify-end px-4 py-2">
            <CommandPalette />
          </div>
          <div className="flex-1 min-w-0 overflow-x-clip">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : data?.isAdmin ? (
              children
            ) : (
              <Navigate to="/" replace />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
