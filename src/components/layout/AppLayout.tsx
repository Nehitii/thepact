import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Mobile header with trigger */}
        <header className="flex h-14 items-center gap-2 border-b border-border px-4 md:hidden">
          <SidebarTrigger />
          <span className="text-sm font-orbitron font-bold text-primary tracking-wider">THE PACT</span>
        </header>

        {/* Main content */}
        <div className="flex-1 min-w-0 overflow-x-clip">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
