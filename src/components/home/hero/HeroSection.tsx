"use client";

import { useMemo } from "react";
import { motion, Variants } from "framer-motion"; // Import de Variants ajouté
import { Sparkles, Trophy, Zap } from "lucide-react";

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

/**
 * ANIMATIONS CONFIG
 * Typage explicite : Variants pour éviter l'erreur TS2322
 */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 50, damping: 15 },
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

    const primaryFocus = focusGoals[0];
    const focusGoalName = primaryFocus?.name || null;

    const daysRemaining = pact.project_end_date
      ? Math.max(0, Math.ceil((new Date(pact.project_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    return {
      totalGoals: allGoals.length,
      completedGoals,
      focusGoalName,
      daysRemaining,
    };
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
      className={cn("relative w-full max-w-7xl mx-auto px-4 sm:px-6 z-10", className)}
    >
      {/* --- LAYER 0: ATMOSPHERIC BACKGROUND --- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] opacity-40 mix-blend-screen animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="flex flex-col items-center space-y-8 pt-6 pb-10">
        {/* --- BLOCK 1: IDENTITY CORE --- */}
        <motion.div variants={itemVariants} className="relative z-20 text-center space-y-4">
          <div className="group relative flex justify-center mb-6">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-accent/30 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
            <div className="relative transform transition-transform duration-500 hover:scale-105 hover:rotate-2">
              <PactVisual symbol={pact.symbol} progress={progressPercentage} size="lg" />
              <div className="absolute -bottom-2 -right-2 bg-background/80 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-full shadow-xl flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-orbitron font-bold text-foreground">LVL {level}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black font-orbitron tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/50 drop-shadow-sm">
              {pact.name}
            </h1>
            <p className="flex items-center justify-center gap-2 text-sm md:text-base text-muted-foreground/80 font-rajdhani font-medium tracking-widest uppercase">
              <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-primary/50" />
              {pact.mantra}
              <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-primary/50" />
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <TodaysFocusMessage focusGoals={focusGoals} allGoals={allGoals} />
          </div>
        </motion.div>

        {/* --- BLOCK 2: PLAYER STATUS CARD --- */}
        <motion.div variants={itemVariants} className="w-full max-w-2xl">
          <div className="relative group overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />

            <div className="p-6 md:p-8 space-y-6 relative z-10">
              {/* Header: Rank Info */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <Trophy size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider">Rang Actuel</p>
                    <CurrentRankBadge
                      rank={currentRank}
                      level={level}
                      currentXP={currentXP}
                      progressToNext={progressInCurrentRank}
                      className="p-0 border-none bg-transparent shadow-none"
                      hideProgress={true} // PROPRIÉTÉ AJOUTÉE
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider text-right">
                      Prochain Palier
                    </p>
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-orbitron font-bold text-sm text-foreground/80">{nextRankName}</span>
                      <Zap size={14} className={cn("text-muted-foreground", isMaxRank && "text-amber-500")} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Body: XP Bar Enlarged */}
              <div className="pt-2">
                <XPProgressBar
                  currentXP={currentXP}
                  currentRankXP={currentRankMin}
                  nextRankXP={nextRankMin}
                  nextRankName={nextRankName}
                  isMaxRank={isMaxRank}
                  frameColor={currentRank?.frame_color}
                  showLabels={false} // PROPRIÉTÉ AJOUTÉE
                  className="h-4"
                />
                <div className="flex justify-between mt-2 text-[10px] font-rajdhani text-muted-foreground/50 uppercase tracking-widest">
                  <span>{currentRankMin} XP</span>
                  <span>{isMaxRank ? "MAX" : `${nextRankMin} XP`}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* --- BLOCK 3: MISSION CONTROL --- */}
        <motion.div variants={itemVariants} className="w-full">
          <QuickStatsBadges
            totalGoals={quickStats.totalGoals}
            completedGoals={quickStats.completedGoals}
            focusGoalName={quickStats.focusGoalName}
            daysRemaining={quickStats.daysRemaining}
            className="py-2"
          />
        </motion.div>

        {/* --- BLOCK 4: ACTIONS DOCK --- */}
        <motion.div variants={itemVariants} className="w-full max-w-lg">
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-8 h-[1px] bg-gradient-to-r from-transparent to-border -translate-x-full" />
            <div className="absolute top-1/2 right-0 w-8 h-[1px] bg-gradient-to-l from-transparent to-border translate-x-full" />
            <QuickActionsBar ownedModules={ownedModules} className="pt-0" />
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
