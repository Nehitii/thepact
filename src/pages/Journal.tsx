import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Terminal, Star } from "lucide-react";
import { format } from "date-fns";
import { useJournalEntries, useDeleteJournalEntry } from "@/hooks/useJournal";
import type { JournalEntry } from "@/types/journal";
import { JournalEntryCard } from "@/components/journal/JournalEntryCard";
import { JournalNewEntryModal } from "@/components/journal/JournalNewEntryModal";
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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useJournalEntries(user?.id);
  const deleteEntry = useDeleteJournalEntry();

  // Flatten pages
  const allEntries = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const entries = useMemo(
    () => (showFavoritesOnly ? allEntries.filter((e) => e.is_favorite) : allEntries),
    [allEntries, showFavoritesOnly]
  );

  // Group entries by month/year
  const groupedEntries = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    entries.forEach((entry) => {
      const key = format(new Date(entry.created_at), "MMMM yyyy");
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return groups;
  }, [entries]);

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasNextPage) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
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
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full blur-[150px]"
          style={{ background: "radial-gradient(ellipse, hsl(var(--primary) / 0.04) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[300px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(ellipse, hsl(270 80% 60% / 0.03) 0%, transparent 70%)" }}
        />
        {/* Scan line */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.1) 2px, hsl(var(--primary) / 0.1) 3px)",
          backgroundSize: "100% 4px",
        }} />
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between pt-8 pb-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground hover:bg-card/40 rounded-lg font-mono text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            BACK
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`rounded-lg font-mono text-xs ${showFavoritesOnly ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
            >
              <Star className={`h-3.5 w-3.5 mr-1 ${showFavoritesOnly ? "fill-current" : ""}`} />
              PINNED
            </Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => setIsNewEntryOpen(true)}
                className="bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20 rounded-lg font-mono text-xs uppercase tracking-wider shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                NEW_LOG
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg blur-xl bg-primary/20" />
              <div className="relative w-10 h-10 rounded-lg bg-card/80 border border-primary/20 flex items-center justify-center">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-mono font-bold text-foreground/90 tracking-wider uppercase">
                Neural Log
              </h1>
              <p className="text-xs font-mono text-muted-foreground/50 tracking-widest">
                SYS://MEMORY.ARCHIVE
              </p>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <motion.div
                className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary/60"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              />
              <div className="text-muted-foreground/50 font-mono text-xs tracking-wider">LOADING_LOGS...</div>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-xl blur-2xl bg-primary/10" />
              <div className="relative w-16 h-16 rounded-xl bg-card/60 border border-border/20 flex items-center justify-center">
                <Terminal className="h-7 w-7 text-muted-foreground/40" />
              </div>
            </div>
            <h3 className="text-lg font-mono text-foreground/70 mb-2 tracking-wider">NO_LOGS_FOUND</h3>
            <p className="text-muted-foreground/40 text-xs font-mono max-w-xs mb-6">
              Begin recording neural log entries to build your memory archive.
            </p>
            <Button
              onClick={() => setIsNewEntryOpen(true)}
              className="bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20 rounded-lg font-mono text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              INITIALIZE_FIRST_LOG
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-12 pb-16">
            <AnimatePresence mode="wait">
              {Object.entries(groupedEntries).map(([monthYear, monthEntries], gi) => (
                <motion.div
                  key={monthYear}
                  className="space-y-4"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: gi * 0.08 }}
                >
                  {/* Month header */}
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/30 to-transparent" />
                    <h2 className="text-[11px] font-mono text-primary/50 tracking-[0.25em] uppercase px-3">
                      {monthYear}
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/30 to-transparent" />
                  </div>

                  <div className="space-y-3">
                    {monthEntries.map((entry, ei) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: gi * 0.05 + ei * 0.05 }}
                      >
                        <JournalEntryCard
                          entry={entry}
                          onEdit={handleEdit}
                          onDelete={(id) => setDeletingEntryId(id)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-10 flex items-center justify-center">
              {isFetchingNextPage && (
                <div className="text-muted-foreground/40 font-mono text-[10px] tracking-wider">LOADING_MORE...</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New/Edit Entry Modal */}
      <JournalNewEntryModal
        open={isNewEntryOpen}
        onOpenChange={handleCloseModal}
        userId={user.id}
        editingEntry={editingEntry}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEntryId} onOpenChange={() => setDeletingEntryId(null)}>
        <AlertDialogContent
          className="border border-border/20 shadow-2xl rounded-xl"
          style={{ background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)" }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-foreground/90 tracking-wider">PURGE_LOG</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground/60 font-mono text-xs">
              This neural log entry will be permanently erased. This action cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-card/40 border-border/20 text-muted-foreground rounded-lg font-mono text-xs">
              ABORT
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 rounded-lg font-mono text-xs"
            >
              CONFIRM_PURGE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
