"use client";

import { useMemo } from "react";
import { motion, Variants } from "framer-motion";
import { Trophy, Zap } from "lucide-react";

import { PactVisual } from "@/components/PactVisual";
import { SmartProjectHeader } from "./SmartProjectHeader";
import { QuickActionsBar } from "@/components/home/QuickActionsBar";
import { CurrentRankBadge } from "./CurrentRankBadge";
import { XPProgressBar } from "./XPProgressBar";
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

  // Stats for Mission Randomizer
  const hasIncompleteGoals = useMemo(() => {
    return allGoals.some(g => {
      const remaining = (g.total_steps || 0) - (g.validated_steps || 0);
      return remaining > 0 && g.status !== 'fully_completed' && g.status !== 'validated';
    });
  }, [allGoals]);

  const isMaxRank = !nextRank && rankData.ranks.length > 0;
  const currentRankMin = currentRank?.min_points || 0;
  const nextRankMin = nextRank?.min_points || currentRankMin + 1000;
  const nextRankName = nextRank?.name || "Next Rank";

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      // Réduction du padding vertical global (py-8 -> py-4)
      className={cn("relative w-full max-w-7xl mx-auto px-4 sm:px-6 z-10 py-4", className)}
    >
      {/* 🔮 Background Layers & Spine */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent -translate-x-1/2" />
      </div>

      {/* Réduction de l'espace entre les blocs principaux (space-y-8 -> space-y-4) */}
      <div className="flex flex-col items-center space-y-4">
        {/* --- 1. IDENTITY BLOCK --- */}
        <motion.div
          variants={itemVariants}
          className="relative z-20 text-center w-full flex flex-col items-center pt-2"
        >
          <div className="group relative flex justify-center mb-4">
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity duration-1000" />
            <div className="relative transform transition-transform duration-500 hover:scale-105">
              <PactVisual symbol={pact.symbol} progress={progressPercentage} size="lg" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-orbitron tracking-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.2)] mb-2">
            {pact.name}
          </h1>

          {/* MANTRA */}
          {pact.mantra && (
            <div className="flex items-center gap-4 mb-3 opacity-80">
              <div className="h-px w-8 md:w-16 bg-gradient-to-r from-transparent to-primary/50" />
              <p className="text-xs sm:text-sm font-rajdhani font-medium uppercase tracking-[0.25em] text-primary/80 whitespace-nowrap">
                {pact.mantra}
              </p>
              <div className="h-px w-8 md:w-16 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
          )}

          {/* SMART PROJECT HEADER - Dynamic next action with metrics */}
          <div className="flex justify-center">
            <SmartProjectHeader focusGoals={focusGoals} allGoals={allGoals} />
          </div>
        </motion.div>

        {/* --- 2. RANK & XP --- */}
        <motion.div variants={itemVariants} className="w-full max-w-2xl relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 blur-md" />
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 backdrop-blur-md p-5 sm:p-6 shadow-2xl">
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/20 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/20 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20 rounded-br-xl" />

            <div className="flex items-end justify-between mb-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-cyan-400 font-orbitron uppercase tracking-widest flex items-center gap-2">
                  <Trophy size={12} /> Rang Actuel
                </span>
                <CurrentRankBadge
                  rank={currentRank}
                  level={level}
                  currentXP={currentXP}
                  progressToNext={progressInCurrentRank}
                  hideProgress={true}
                  className="items-start scale-105 origin-left"
                />
              </div>
              <div className="text-right flex flex-col items-end gap-1.5">
                <span className="text-[10px] text-muted-foreground font-orbitron uppercase tracking-widest">
                  Prochain Palier
                </span>
                <div className="flex items-center gap-2 text-white/90 font-bold font-orbitron text-sm">
                  {nextRankName} <Zap size={14} className="text-amber-400 fill-amber-400 animate-pulse" />
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
              className="h-4"
            />

            <div className="flex justify-between mt-2 text-[10px] font-mono text-white/30">
              <span>{currentXP.toLocaleString()} XP</span>
              <span>{nextRankMin.toLocaleString()} XP</span>
            </div>
          </div>
        </motion.div>

        {/* --- 3. MISSION RANDOMIZER (Replaced redundant stats) --- */}
        <motion.div variants={itemVariants} className="w-full max-w-md">
          <MissionRandomizer allGoals={allGoals} />
        </motion.div>

        {/* --- 4. DOCK ACTIONS --- */}
        {/* Suppression de l'espaceur inutile ici pour coller le dock aux stats */}

        <motion.div variants={itemVariants} className="w-full sticky bottom-4 z-30">
          <QuickActionsBar ownedModules={ownedModules} />
        </motion.div>
      </div>
    </motion.section>
  );
}
