"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Activity, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Goal } from "@/hooks/useGoals";
import { Pact } from "@/hooks/usePact";
import {
  usePactAnalysis,
  SCAN_PHASES,
  SCAN_PHASE_DURATION_MS,
} from "@/hooks/usePactAnalysis";
import { InsightCard } from "./InsightCard";

// ─── types ──────────────────────────────────────────────────────────────────

interface SmartProjectHeaderProps {
  focusGoals: Goal[];
  allGoals: Goal[];
  pact?: Pact | null;
  pendingValidations?: number;
}

// ─── status dot colours ─────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  optimal: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
  attention: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
  critical: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
};

const STATUS_LABEL: Record<string, string> = {
  optimal: "Systems Optimal",
  attention: "Attention Required",
  critical: "Critical Alert",
};

// ─── scan boot animation ────────────────────────────────────────────────────

function useScanBoot() {
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    if (phase >= SCAN_PHASES.length) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => setPhase((p) => p + 1), SCAN_PHASE_DURATION_MS);
    return () => clearTimeout(t);
  }, [phase, done]);

  return { phase, done, currentText: SCAN_PHASES[Math.min(phase, SCAN_PHASES.length - 1)] };
}

// ─── typewriter text ────────────────────────────────────────────────────────

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, 18);
    return () => clearInterval(iv);
  }, [text]);

  return (
    <span className="font-rajdhani text-primary/90 text-xs tracking-wider">
      {displayed}
      <span className="animate-pulse text-primary">▌</span>
    </span>
  );
}

// ─── main component ─────────────────────────────────────────────────────────

export function SmartProjectHeader({
  focusGoals,
  allGoals,
  pact,
  pendingValidations = 0,
}: SmartProjectHeaderProps) {
  const { insights, systemStatus } = usePactAnalysis({
    pact,
    goals: allGoals,
    isLoading: false,
  });

  const scan = useScanBoot();
  const [expanded, setExpanded] = useState(false);

  // Auto-expand after scan completes
  useEffect(() => {
    if (scan.done) {
      const t = setTimeout(() => setExpanded(true), 300);
      return () => clearTimeout(t);
    }
  }, [scan.done]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* ── Main shell ── */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 14 }}
        className={cn(
          "relative overflow-hidden rounded-xl",
          "border border-primary/20",
          "bg-black/40 backdrop-blur-xl",
          "shadow-[0_0_30px_rgba(0,212,255,0.08)]",
        )}
      >
        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.06) 3px, rgba(0,212,255,0.06) 4px)",
          }}
        />

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        {/* ── Header bar ── */}
        <button
          onClick={() => scan.done && setExpanded((e) => !e)}
          className="relative z-10 w-full flex items-center gap-3 px-4 py-3 text-left group"
        >
          {/* Brain icon with glow */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full blur-md bg-primary/30" />
            <div className="relative p-2 rounded-full border border-primary/30 bg-black/50">
              <Brain
                className={cn(
                  "w-4 h-4 text-primary",
                  !scan.done && "animate-pulse",
                )}
              />
            </div>
          </div>

          {/* Title + status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-orbitron font-bold uppercase tracking-[0.2em] text-primary">
                Pact Nexus
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />

              {/* Status indicator */}
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    scan.done ? STATUS_DOT[systemStatus] : "bg-primary/50",
                  )}
                />
                <span className="text-[9px] font-orbitron uppercase tracking-[0.15em] text-muted-foreground/60">
                  {scan.done ? STATUS_LABEL[systemStatus] : "Scanning"}
                </span>
              </div>
            </div>

            {/* Scan phase text or summary */}
            <div className="mt-0.5 h-4 overflow-hidden">
              <AnimatePresence mode="wait">
                {!scan.done ? (
                  <motion.div
                    key={`scan-${scan.phase}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TypewriterText text={scan.currentText} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span className="text-[10px] font-rajdhani text-muted-foreground/70 tracking-wider">
                      {insights.length > 0
                        ? `${insights.length} insight${insights.length > 1 ? "s" : ""} detected — tap to ${expanded ? "collapse" : "expand"}`
                        : "All systems nominal — no action required"}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Expand chevron */}
          {scan.done && insights.length > 0 && (
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="text-primary/40"
            >
              <Activity className="w-4 h-4" />
            </motion.div>
          )}
        </button>

        {/* ── Insight cards panel ── */}
        <AnimatePresence>
          {expanded && insights.length > 0 && (
            <motion.div
              key="insights"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2">
                {/* Separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                {insights.map((insight, i) => (
                  <InsightCard key={insight.id} insight={insight} index={i} />
                ))}

                {/* Footer */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Shield className="w-3 h-3 text-muted-foreground/30" />
                  <span className="text-[9px] font-orbitron uppercase tracking-[0.2em] text-muted-foreground/30">
                    Nexus Engine v1.0
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </motion.div>
    </div>
  );
}
