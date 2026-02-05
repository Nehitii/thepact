"use client";

import { useMemo } from "react";
import { motion, Variants } from "framer-motion";
import { Trophy, Zap } from "lucide-react";

import { PactVisual } from "@/components/PactVisual";
import { TodaysFocusMessage } from "@/components/home/TodaysFocusMessage";
import { QuickActionsBar } from "@/components/home/QuickActionsBar";
import { CurrentRankBadge } from "./CurrentRankBadge";
import { XPProgressBar } from "./XPProgressBar";
import { QuickStatsBadges } from "./QuickStatsBadges";
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
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 60, damping: 12 },
  },
};

export function HeroSection({ pact, focusGoals, allGoals, rankData, ownedModules, className }: HeroSectionProps) {
  const progressPercentage = Number(pact.global_progress) || 0;

  const { currentRank, nextRank, currentXP, progressInCurrentRank } = rankData;

  const level = useMemo(() => {
    if (!currentRank || !rankData.ranks.length) return 1;
    const index = rankData.ranks.findIndex((r) => r.id === currentRank.id);
    return index >= 0 ? index + 1 : 1;
  }, [currentRank, rankData.ranks]);

  const quickStats = useMemo(() => {
    const completedGoals = allGoals.filter((g) => g.status === "fully_completed" || g.status === "validated").length;

    // CORRECTION ICI : Définition explicite de totalGoals
    const totalGoals = allGoals.length;

    const primaryFocus = focusGoals[0];
    const focusGoalName = primaryFocus?.name || null;

    const daysRemaining = pact.project_end_date
      ? Math.max(0, Math.ceil((new Date(pact.project_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    return { totalGoals, completedGoals, focusGoalName, daysRemaining };
  }, [allGoals, focusGoals, pact.project_end_date]);

  const isMaxRank = !nextRank && rankData.ranks.length > 0;
  const currentRankMin = currentRank?.min_points || 0;
  const nextRankMin = nextRank?.min_points || currentRankMin + 1000;
  const nextRankName = nextRank?.name || "Next Rank";

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("relative w-full max-w-7xl mx-auto px-4 sm:px-6 z-10 py-6", className)}
    >
      {/* 🔮 Background Layers */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent -translate-x-1/2" />
      </div>

      <div className="flex flex-col items-center space-y-6">
        {/* --- 1. IDENTITY --- */}
        <motion.div variants={itemVariants} className="relative z-20 text-center w-full">
          <div className="group relative flex justify-center mb-4">
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity duration-1000" />
            <PactVisual symbol={pact.symbol} progress={progressPercentage} size="lg" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-black font-orbitron tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            {pact.name}
          </h1>

          <div className="flex justify-center mt-3">
            <TodaysFocusMessage focusGoals={focusGoals} allGoals={allGoals} />
          </div>
        </motion.div>

        {/* --- 2. RANK & XP (UNIFIED CARD) --- */}
        <motion.div variants={itemVariants} className="w-full max-w-2xl relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 rounded-3xl opacity-30 blur-sm" />
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 backdrop-blur-md p-6">
            <div className="flex items-end justify-between mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-cyan-400 font-orbitron uppercase tracking-widest">Rang Actuel</span>
                <CurrentRankBadge
                  rank={currentRank}
                  level={level}
                  currentXP={currentXP}
                  progressToNext={progressInCurrentRank}
                  hideProgress={true}
                  className="items-start"
                />
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span className="text-[10px] text-muted-foreground font-orbitron uppercase tracking-widest">
                  Prochain Palier
                </span>
                <div className="flex items-center gap-2 text-white/90 font-bold font-orbitron text-sm">
                  {nextRankName} <Zap size={14} className="text-amber-400 fill-amber-400" />
                </div>
              </div>
            </div>

            <XPProgressBar
              currentXP={currentXP}
              currentRankXP={currentRankMin}
              nextRankXP={nextRankMin}
              nextRankName={nextRankName}
              isMaxRank={isMaxRank}
              frameColor={currentRank?.frame_color}
              showLabels={false}
              className="h-5"
            />

            <div className="flex justify-between mt-2 text-[10px] font-mono text-white/30">
              <span>{currentXP.toLocaleString()} XP</span>
              <span>{nextRankMin.toLocaleString()} XP</span>
            </div>
          </div>
        </motion.div>

        {/* --- 3. STATS GRID --- */}
        <motion.div variants={itemVariants} className="w-full">
          <QuickStatsBadges
            totalGoals={quickStats.totalGoals}
            completedGoals={quickStats.completedGoals}
            focusGoalName={quickStats.focusGoalName}
            daysRemaining={quickStats.daysRemaining}
          />
        </motion.div>

        {/* --- 4. DOCK ACTIONS --- */}
        <div className="h-4" />

        <motion.div variants={itemVariants} className="w-full sticky bottom-6 z-30">
          <QuickActionsBar ownedModules={ownedModules} />
        </motion.div>
      </div>
    </motion.section>
  );
}
