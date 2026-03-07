import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { CommandPalette } from "@/components/CommandPalette";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-x-hidden overflow-hidden isolate">
        {/* Mobile header with trigger */}
        <header className="flex h-14 items-center gap-2 border-b border-border px-4 md:hidden">
          <SidebarTrigger />
          <span className="text-sm font-orbitron font-bold text-primary tracking-wider">THE PACT</span>
        </header>

        {/* Command Palette trigger in top bar (desktop) */}
        <div className="hidden md:flex items-center justify-end px-4 py-2">
          <CommandPalette />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 overflow-x-clip">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
