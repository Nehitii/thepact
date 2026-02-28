"use client";

import { useMemo } from "react";
import { motion, Variants } from "framer-motion";
import { useTranslation } from "react-i18next";

import { PactVisual } from "@/components/PactVisual";
import { SmartProjectHeader } from "./SmartProjectHeader";
import { QuickActionsBar } from "@/components/home/QuickActionsBar";
import { MissionRandomizer } from "./MissionRandomizer";
import { cn } from "@/lib/utils";
import { Pact } from "@/hooks/usePact";
import { Goal } from "@/hooks/useGoals";
import { RankXPData } from "@/hooks/useRankXP";

interface HeroSectionProps {
  pact: Pact;
  focusGoals: Goal[];
  allGoals: Goal[];
  rankData: RankXPData;
  ownedModules: {
    todo: boolean;
    journal: boolean;
    health: boolean;
  };
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 80, damping: 16 },
  },
};

function fmt(n: number) {
  return n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : n.toLocaleString();
}

export function HeroSection({ pact, focusGoals, allGoals, rankData, ownedModules, className }: HeroSectionProps) {
  const { t } = useTranslation();
  const progressPercentage = Number(pact.global_progress) || 0;
  const { currentRank, nextRank, currentXP, progressInCurrentRank } = rankData;

  const level = useMemo(() => {
    if (!currentRank || !rankData.ranks.length) return 1;
    const index = rankData.ranks.findIndex((r) => r.id === currentRank.id);
    return index >= 0 ? index + 1 : 1;
  }, [currentRank, rankData.ranks]);

  const isMaxRank = !nextRank && rankData.ranks.length > 0;
  const currentRankMin = currentRank?.min_points || 0;
  const nextRankMin = nextRank?.min_points || currentRankMin + 1000;
  const rankName = currentRank?.name ?? "Novice";
  const frameColor = currentRank?.frame_color ?? "#00d4ff";

  // XP progress within current rank
  const xpSpan = nextRankMin - currentRankMin;
  const xpProgress = isMaxRank ? 100 : xpSpan > 0 ? Math.min(((currentXP - currentRankMin) / xpSpan) * 100, 100) : 0;

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("relative w-full max-w-5xl mx-auto z-10", className)}
    >
      <div className="flex flex-col gap-3">
        {/* ═══ ZONE 1: IDENTITY BAR ═══ */}
        <motion.div
          variants={itemVariants}
          className="relative rounded-sm overflow-hidden bg-[rgba(6,11,22,0.92)] backdrop-blur-xl border border-[rgba(0,180,255,0.08)] shadow-[0_8px_48px_rgba(0,0,0,0.9)]"
        >
          <div className="flex items-center gap-4 px-5 py-4">
            {/* Pact Visual */}
            <div className="shrink-0">
              <PactVisual symbol={pact.symbol} progress={progressPercentage} size="sm" />
            </div>

            {/* Pact Identity */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-orbitron font-black tracking-tight text-[#ddeeff] truncate">
                {pact.name}
              </h1>
              {pact.mantra && (
                <p className="text-[11px] font-rajdhani text-[rgba(160,210,255,0.4)] uppercase tracking-[0.2em] truncate mt-0.5">
                  {pact.mantra}
                </p>
              )}
            </div>

            {/* Rank + XP readout */}
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[rgba(0,180,255,0.04)] border border-[rgba(0,180,255,0.1)]">
                <span
                  className="text-[10px] font-orbitron font-bold uppercase tracking-[0.15em]"
                  style={{ color: frameColor }}
                >
                  {rankName}
                </span>
                <span className="text-[rgba(160,210,255,0.2)]">·</span>
                <span className="text-[10px] font-mono text-[rgba(160,210,255,0.5)] tabular-nums">
                  LVL {level}
                </span>
                <span className="text-[rgba(160,210,255,0.2)]">·</span>
                <span className="text-[10px] font-mono text-[rgba(160,210,255,0.5)] tabular-nums">
                  {fmt(currentXP)} XP
                </span>
              </div>
            </div>
          </div>

          {/* XP progress bar — full-width bottom edge */}
          <div className="h-[2px] w-full bg-[rgba(0,180,255,0.06)]">
            <div
              className="h-full transition-all duration-1000 ease-out"
              style={{
                width: `${xpProgress}%`,
                backgroundColor: frameColor,
                boxShadow: `0 0 8px ${frameColor}66`,
              }}
            />
          </div>
        </motion.div>

        {/* ═══ ZONE 1.5: SYSTEM STATUS (collapsible Pact Nexus) ═══ */}
        <motion.div variants={itemVariants}>
          <SmartProjectHeader focusGoals={focusGoals} allGoals={allGoals} pact={pact} />
        </motion.div>

        {/* ═══ ZONE 2: COMMAND STRIP ═══ */}
        <motion.div variants={itemVariants}>
          <QuickActionsBar ownedModules={ownedModules} />
        </motion.div>

        {/* ═══ ZONE 2.5: MISSION RANDOMIZER ═══ */}
        <motion.div variants={itemVariants}>
          <MissionRandomizer allGoals={focusGoals.length ? focusGoals : allGoals} />
        </motion.div>
      </div>
    </motion.section>
  );
}
