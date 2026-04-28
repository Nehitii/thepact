import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { PrismSparkline } from "./PrismSparkline";
import type { VitalSign } from "./InsightStrip";

interface PrismMicroDrawerProps {
  open: boolean;
  sign: VitalSign | null;
  onClose: () => void;
  onJumpToSection?: () => void;
  jumpLabel?: string;
}

const ACCENT_VAR: Record<string, string> = {
  cyan: "var(--prism-cyan)",
  magenta: "var(--prism-magenta)",
  lime: "var(--prism-lime)",
  violet: "var(--prism-violet)",
  amber: "var(--prism-amber)",
};

export function PrismMicroDrawer({
  open,
  sign,
  onClose,
  onJumpToSection,
  jumpLabel,
}: PrismMicroDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  const accent = sign?.accent || "cyan";
  const colorVar = ACCENT_VAR[accent];
  const spark = sign?.sparkline ?? [];
  const max = spark.length ? Math.max(...spark) : 0;
  const min = spark.length ? Math.min(...spark) : 0;
  const avg = spark.length ? spark.reduce((a, b) => a + b, 0) / spark.length : 0;

  return createPortal(
    <AnimatePresence>
      {open && sign && (
        <>
          {/* Backdrop */}
          <motion.div
            key="prism-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            key="prism-drawer-panel"
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={cn(
              "fixed top-0 right-0 z-[81] h-full w-[min(360px,90vw)]",
              "prism-panel prism-panel--primary p-5",
              "isolate overflow-hidden",
            )}
            style={{ ["--prism-panel-border" as any]: colorVar }}
            role="dialog"
            aria-label={`Detail · ${sign.label}`}
          >
            <span className="prism-corner-bracket tl" />
            <span className="prism-corner-bracket tr" />
            <span className="prism-corner-bracket bl" />
            <span className="prism-corner-bracket br" />
            <div className="prism-scanline motion-reduce:hidden" />

            <header className="relative flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/70 mb-1">
                  <sign.icon className="h-3 w-3" style={{ color: `hsl(${colorVar})` }} />
                  KPI INSPECTOR
                </div>
                <h2
                  className="font-orbitron text-sm uppercase tracking-[0.18em]"
                  style={{ color: `hsl(${colorVar})` }}
                >
                  {sign.label}
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="touch-target inline-flex items-center justify-center rounded-sm border border-[hsl(var(--prism-cyan))]/20 hover:border-[hsl(var(--prism-cyan))]/50 text-muted-foreground hover:text-foreground transition-colors h-8 w-8"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="relative space-y-5">
              <div>
                <div
                  className="font-mono font-bold text-4xl tabular-nums leading-none"
                  style={{ color: `hsl(${colorVar})` }}
                >
                  {sign.value}
                </div>
                {typeof sign.delta === "number" && !Number.isNaN(sign.delta) && (
                  <div
                    className={cn(
                      "mt-2 text-xs font-mono uppercase tracking-wider",
                      sign.delta > 0
                        ? "prism-text-lime"
                        : sign.delta < 0
                          ? "prism-text-magenta"
                          : "text-muted-foreground",
                    )}
                  >
                    {sign.delta > 0 ? "↑" : sign.delta < 0 ? "↓" : "·"}{" "}
                    {sign.delta > 0 ? "+" : ""}
                    {sign.delta.toFixed(0)}% vs last period
                  </div>
                )}
              </div>

              {spark.length >= 2 && (
                <div className="prism-panel--muted p-3 rounded-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                      LAST {spark.length} POINTS
                    </span>
                  </div>
                  <PrismSparkline values={spark} color={colorVar} width={310} height={56} />
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <Stat label="MIN" value={Math.round(min)} color={colorVar} />
                    <Stat label="AVG" value={Math.round(avg)} color={colorVar} />
                    <Stat label="MAX" value={Math.round(max)} color={colorVar} />
                  </div>
                </div>
              )}

              {onJumpToSection && (
                <button
                  onClick={() => {
                    onJumpToSection();
                    onClose();
                  }}
                  className="touch-target w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-sm border border-[hsl(var(--prism-cyan))]/30 bg-[hsl(var(--prism-cyan))]/[0.05] hover:bg-[hsl(var(--prism-cyan))]/[0.12] hover:border-[hsl(var(--prism-cyan))]/55 transition-colors font-mono text-[11px] uppercase tracking-[0.2em] prism-text-cyan"
                >
                  Inspect {jumpLabel ?? "section"}
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-muted-foreground/60 mb-0.5">
        {label}
      </div>
      <div
        className="font-mono text-sm tabular-nums font-bold"
        style={{ color: `hsl(${color})` }}
      >
        {value}
      </div>
    </div>
  );
}