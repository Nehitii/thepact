import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full relative">
      <CommandPalette />
      <AppSidebar />

      <div className="flex-1 min-w-0 overflow-x-hidden overflow-hidden isolate flex flex-col">
        <main className="flex-1 min-w-0 overflow-x-clip overflow-y-auto relative z-0">
          <Suspense fallback={<PageFallback />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
