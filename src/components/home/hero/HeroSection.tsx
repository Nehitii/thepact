"use client";

import { useMemo } from "react";
import { motion, Variants } from "framer-motion";
import { Trophy, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

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

// ─── types ───────────────────────────────────────────────────────────────────

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

// ─── motion variants ─────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
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

// ─── component ───────────────────────────────────────────────────────────────

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
  const nextRankName = nextRank?.name || t("home.hero.nextRank", "Next Rank");
  const frameColor = currentRank?.frame_color ?? "#00ffa3";

  // Colour derivations from frameColor
  const fc = {
    full: frameColor,
    glow: `${frameColor}99`,
    mid: `${frameColor}44`,
    dim: `${frameColor}18`,
    text: `${frameColor}88`,
  };

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("relative w-full max-w-4xl mx-auto px-4 sm:px-6 z-10 py-4", className)}
    >
      {/* Background spine */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent -translate-x-1/2" />
      </div>

      <div className="flex flex-col items-center space-y-4">
        {/* ── 1. Identity block (Visual + name + SmartProjectHeader) ── */}
        <motion.div
          variants={itemVariants}
          className="relative z-20 text-center w-full flex flex-col items-center pt-2"
        >
          <div className="group relative flex justify-center mb-4">
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity duration-1000" />
            <div className="relative transform transition-transform duration-500 hover:scale-105">
              <PactVisual symbol={pact.symbol} progress={progressPercentage} size="md" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-orbitron tracking-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.2)] mb-2">
            {pact.name}
          </h1>

          {pact.mantra && (
            <div className="flex items-center gap-4 mb-3 opacity-80">
              <div className="h-px w-8 md:w-16 bg-gradient-to-r from-transparent to-primary/50" />
              <p className="text-xs sm:text-sm font-rajdhani font-medium uppercase tracking-[0.25em] text-primary/80 whitespace-nowrap">
                {pact.mantra}
              </p>
              <div className="h-px w-8 md:w-16 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
          )}

          <div className="flex justify-center">
            <SmartProjectHeader focusGoals={focusGoals} allGoals={allGoals} />
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════
            3. RANK PANEL — full cyberpunk treatment
        ══════════════════════════════════════════════════════ */}
        <motion.div variants={itemVariants} className="w-full max-w-2xl">
          {/* Outer glow halo */}
          <div
            className="absolute -inset-px rounded-sm pointer-events-none"
            style={{ boxShadow: `0 0 32px ${fc.dim}` }}
          />

          {/* Panel shell */}
          <div
            className="relative overflow-hidden p-5 sm:p-6"
            style={{
              background: "linear-gradient(135deg, #0d2030 0%, #080f14 50%, #060c11 100%)",
              border: `1px solid ${fc.mid}`,
              clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
            }}
          >
            {/* ── Scanlines ── */}
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)",
              }}
            />

            {/* ── Grid ── */}
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundImage: `linear-gradient(${fc.dim} 1px, transparent 1px), linear-gradient(90deg, ${fc.dim} 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />

            {/* ── Ambient left glow ── */}
            <div
              className="absolute -left-16 top-1/2 -translate-y-1/2 w-48 h-full pointer-events-none z-0"
              style={{
                background: `radial-gradient(ellipse at center, ${fc.dim} 0%, transparent 70%)`,
              }}
            />

            {/* ── Corner accent top-right ── */}
            <div
              className="absolute top-0 right-0 pointer-events-none z-0"
              style={{
                width: 0,
                height: 0,
                borderTop: `20px solid ${fc.mid}`,
                borderLeft: "20px solid transparent",
                filter: `drop-shadow(0 0 4px ${fc.glow})`,
              }}
            />

            {/* ── Corner accent bottom-left ── */}
            <div
              className="absolute bottom-0 left-0 pointer-events-none z-0"
              style={{
                width: 0,
                height: 0,
                borderBottom: `20px solid ${fc.mid}`,
                borderRight: "20px solid transparent",
                filter: `drop-shadow(0 0 4px ${fc.glow})`,
              }}
            />

            {/* ── Bottom glow line ── */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px pointer-events-none z-0"
              style={{
                background: `linear-gradient(90deg, transparent, ${fc.mid} 25%, ${fc.full} 50%, ${fc.mid} 75%, transparent)`,
              }}
            />

            {/* ── Top glow line ── */}
            <div
              className="absolute top-0 left-0 right-0 h-px pointer-events-none z-0"
              style={{
                background: `linear-gradient(90deg, transparent, ${fc.dim} 40%, ${fc.mid} 60%, transparent)`,
              }}
            />

            {/* ══ CONTENT (above all overlays) ══ */}
            <div className="relative z-10 space-y-4">
              {/* ── Row 1: meta labels ── */}
              <div className="flex items-center justify-between">
                {/* Left: "CURRENT RANK" label */}
                <div className="flex items-center gap-2" style={{ color: fc.text }}>
                  <Trophy size={10} />
                  <span className="font-orbitron text-[9px] tracking-[0.3em] uppercase">
                    {t("home.hero.currentRank", "Current Rank")}
                  </span>
                </div>

                {/* Right: "NEXT TIER" label + name */}
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-orbitron text-[9px] tracking-[0.3em] uppercase" style={{ color: fc.text }}>
                    {t("home.hero.nextTier", "Next Tier")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-orbitron font-black text-sm tracking-[0.12em] uppercase"
                      style={{
                        color: "#ffb400",
                        filter: "drop-shadow(0 0 8px #ffb40088)",
                      }}
                    >
                      {nextRankName}
                    </span>
                    {/* Diamond icon */}
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        background: "#ffb40020",
                        border: "1px solid #ffb40055",
                        clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Zap size={7} style={{ color: "#ffb400", fill: "#ffb400" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Row 2: Rank name + Level (CurrentRankBadge) ── */}
              <CurrentRankBadge
                rank={currentRank}
                level={level}
                currentXP={currentXP}
                progressToNext={progressInCurrentRank}
                hideProgress={true}
              />

              {/* ── Row 3: XP Progress bar (showLabels=true for ticks) ── */}
              <XPProgressBar
                currentXP={currentXP}
                currentRankXP={currentRankMin}
                nextRankXP={nextRankMin}
                nextRankName={nextRankName}
                isMaxRank={isMaxRank}
                frameColor={frameColor}
                showLabels={true}
              />
            </div>
          </div>
        </motion.div>

        {/* ── 4. Quick actions ── */}
        <motion.div variants={itemVariants} className="w-full">
          <QuickActionsBar ownedModules={ownedModules} />
        </motion.div>

        {/* ── 5. Mission randomizer ── */}
        <motion.div variants={itemVariants} className="w-full">
          <MissionRandomizer allGoals={focusGoals.length ? focusGoals : allGoals} />
        </motion.div>
      </div>
    </motion.section>
  );
}
