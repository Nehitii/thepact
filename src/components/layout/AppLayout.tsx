import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileSidebar } from "./MobileSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex w-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Main content - On aligne le margin-left (ml) sur la largeur de la sidebar (72) */}
      <main className="flex-1 lg:ml-72 min-h-screen overflow-x-hidden pt-16 lg:pt-0">{children}</main>
    </div>
  );
}
