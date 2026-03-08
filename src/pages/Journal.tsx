import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useJournalEntries, useDeleteJournalEntry } from "@/hooks/useJournal";
import type { JournalEntry } from "@/types/journal";
import { MOOD_OPTIONS, getAccent } from "@/types/journal";
import { JournalEntryCard } from "@/components/journal/JournalEntryCard";
import { JournalNewEntryModal } from "@/components/journal/JournalNewEntryModal";
import { RotatingRing, HexBadge, SciFiDivider } from "@/components/journal/JournalDecorations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";

export default function Journal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterMood, setFilterMood] = useState<string | null>(null);
  const [clock, setClock] = useState("");

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useJournalEntries(user?.id);
  const deleteEntry = useDeleteJournalEntry();

  // Live clock
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(
        `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}:${String(n.getSeconds()).padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const allEntries = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const entries = useMemo(() => {
    let filtered = allEntries;
    if (filterMood) filtered = filtered.filter((e) => e.mood === filterMood);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((e) => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q));
    }
    return [...filtered].sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0));
  }, [allEntries, filterMood, search]);

  // Stats
  const totalWords = useMemo(
    () =>
      allEntries.reduce(
        (s, e) =>
          s +
          e.content
            .replace(/<[^>]+>/g, "")
            .split(/\s+/)
            .filter(Boolean).length,
        0,
      ),
    [allEntries],
  );
  const pinnedCount = useMemo(() => allEntries.filter((e) => e.is_favorite).length, [allEntries]);

  // Infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasNextPage) return;
      observerRef.current = new IntersectionObserver(
        (es) => {
          if (es[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
        },
        { threshold: 0.1 },
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsNewEntryOpen(true);
  };
  const handleDelete = async () => {
    if (!deletingEntryId || !user) return;
    await deleteEntry.mutateAsync({ id: deletingEntryId, userId: user.id });
    setDeletingEntryId(null);
  };
  const handleCloseModal = (open: boolean) => {
    setIsNewEntryOpen(open);
    if (!open) setEditingEntry(null);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto" style={{ background: "var(--journal-bg)" }}>
      {/* Background layers */}
      <div className="journal-scanline" />
      <div className="journal-noise" />
      <div className="journal-grid-bg" />
      <div className="journal-orb-left" />
      <div className="journal-orb-right" />

      {/* Corner frames */}
      {[
        { top: 16, left: 16, borderTop: "1px solid rgba(0,255,224,0.35)", borderLeft: "1px solid rgba(0,255,224,0.35)" },
        { top: 16, right: 16, borderTop: "1px solid rgba(0,255,224,0.35)", borderRight: "1px solid rgba(0,255,224,0.35)" },
        { bottom: 16, left: 16, borderBottom: "1px solid rgba(0,255,224,0.35)", borderLeft: "1px solid rgba(0,255,224,0.35)" },
        { bottom: 16, right: 16, borderBottom: "1px solid rgba(0,255,224,0.35)", borderRight: "1px solid rgba(0,255,224,0.35)" },
      ].map((s, i) => (
        <div key={i} className="absolute w-8 h-8 z-[9500] pointer-events-none dark:block hidden" style={s as React.CSSProperties} />
      ))}

      {/* Side decorations — dark only */}
      <div className="fixed left-5 top-1/2 -translate-y-1/2 z-50 pointer-events-none hidden dark:lg:flex flex-col items-center gap-2">
        <div className="w-px h-20" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,255,224,0.3))" }} />
        {["◈", "◉", "◎", "◐", "◯", "◆"].map((s, i) => (
          <div key={i} className="w-px h-5 relative" style={{ background: "rgba(0,255,224,0.1)" }}>
            {i === 2 && (
              <span className="absolute left-2 -top-1 whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: "rgba(0,255,224,0.25)" }}>
                {s}
              </span>
            )}
          </div>
        ))}
        <div className="w-px h-20" style={{ background: "linear-gradient(to top, transparent, rgba(0,255,224,0.3))" }} />
      </div>

      <div className="fixed right-5 top-1/2 -translate-y-1/2 z-50 pointer-events-none hidden dark:lg:flex flex-col items-center gap-2">
        <div className="w-px h-20" style={{ background: "linear-gradient(to bottom, transparent, rgba(191,90,242,0.3))" }} />
        {clock.split(":").map((t, i) => (
          <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: "rgba(191,90,242,0.35)", letterSpacing: "0.1em", writingMode: "vertical-rl" }}>
            {t}
          </div>
        ))}
        <div className="w-px h-20" style={{ background: "linear-gradient(to top, transparent, rgba(191,90,242,0.3))" }} />
      </div>

      {/* Main content */}
      <div className="relative z-[1] max-w-[680px] mx-auto px-4 sm:px-6">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="pt-14 pb-10 text-center"
        >
          {/* Rotating rings — dark only */}
          <div className="relative inline-block mb-5">
            <div className="absolute -inset-10 pointer-events-none hidden dark:block">
              <RotatingRing size={120} color="#00ffe0" duration={20} dasharray="2 12" opacity={0.25} />
            </div>
            <div className="absolute -inset-5 pointer-events-none hidden dark:block">
              <RotatingRing size={80} color="#bf5af2" duration={14} reverse dasharray="4 6" opacity={0.2} />
            </div>
            {/* Central orb */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mx-auto border border-primary/40 bg-primary/10"
              style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.2), inset 0 0 10px hsl(var(--primary) / 0.05)" }}
            >
              <div
                className="w-2 h-2 rounded-full bg-primary"
                style={{ boxShadow: "0 0 10px hsl(var(--primary))", animation: "journal-pulse 2.5s ease-in-out infinite" }}
              />
            </div>
          </div>

          {/* System label */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-primary/25" />
            <span className="font-mono text-[9px] text-primary/50 tracking-[0.25em]">
              NEURAL_JOURNAL // SYS.ACTIVE
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/25 to-transparent" />
          </div>

          {/* Title */}
          <h1 className="font-orbitron font-black text-[clamp(30px,5vw,52px)] tracking-[0.08em] leading-none mb-2 text-transparent bg-clip-text bg-gradient-to-b from-foreground/95 to-foreground/50">
            CHRONO<span className="text-primary" style={{ filter: "drop-shadow(0 0 12px hsl(var(--primary)))" }}>LOG</span>
          </h1>


          {/* Stats hexagons */}
          <div className="flex justify-center gap-6 mt-8 flex-wrap">
            <HexBadge label="ENTRIES" value={allEntries.length} color="#00ffe0" />
            <HexBadge label="PINNED" value={pinnedCount} color="#bf5af2" />
            <HexBadge label="K-WORDS" value={`${(Math.round(totalWords / 100) / 10).toFixed(1)}k`} color="#ffd60a" />
          </div>

          {/* New entry button */}
          <div className="mt-8">
            <motion.button
              onClick={() => setIsNewEntryOpen(true)}
              whileHover={{ scale: 1.04, boxShadow: "0 0 40px hsl(var(--primary) / 0.25), 0 0 80px hsl(var(--primary) / 0.1)" }}
              whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden inline-flex items-center gap-2.5 cursor-pointer transition-shadow duration-300 border border-primary text-primary rounded-[3px] font-orbitron text-[11px] font-semibold tracking-[0.2em]"
              style={{
                padding: "13px 36px",
                background: "transparent",
                boxShadow: "0 0 20px hsl(var(--primary) / 0.12), inset 0 0 20px hsl(var(--primary) / 0.03)",
              }}
            >
              <span className="text-[16px] font-light font-mono">+</span>
              NEW ENTRY
            </motion.button>
          </div>
        </motion.header>

        {/* TOOLBAR */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-2 flex flex-col gap-3"
        >
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[12px] text-primary/35">
              ◈
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH LOGS..."
              className="w-full outline-none transition-colors duration-200 font-mono text-[11px] tracking-[0.08em] text-foreground/70 rounded-[3px]"
              style={{
                padding: "11px 16px 11px 36px",
                background: "var(--journal-input-bg)",
                border: "1px solid var(--journal-input-border)",
                caretColor: "hsl(var(--primary))",
              }}
              onFocus={(e) => (e.target.style.borderColor = "hsl(var(--primary) / 0.4)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--journal-input-border)")}
            />
          </div>

          {/* Mood filter pills */}
          <div className="flex justify-center gap-1.5 flex-wrap">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.id}
                onClick={() => setFilterMood(filterMood === m.id ? null : m.id)}
                className="flex items-center gap-1.5 rounded-sm cursor-pointer transition-all duration-150 font-mono text-[10px] tracking-[0.1em]"
                style={{
                  padding: "5px 12px",
                  background: filterMood === m.id ? `${m.color}12` : "var(--journal-input-bg)",
                  border: `1px solid ${filterMood === m.id ? m.color + "45" : "var(--journal-input-border)"}`,
                  color: filterMood === m.id ? m.color : "var(--journal-text-dim)",
                  boxShadow: filterMood === m.id ? `0 0 12px ${m.color}20` : "none",
                }}
              >
                <span style={{ fontSize: "11px" }}>{m.sym}</span>
                {m.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ENTRIES */}
        <div className="pb-20 mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
                <div className="font-mono text-[12px] text-muted-foreground/20 tracking-[0.15em]">
                  LOADING_LOGS...
                </div>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="font-mono text-[12px] text-muted-foreground/20 tracking-[0.15em]">
                // NO_ENTRIES_FOUND
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {entries.map((entry, i) => {
                const entryAccent = getAccent(entry.accent_color);
                return (
                  <div key={entry.id}>
                    {i > 0 && (
                      <div className="py-3">
                        <SciFiDivider color={entryAccent.hex} label={`LOG·${String(i + 1).padStart(3, "0")}`} />
                      </div>
                    )}
                    <JournalEntryCard
                      entry={entry}
                      index={i}
                      onEdit={handleEdit}
                      onDelete={(id) => setDeletingEntryId(id)}
                    />
                  </div>
                );
              })}
            </AnimatePresence>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && (
              <div className="font-mono text-[10px] text-muted-foreground/20 tracking-[0.15em]">
                LOADING_MORE...
              </div>
            )}
          </div>

          {/* End terminator */}
          {entries.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-center">
              <div className="flex items-center gap-3 justify-center">
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-primary/20" />
                <span className="font-mono text-[9px] text-primary/25 tracking-[0.2em]">
                  // END_OF_LOG
                </span>
                <div className="h-px w-20 bg-gradient-to-r from-primary/20 to-transparent" />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Editor */}
      <JournalNewEntryModal
        open={isNewEntryOpen}
        onOpenChange={handleCloseModal}
        userId={user.id}
        editingEntry={editingEntry}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingEntryId} onOpenChange={() => setDeletingEntryId(null)}>
        <AlertDialogContent className="border border-destructive/15 shadow-2xl rounded-xl bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono tracking-wider text-foreground">
              PURGE_LOG
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-muted-foreground">
              This entry will be permanently erased. This action cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-lg font-mono text-xs bg-muted/50 border-border text-muted-foreground">
              ABORT
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-lg font-mono text-xs bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20"
            >
              CONFIRM_PURGE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
