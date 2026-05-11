import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { CommandPalette } from "@/components/CommandPalette";
import { CoachPanel } from "@/components/coach/CoachPanel";
import { ReviewRitualModal } from "@/components/reflect/ReviewRitualModal";
import type { ReviewType } from "@/hooks/useReviews";
import { Suspense, useEffect, useState } from "react";
import { Bot } from "lucide-react";

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export function AppLayout() {
  const [coachOpen, setCoachOpen] = useState(false);
  const [ritualType, setRitualType] = useState<ReviewType | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setCoachOpen((v) => !v);
        return;
      }
      // Avoid stealing keys while typing
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "F7") {
        e.preventDefault();
        setRitualType("daily");
      } else if (e.key === "F8") {
        e.preventDefault();
        setRitualType("monthly");
      } else if (e.key === "F9") {
        e.preventDefault();
        setRitualType("quarterly");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen w-full relative">
      <CommandPalette />
      <AppSidebar />

      <div className="flex-1 min-w-0 overflow-x-hidden overflow-hidden isolate flex flex-col">
        <main className="flex-1 min-w-0 overflow-x-clip overflow-y-auto relative z-0 mobile-nav-spacer">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <MobileBottomNav />

      {/* Floating Coach trigger */}
      <button
        type="button"
        onClick={() => setCoachOpen(true)}
        aria-label="Ouvrir le Coach IA (Cmd+J)"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[80] h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 transition-transform flex items-center justify-center"
      >
        <Bot className="h-5 w-5" />
      </button>

      <CoachPanel open={coachOpen} onClose={() => setCoachOpen(false)} />

      {ritualType && (
        <ReviewRitualModal
          open={!!ritualType}
          onClose={() => setRitualType(null)}
          type={ritualType}
        />
      )}
    </div>
  );
}
