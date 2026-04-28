import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface PrismFullscreenPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  unit?: string;
  id?: string;
  accent?: "cyan" | "magenta" | "lime" | "violet" | "amber";
  children: ReactNode;
}

const ACCENT_VAR: Record<string, string> = {
  cyan: "var(--prism-cyan)",
  magenta: "var(--prism-magenta)",
  lime: "var(--prism-lime)",
  violet: "var(--prism-violet)",
  amber: "var(--prism-amber)",
};

export function PrismFullscreenPanel({
  open,
  onClose,
  title,
  unit,
  id,
  accent = "cyan",
  children,
}: PrismFullscreenPanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="prism-fullscreen-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] bg-[hsl(var(--prism-bg))]/90 backdrop-blur-md isolate"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={cn(
              "absolute inset-4 md:inset-8 prism-panel prism-panel--primary p-5 md:p-6 flex flex-col overflow-hidden",
            )}
            style={{ ["--prism-panel-border" as any]: ACCENT_VAR[accent] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`${title} fullscreen view`}
          >
            <span className="prism-corner-bracket tl" />
            <span className="prism-corner-bracket tr" />
            <span className="prism-corner-bracket bl" />
            <span className="prism-corner-bracket br" />

            <header className="relative flex items-center justify-between gap-3 mb-4 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {id && (
                  <span className="font-mono text-[9px] tabular-nums text-muted-foreground/50">
                    [{id}]
                  </span>
                )}
                <h2 className="font-orbitron text-sm md:text-base uppercase tracking-[0.2em] text-foreground/95 truncate">
                  {title}
                </h2>
                {unit && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                    · {unit}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close fullscreen"
                className="touch-target inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-[hsl(var(--prism-cyan))]/20 hover:border-[hsl(var(--prism-cyan))]/55 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-mono uppercase tracking-wider"
              >
                <X className="h-3 w-3" />
                ESC
              </button>
            </header>

            <div className="relative flex-1 min-h-0">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}