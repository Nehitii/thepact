import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X } from "lucide-react";
import { toast } from "sonner";
import { useLogFocusDistraction } from "@/hooks/useFocusDistractions";

/**
 * Quick "log a distraction" button shown while a Focus session is running.
 * One click opens an inline note input; saves to focus_distractions.
 */
export function FocusDistractionButton() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const log = useLogFocusDistraction();

  const submit = async () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    try {
      await log.mutateAsync({ note: trimmed });
      toast("Distraction notée", { duration: 1200 });
      setNote("");
      setOpen(false);
    } catch {
      toast.error("Échec de l'enregistrement");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-30">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-14 right-0 w-72 bg-[#0a0a0c] border border-primary/30 p-3"
            style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-primary/70">
                LOG_DISTRACTION
              </span>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
              placeholder="Qu'est-ce qui t'a distrait ?"
              rows={3}
              className="w-full bg-black/40 border border-primary/20 text-foreground text-xs p-2 font-mono focus:outline-none focus:border-primary/60 resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={submit}
                disabled={!note.trim() || log.isPending}
                className="text-[10px] font-mono uppercase tracking-widest text-primary border border-primary/40 px-3 py-1 hover:bg-primary/10 disabled:opacity-40"
              >
                {">> NOTER"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Log distraction"
        className="w-12 h-12 flex items-center justify-center bg-black/60 border border-primary/40 text-primary hover:border-primary hover:bg-primary/10 backdrop-blur"
        style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
      >
        <Brain className="w-5 h-5" />
      </motion.button>
    </div>
  );
}