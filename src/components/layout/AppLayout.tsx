import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { CommandPalette } from "@/components/CommandPalette";
import { ReviewRitualModal } from "@/components/reflect/ReviewRitualModal";
import type { ReviewType } from "@/hooks/useReviews";
import { lazy, Suspense, useEffect, useState } from "react";
import { ReseauMia, type EtatMia } from "@/components/mia/ReseauMia";
import { ShortcutHelpOverlay, SHORTCUT_HELP_EVENT } from "@/components/ShortcutHelpOverlay";
import { prefetchAllRoutes } from "@/lib/prefetchRoutes";
import { prefetchCoreData } from "@/lib/prefetchData";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

const MiaConsole = lazy(() =>
  import("@/components/mia/MiaConsole").then((m) => ({ default: m.MiaConsole }))
);

export function AppLayout() {
  const [miaOuverte, setMiaOuverte] = useState(false);
  /* La vignette montre ce que M.I.A fait : c est la console qui le
     sait, elle le remonte. Fermee alors qu une reponse vient
     d arriver, la vignette reste allumee. */
  const [etatMia, setEtatMia] = useState<EtatMia>("repos");
  const [ritualType, setRitualType] = useState<ReviewType | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setMiaOuverte((v) => !v);
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

  // Background prefetch of route chunks once the authenticated shell has mounted.
  // Runs during idle time, one chunk at a time, and skipped on Save-Data / 2g.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) prefetchAllRoutes();
    }, 1500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  // Background data prefetch — runs AFTER the code prefetch starts, so the
  // initial render is never delayed. Re-uses the page hooks' queryKey+queryFn,
  // skipped on Save-Data / 2g, and bounded to a known set of core pages.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) prefetchCoreData(queryClient, user.id);
    }, 4000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [user?.id, queryClient]);

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

      {/* LA VIGNETTE DE M.I.A.
          C etait un rond bleu plein portant le petit robot a antennes
          de lucide — celui de dix mille applications — et il ne disait
          jamais rien. Le reseau porte le nom et porte l etat. */}
      <button
        type="button"
        onClick={() => setMiaOuverte(true)}
        aria-label="Ouvrir M.I.A (Cmd+J)"
        title="M.I.A — Mysterious Intelligence Array"
        data-chrome="coach"
        data-etat={etatMia === "repos" ? undefined : etatMia}
        className="mia-vignette bottom-20 right-4 md:bottom-6 md:right-6"
      >
        <ReseauMia etat={etatMia} taille={22} />
      </button>

      {miaOuverte && (
        <Suspense fallback={null}>
          <MiaConsole
            open={miaOuverte}
            onClose={() => {
              /* LA VIGNETTE RESTAIT ALLUMÉE APRÈS LA FERMETURE.
                 La console se démonte en se fermant, donc elle cesse de
                 remonter son état — et la vignette gardait le dernier
                 reçu, parfois « travail », à clignoter indéfiniment. */
              setEtatMia("repos");
              setMiaOuverte(false);
            }}
            onEtat={setEtatMia}
          />
        </Suspense>
      )}

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
