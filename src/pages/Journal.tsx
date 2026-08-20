import { useState, useMemo, useRef, useCallback, useEffect, memo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useJournalEntries, useDeleteJournalEntry, useJournalCounts } from "@/hooks/useJournal";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";
import type { JournalEntry } from "@/types/journal";
import { MOOD_OPTIONS, getAccent } from "@/types/journal";
import { JournalEntryCard } from "@/components/journal/JournalEntryCard";
import { JournalNewEntryModal } from "@/components/journal/JournalNewEntryModal";
import { SciFiDivider } from "@/components/journal/JournalDecorations";
import { DailyPromptBanner } from "@/components/journal/DailyPromptBanner";
import { DSPageShell, DSPageHeader } from "@/components/ds";
import { Pin, Search } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";

/* LOG.01 — LE JOURNAL
 *
 * La recherche et le filtre ne portaient que sur les pages deja
 * chargees : sur un journal de deux cents entrees, chercher un mot ecrit
 * il y a six mois ne rendait rien, et la page repondait « aucune
 * entree ». Ils partent en base, avec la pagination.
 *
 * Les compteurs de l en-tete comptaient eux aussi les pages chargees.
 * Ils comptent maintenant ce qui existe.
 */

// L horloge est isolee : elle bat a la seconde, la page ne la suit pas.
const LiveClock = memo(function LiveClock() {
  const [clock, setClock] = useState("");
  const tick = useCallback(() => {
    const n = new Date();
    setClock(
      `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}:${String(n.getSeconds()).padStart(2, "0")}`,
    );
  }, []);
  useEffect(() => { tick(); }, [tick]);
  useVisibleInterval(tick, 1000);
  return (
    <>
      {clock.split(":").map((t, i) => (
        <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "max(11px, 0.6875rem)", color: "rgba(191,90,242,0.55)", letterSpacing: "0.1em", writingMode: "vertical-rl" as const }}>
          {t}
        </div>
      ))}
    </>
  );
});

export default function Journal() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rechercheEnvoyee, setRechercheEnvoyee] = useState("");
  const [filterMood, setFilterMood] = useState<string | null>(null);
  const [epinglees, setEpinglees] = useState(false);
  const [amorce, setAmorce] = useState("");

  /* On ne part pas en base a chaque frappe. */
  useEffect(() => {
    const id = setTimeout(() => setRechercheEnvoyee(search.trim()), 320);
    return () => clearTimeout(id);
  }, [search]);

  const filtre = useMemo(
    () => ({ recherche: rechercheEnvoyee, humeur: filterMood, epinglees }),
    [rechercheEnvoyee, filterMood, epinglees],
  );

  const { data, isLoading, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useJournalEntries(user?.id, filtre);
  const { data: comptes } = useJournalCounts(user?.id);
  const deleteEntry = useDeleteJournalEntry();

  /* La base a deja trie et filtre : la page ne fait plus que dérouler. */
  const entries = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const filtreActif = !!rechercheEnvoyee || !!filterMood || epinglees;

  // Defilement infini
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasNextPage) return;
      observerRef.current = new IntersectionObserver(
        (es) => { if (es[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
        { threshold: 0.1 },
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );
  useEffect(() => () => observerRef.current?.disconnect(), []);

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setAmorce("");
    setIsNewEntryOpen(true);
  };
  const handleDelete = async () => {
    if (!deletingEntryId || !user) return;
    try {
      await deleteEntry.mutateAsync({ id: deletingEntryId, userId: user.id });
    } catch { /* le toast d erreur est porte par la mutation */ }
    setDeletingEntryId(null);
  };
  const handleCloseModal = (open: boolean) => {
    setIsNewEntryOpen(open);
    if (!open) { setEditingEntry(null); setAmorce(""); }
  };

  /* La page ne rendait rien du tout pendant l amorcage de la session. */
  if (!user) {
    return (
      <DSPageShell width="md">
        <div className="flex items-center justify-center py-24">
          <div className="font-mono ds-t-label tracking-[0.15em] text-muted-foreground">
            {t("journal.loading")}
          </div>
        </div>
      </DSPageShell>
    );
  }

  return (
    <DSPageShell
      width="md"
      background={
        <>
          <div className="absolute inset-0" style={{ background: "var(--journal-bg)" }} />
          <div className="journal-scanline" />
          <div className="journal-noise" />
          <div className="journal-grid-bg" />
          <div className="journal-orb-left" />
          <div className="journal-orb-right" />
          {[
            { top: 16, left: 16, borderTop: "1px solid rgba(0,255,224,0.35)", borderLeft: "1px solid rgba(0,255,224,0.35)" },
            { top: 16, right: 16, borderTop: "1px solid rgba(0,255,224,0.35)", borderRight: "1px solid rgba(0,255,224,0.35)" },
            { bottom: 16, left: 16, borderBottom: "1px solid rgba(0,255,224,0.35)", borderLeft: "1px solid rgba(0,255,224,0.35)" },
            { bottom: 16, right: 16, borderBottom: "1px solid rgba(0,255,224,0.35)", borderRight: "1px solid rgba(0,255,224,0.35)" },
          ].map((s, i) => (
            <div key={i} className="absolute w-8 h-8 z-[9500] pointer-events-none dark:block hidden" style={s as React.CSSProperties} />
          ))}
        </>
      }
    >
      <div className="fixed left-5 top-1/2 -translate-y-1/2 z-50 pointer-events-none hidden dark:lg:flex flex-col items-center gap-2" aria-hidden="true">
        <div className="w-px h-20" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,255,224,0.3))" }} />
        {["◈", "◉", "◎", "◐", "◯", "◆"].map((s, i) => (
          <div key={i} className="w-px h-5 relative" style={{ background: "rgba(0,255,224,0.1)" }}>
            {i === 2 && (
              <span className="absolute left-2 -top-1 whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "max(11px, 0.6875rem)", color: "rgba(0,255,224,0.45)" }}>
                {s}
              </span>
            )}
          </div>
        ))}
        <div className="w-px h-20" style={{ background: "linear-gradient(to top, transparent, rgba(0,255,224,0.3))" }} />
      </div>

      <div className="fixed right-5 top-1/2 -translate-y-1/2 z-50 pointer-events-none hidden dark:lg:flex flex-col items-center gap-2" aria-hidden="true">
        <div className="w-px h-20" style={{ background: "linear-gradient(to bottom, transparent, rgba(191,90,242,0.3))" }} />
        <LiveClock />
        <div className="w-px h-20" style={{ background: "linear-gradient(to top, transparent, rgba(191,90,242,0.3))" }} />
      </div>

      <DSPageHeader
        variant="hud"
        systemLabel={t("journal.systemLabel")}
        title="CHRONO"
        titleAccent="LOG"
        badges={[
          { label: t("journal.badges.entries"), value: comptes?.total ?? 0, color: "#00ffe0" },
          { label: t("journal.badges.pinned"), value: comptes?.epinglees ?? 0, color: "#bf5af2" },
          { label: t("journal.badges.month"), value: comptes?.ceMois ?? 0, color: "#ffd60a" },
        ]}
        actions={
          <motion.button
            onClick={() => { setEditingEntry(null); setAmorce(""); setIsNewEntryOpen(true); }}
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px hsl(var(--primary) / 0.25), 0 0 80px hsl(var(--primary) / 0.1)" }}
            whileTap={{ scale: 0.97 }}
            className="relative overflow-hidden inline-flex items-center gap-2.5 cursor-pointer transition-shadow duration-300 border border-primary text-primary rounded-[3px] font-orbitron ds-t-label font-semibold tracking-[0.2em]"
            style={{ padding: "13px 36px", background: "transparent", boxShadow: "0 0 20px hsl(var(--primary) / 0.12), inset 0 0 20px hsl(var(--primary) / 0.03)" }}
          >
            <span className="text-[1rem] font-light font-mono">+</span>
            {t("journal.newEntry")}
          </motion.button>
        }
      />

      <DailyPromptBanner
        onUse={(prompt) => {
          /* La question du jour etait jetee : la page ouvrait un editeur
             vide. Elle arrive maintenant a destination. */
          setEditingEntry(null);
          setAmorce(prompt);
          setIsNewEntryOpen(true);
        }}
      />

      {/* BARRE */}
      <div className="mb-2 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/60" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t("journal.searchLabel")}
            placeholder={t("journal.searchPlaceholder")}
            className="w-full outline-none transition-colors duration-200 font-mono ds-t-label tracking-[0.08em] text-foreground rounded-[3px]"
            style={{
              padding: "11px 16px 11px 36px", minHeight: "44px",
              background: "var(--journal-input-bg)",
              border: "1px solid var(--journal-input-border)",
              caretColor: "hsl(var(--primary))",
            }}
            onFocus={(e) => (e.target.style.borderColor = "hsl(var(--primary) / 0.4)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--journal-input-border)")}
          />
        </div>

        <div className="flex justify-center gap-1.5 flex-wrap" role="group" aria-label={t("journal.filterLabel")}>
          <button
            type="button"
            aria-pressed={epinglees}
            onClick={() => setEpinglees((v) => !v)}
            className="journal-pastille"
            style={{
              background: epinglees ? "#bf5af218" : "var(--journal-input-bg)",
              border: `1px solid ${epinglees ? "#bf5af260" : "var(--journal-input-border)"}`,
              color: epinglees ? "#bf5af2" : "var(--journal-text-secondary)",
            }}
          >
            <Pin className="w-3 h-3" aria-hidden="true" />
            {t("journal.badges.pinned")}
          </button>
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={filterMood === m.id}
              onClick={() => setFilterMood(filterMood === m.id ? null : m.id)}
              className="journal-pastille"
              style={{
                background: filterMood === m.id ? `${m.color}18` : "var(--journal-input-bg)",
                border: `1px solid ${filterMood === m.id ? m.color + "60" : "var(--journal-input-border)"}`,
                color: filterMood === m.id ? m.color : "var(--journal-text-secondary)",
                boxShadow: filterMood === m.id ? `0 0 12px ${m.color}20` : "none",
              }}
            >
              <span style={{ fontSize: "11px" }} aria-hidden="true">{m.sym}</span>
              {t(`journal.moods.${m.id}`)}
            </button>
          ))}
        </div>
      </div>

      {/* ENTREES */}
      <div className="pb-20 mt-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <motion.div
                className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              />
              <div className="font-mono ds-t-label text-muted-foreground tracking-[0.15em]">
                {t("journal.loadingLogs")}
              </div>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20" role="status">
            <p className="font-mono ds-t-label text-muted-foreground tracking-[0.15em] m-0">
              {filtreActif ? t("journal.noMatch") : t("journal.noEntries")}
            </p>
            {filtreActif && (
              <button
                type="button"
                onClick={() => { setSearch(""); setFilterMood(null); setEpinglees(false); }}
                className="mt-4 font-mono ds-t-label tracking-[0.15em] text-primary hover:underline min-h-[44px] px-3"
              >
                {t("journal.clearFilters")}
              </button>
            )}
          </div>
        ) : (
          entries.map((entry, i) => {
            const entryAccent = getAccent(entry.accent_color);
            return (
              <div key={entry.id}>
                {i > 0 && (
                  <div className="py-3">
                    {/* Le libelle numerotait la position a l ecran, laquelle
                        changeait avec le filtre. Il porte la date. */}
                    <SciFiDivider
                      color={entryAccent.hex}
                      label={new Date(entry.created_at).toISOString().slice(0, 10).replace(/-/g, ".")}
                    />
                  </div>
                )}
                <JournalEntryCard entry={entry} onEdit={handleEdit} onDelete={(id) => setDeletingEntryId(id)} />
              </div>
            );
          })
        )}

        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="font-mono ds-t-label text-muted-foreground tracking-[0.15em]">
              {t("journal.loadingMore")}
            </div>
          )}
        </div>

        {entries.length > 0 && !hasNextPage && (
          <div className="mt-8 text-center">
            <div className="flex items-center gap-3 justify-center">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-primary/40" />
              <span className="font-mono ds-t-label text-primary/70 tracking-[0.2em]">
                {t("journal.endOfLog")}
              </span>
              <div className="h-px w-20 bg-gradient-to-r from-primary/40 to-transparent" />
            </div>
          </div>
        )}
      </div>

      {/* Recherche en cours, annoncee sans voler le focus */}
      <p className="sr-only" role="status" aria-live="polite">
        {isFetching && !isLoading ? t("journal.searching") : ""}
      </p>

      <JournalNewEntryModal
        open={isNewEntryOpen}
        onOpenChange={handleCloseModal}
        userId={user.id}
        editingEntry={editingEntry}
        amorce={amorce}
      />

      <AlertDialog open={!!deletingEntryId} onOpenChange={(o) => { if (!o) setDeletingEntryId(null); }}>
        <AlertDialogContent className="border border-destructive/15 shadow-2xl rounded-xl bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono tracking-wider text-foreground">
              {t("journal.delete.title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-muted-foreground">
              {t("journal.delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-lg font-mono text-xs bg-muted/50 border-border text-muted-foreground">
              {t("journal.delete.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-lg font-mono text-xs bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20"
            >
              {t("journal.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DSPageShell>
  );
}
