import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { CommandPalette } from "@/components/CommandPalette";

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full relative">
      {/* La palette est maintenant à la racine du layout.
        Elle n'est plus bloquée par la classe "isolate" du contenu.
        Elle passera par-dessus la Sidebar et le contenu principal.
      */}
      <CommandPalette />

      <AppSidebar />

      <div className="flex-1 min-w-0 overflow-x-hidden overflow-hidden isolate flex flex-col">
        <main className="flex-1 min-w-0 overflow-x-clip overflow-y-auto relative z-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
