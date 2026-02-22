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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
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
      setClock(`${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}:${String(n.getSeconds()).padStart(2, "0")}`);
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
    // Pinned first
    return [...filtered].sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0));
  }, [allEntries, filterMood, search]);

  // Stats
  const totalWords = useMemo(() => allEntries.reduce((s, e) => s + e.content.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length, 0), [allEntries]);
  const pinnedCount = useMemo(() => allEntries.filter((e) => e.is_favorite).length, [allEntries]);

  // Infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasNextPage) return;
      observerRef.current = new IntersectionObserver(
        (es) => { if (es[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const handleEdit = (entry: JournalEntry) => { setEditingEntry(entry); setIsNewEntryOpen(true); };
  const handleDelete = async () => {
    if (!deletingEntryId || !user) return;
    await deleteEntry.mutateAsync({ id: deletingEntryId, userId: user.id });
    setDeletingEntryId(null);
  };
  const handleCloseModal = (open: boolean) => { setIsNewEntryOpen(open); if (!open) setEditingEntry(null); };

  if (!user) return null;

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto" style={{ background: "#04050c" }}>
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
        <div key={i} className="fixed w-8 h-8 z-[9500] pointer-events-none" style={s as React.CSSProperties} />
      ))}

      {/* Side decorations */}
      <div className="fixed left-5 top-1/2 -translate-y-1/2 z-50 pointer-events-none hidden lg:flex flex-col items-center gap-2">
        <div className="w-px h-20" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,255,224,0.3))" }} />
        {["◈", "◉", "◎", "◐", "◯", "◆"].map((s, i) => (
          <div key={i} className="w-px h-5 relative" style={{ background: "rgba(0,255,224,0.1)" }}>
            {i === 2 && <span className="absolute left-2 -top-1 whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: "rgba(0,255,224,0.25)" }}>{s}</span>}
          </div>
        ))}
        <div className="w-px h-20" style={{ background: "linear-gradient(to top, transparent, rgba(0,255,224,0.3))" }} />
      </div>

      <div className="fixed right-5 top-1/2 -translate-y-1/2 z-50 pointer-events-none hidden lg:flex flex-col items-center gap-2">
        <div className="w-px h-20" style={{ background: "linear-gradient(to bottom, transparent, rgba(191,90,242,0.3))" }} />
        {clock.split(":").map((t, i) => (
          <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: "rgba(191,90,242,0.35)", letterSpacing: "0.1em", writingMode: "vertical-rl" }}>{t}</div>
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
          {/* Rotating rings */}
          <div className="relative inline-block mb-5">
            <div className="absolute -inset-10 pointer-events-none">
              <RotatingRing size={120} color="#00ffe0" duration={20} dasharray="2 12" opacity={0.25} />
            </div>
            <div className="absolute -inset-5 pointer-events-none">
              <RotatingRing size={80} color="#bf5af2" duration={14} reverse dasharray="4 6" opacity={0.2} />
            </div>
            {/* Central orb */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mx-auto"
              style={{
                border: "1px solid rgba(0,255,224,0.4)",
                background: "rgba(0,255,224,0.06)",
                boxShadow: "0 0 20px rgba(0,255,224,0.2), inset 0 0 10px rgba(0,255,224,0.05)",
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: "#00ffe0", boxShadow: "0 0 10px #00ffe0", animation: "journal-pulse 2.5s ease-in-out infinite" }} />
            </div>
          </div>

          {/* System label */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,224,0.25))" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(0,255,224,0.45)", letterSpacing: "0.25em" }}>NEURAL_JOURNAL // SYS.ACTIVE</span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(0,255,224,0.25), transparent)" }} />
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "'Orbitron', monospace",
              fontWeight: 900,
              fontSize: "clamp(30px, 5vw, 52px)",
              letterSpacing: "0.08em",
              lineHeight: 1,
              marginBottom: "8px",
              background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            CHRONO<span style={{ WebkitTextFillColor: "#00ffe0", filter: "drop-shadow(0 0 12px #00ffe0)" }}>LOG</span>
          </h1>

          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em" }}>
            PERSONAL JOURNAL INTERFACE — v3.0
          </p>

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
              whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(0,255,224,0.25), 0 0 80px rgba(0,255,224,0.1)" }}
              whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden inline-flex items-center gap-2.5 cursor-pointer transition-shadow duration-300"
              style={{
                padding: "13px 36px",
                background: "transparent",
                border: "1px solid #00ffe0",
                color: "#00ffe0",
                borderRadius: "3px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.2em",
                boxShadow: "0 0 20px rgba(0,255,224,0.12), inset 0 0 20px rgba(0,255,224,0.03)",
              }}
            >
              <span style={{ fontSize: "16px", fontWeight: 300, fontFamily: "'JetBrains Mono', monospace" }}>+</span>
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
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "rgba(0,255,224,0.35)" }}>◈</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH LOGS..."
              className="w-full outline-none transition-colors duration-200"
              style={{
                padding: "11px 16px 11px 36px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "3px",
                color: "rgba(255,255,255,0.7)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.08em",
                caretColor: "#00ffe0",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(0,255,224,0.3)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.07)")}
            />
          </div>

          {/* Mood filter pills */}
          <div className="flex justify-center gap-1.5 flex-wrap">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.id}
                onClick={() => setFilterMood(filterMood === m.id ? null : m.id)}
                className="flex items-center gap-1.5 rounded-sm cursor-pointer transition-all duration-150"
                style={{
                  padding: "5px 12px",
                  background: filterMood === m.id ? `${m.color}12` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${filterMood === m.id ? m.color + "45" : "rgba(255,255,255,0.06)"}`,
                  color: filterMood === m.id ? m.color : "rgba(255,255,255,0.3)",
                  fontSize: "10px",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.1em",
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
                  className="w-6 h-6 rounded-full border-2 border-t-[#00ffe0]"
                  style={{ borderColor: "rgba(0,255,224,0.2)" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "rgba(255,255,255,0.12)", letterSpacing: "0.15em" }}>LOADING_LOGS...</div>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "rgba(255,255,255,0.12)", letterSpacing: "0.15em" }}>// NO_ENTRIES_FOUND</div>
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
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.12)", letterSpacing: "0.15em" }}>LOADING_MORE...</div>
            )}
          </div>

          {/* End terminator */}
          {entries.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-center">
              <div className="flex items-center gap-3 justify-center">
                <div className="h-px w-20" style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,224,0.2))" }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(0,255,224,0.25)", letterSpacing: "0.2em" }}>// END_OF_LOG</span>
                <div className="h-px w-20" style={{ background: "linear-gradient(90deg, rgba(0,255,224,0.2), transparent)" }} />
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
        <AlertDialogContent
          className="border shadow-2xl rounded-xl"
          style={{
            background: "linear-gradient(180deg, #0c0e18 0%, #04050c 100%)",
            borderColor: "rgba(0,255,224,0.15)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono tracking-wider" style={{ color: "rgba(255,255,255,0.9)" }}>PURGE_LOG</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              This entry will be permanently erased. This action cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-lg font-mono text-xs" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
              ABORT
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-lg font-mono text-xs"
              style={{ background: "rgba(255,55,95,0.1)", borderColor: "rgba(255,55,95,0.2)", color: "#ff375f" }}
            >
              CONFIRM_PURGE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
