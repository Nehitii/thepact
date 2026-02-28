"use client";

import { useState, useEffect } from "react";
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

interface SmartProjectHeaderProps {
  focusGoals: Goal[];
  allGoals: Goal[];
  pact?: Pact | null;
  pendingValidations?: number;
}

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

  useEffect(() => {
    if (scan.done) {
      const t = setTimeout(() => setExpanded(true), 300);
      return () => clearTimeout(t);
    }
  }, [scan.done]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 14 }}
        className="relative overflow-hidden bg-[rgba(6,11,22,0.92)] backdrop-blur-xl border border-[rgba(0,180,255,0.12)] shadow-[0_8px_48px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(0,212,255,0.06)]"
        style={{ borderRadius: "4px" }}
      >
        {/* Permanent top highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,210,255,0.12)] to-transparent" />

        {/* Header bar */}
        <button
          onClick={() => scan.done && setExpanded((e) => !e)}
          className="relative z-10 w-full flex items-center gap-3 px-4 py-3 text-left group"
        >
          {/* Brain icon - simplified inline */}
          <Brain
            className={cn(
              "w-4 h-4 text-primary shrink-0",
              !scan.done && "animate-pulse",
            )}
          />

          {/* Title + status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-orbitron font-bold uppercase tracking-[0.15em] text-primary">
                Pact Nexus
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />

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

        {/* Insight cards panel */}
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
                <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                {insights.map((insight, i) => (
                  <InsightCard key={insight.id} insight={insight} index={i} />
                ))}

                <div className="flex items-center justify-center gap-2 pt-1">
                  <Shield className="w-3 h-3 text-muted-foreground/30" />
                  <span className="text-[9px] font-orbitron uppercase tracking-[0.15em] text-muted-foreground/30">
                    Nexus Engine v1.0
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
