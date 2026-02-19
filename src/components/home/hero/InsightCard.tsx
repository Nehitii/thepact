"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  AlertTriangle,
  Zap,
  CheckCircle,
  Info,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PactInsight, InsightLevel } from "@/hooks/usePactAnalysis";

// ─── config per level ───────────────────────────────────────────────────────

const levelConfig: Record<
  InsightLevel,
  {
    icon: React.ElementType;
    border: string;
    glow: string;
    bg: string;
    text: string;
    badge: string;
    badgeText: string;
  }
> = {
  critical: {
    icon: AlertTriangle,
    border: "border-red-500/50",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.25)]",
    bg: "from-red-500/15 via-red-500/5 to-transparent",
    text: "text-red-400",
    badge: "bg-red-500/20 border-red-500/40",
    badgeText: "text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-amber-500/40",
    glow: "shadow-[0_0_18px_rgba(245,158,11,0.2)]",
    bg: "from-amber-500/12 via-amber-500/5 to-transparent",
    text: "text-amber-400",
    badge: "bg-amber-500/20 border-amber-500/40",
    badgeText: "text-amber-400",
  },
  info: {
    icon: Info,
    border: "border-primary/30",
    glow: "shadow-[0_0_15px_rgba(0,212,255,0.15)]",
    bg: "from-primary/10 via-primary/5 to-transparent",
    text: "text-primary",
    badge: "bg-primary/20 border-primary/40",
    badgeText: "text-primary",
  },
  success: {
    icon: CheckCircle,
    border: "border-emerald-500/40",
    glow: "shadow-[0_0_18px_rgba(16,185,129,0.2)]",
    bg: "from-emerald-500/12 via-emerald-500/5 to-transparent",
    text: "text-emerald-400",
    badge: "bg-emerald-500/20 border-emerald-500/40",
    badgeText: "text-emerald-400",
  },
};

// ─── component ──────────────────────────────────────────────────────────────

interface InsightCardProps {
  insight: PactInsight;
  index: number;
}

export function InsightCard({ insight, index }: InsightCardProps) {
  const navigate = useNavigate();
  const cfg = levelConfig[insight.level];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, filter: "blur(6px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ delay: index * 0.15, type: "spring", stiffness: 80, damping: 14 }}
      className={cn(
        "relative group rounded-xl overflow-hidden",
        "bg-gradient-to-r backdrop-blur-md",
        "border transition-all duration-300",
        "hover:brightness-110",
        cfg.bg,
        cfg.border,
        cfg.glow,
      )}
    >
      {/* Scanline texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 3px)",
        }}
      />

      <div className="relative z-10 flex items-start gap-3 p-3.5">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 p-1.5 rounded-lg border",
            cfg.border,
            "bg-black/30"
          )}
        >
          <Icon className={cn("w-4 h-4", cfg.text)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Title row with badge */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-orbitron font-bold uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border",
                cfg.badge,
                cfg.badgeText,
              )}
            >
              {insight.level}
            </span>
            <span className={cn("text-xs font-orbitron font-bold tracking-wide truncate", cfg.text)}>
              {insight.title}
            </span>
          </div>

          {/* Body — typewriter-style monospace feel */}
          <p className="text-[11px] font-rajdhani text-muted-foreground/80 leading-relaxed">
            {insight.body}
          </p>

          {/* CTA button */}
          {insight.actionLabel && insight.actionRoute && (
            <button
              onClick={() => navigate(insight.actionRoute!)}
              className={cn(
                "inline-flex items-center gap-1 mt-1",
                "text-[10px] font-orbitron font-bold uppercase tracking-[0.12em]",
                "px-2.5 py-1 rounded-md border",
                "transition-all duration-200",
                "hover:scale-[1.03] active:scale-[0.97]",
                cfg.border,
                cfg.text,
                "bg-black/30 hover:bg-black/50"
              )}
            >
              {insight.actionLabel}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
