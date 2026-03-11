import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { CommandPalette } from "@/components/CommandPalette";

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />

      <div className="flex-1 min-w-0 overflow-x-hidden overflow-hidden isolate flex flex-col relative">
        {/* Le composant gère désormais lui-même sa position et ses limites (drag) */}
        <CommandPalette />

        {/* Main content */}
        <div className="flex-1 min-w-0 overflow-x-clip overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
