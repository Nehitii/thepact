import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { CommandPalette } from "@/components/CommandPalette";
import { CoachPanel } from "@/components/coach/CoachPanel";
import { ReviewRitualModal } from "@/components/reflect/ReviewRitualModal";
import type { ReviewType } from "@/hooks/useReviews";
import { useEffect, useState } from "react";
import { Bot } from "lucide-react";
import { ShortcutHelpOverlay, SHORTCUT_HELP_EVENT } from "@/components/ShortcutHelpOverlay";

export function AppLayout() {
  const [coachOpen, setCoachOpen] = useState(false);
  const [ritualType, setRitualType] = useState<ReviewType | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setCoachOpen((v) => !v);
        return;
      }
      // Avoid stealing keys while typing
      const t = e.target as HTMLElement | null;
      const inEditable =
        !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

      // Shortcut help: "?" or Ctrl+/ (only outside inputs)
      if (!inEditable && ((e.key === "?" || (e.shiftKey && e.key === "/")) || ((e.ctrlKey || e.metaKey) && e.key === "/"))) {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        return;
      }

      if (inEditable) return;
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
    const onOpenHelp = () => setShortcutsOpen(true);
    window.addEventListener(SHORTCUT_HELP_EVENT, onOpenHelp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(SHORTCUT_HELP_EVENT, onOpenHelp);
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full relative">
      <CommandPalette />
      <AppSidebar />

      <div className="flex-1 min-w-0 overflow-x-hidden overflow-hidden isolate flex flex-col">
        <main className="flex-1 min-w-0 overflow-x-clip overflow-y-auto relative z-0 mobile-nav-spacer">
          <Outlet />
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

      <ShortcutHelpOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
