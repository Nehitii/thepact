import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileSidebar } from "./MobileSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex w-full">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      
      {/* Mobile Sidebar - visible only on mobile */}
      <MobileSidebar />
      
      {/* Main content - full width on mobile, offset on desktop */}
      <main className="flex-1 lg:ml-64 min-h-screen overflow-x-hidden pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
