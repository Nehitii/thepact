"use client";

import { useMemo, useEffect, useRef } from "react";
import { motion, Variants, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Trophy, Zap, ChevronRight } from "lucide-react";
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
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 55, damping: 14 },
  },
};

/** Animated scanline overlay — pure CSS trick via a repeating gradient */
function ScanlineOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl opacity-[0.03]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.6) 2px, rgba(0,255,255,0.6) 3px)",
        backgroundSize: "100% 4px",
      }}
    />
  );
}

/** Floating grid dots for ambient depth */
function GridBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-20 overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(6,182,212,0.07) 0%, transparent 55%),
          radial-gradient(circle at 80% 70%, rgba(139,92,246,0.06) 0%, transparent 55%),
          radial-gradient(circle at 50% 50%, rgba(6,182,212,0.03) 0%, transparent 80%)
        `,
      }}
    />
  );
}

/** Tilt card effect hook */
function useTilt(strength = 8) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [strength, -strength]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-strength, strength]), { stiffness: 200, damping: 30 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return { ref, rotateX, rotateY, onMouseMove, onMouseLeave };
}

export function HeroSection({ pact, focusGoals, allGoals, rankData, ownedModules, className }: HeroSectionProps) {
  const { t } = useTranslation();
  const progressPercentage = Number(pact.global_progress) || 0;
  const tilt = useTilt(6);

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

  // XP progress 0–1 within current rank
  const xpFraction =
    nextRankMin > currentRankMin ? Math.min((currentXP - currentRankMin) / (nextRankMin - currentRankMin), 1) : 1;

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("relative w-full max-w-4xl mx-auto px-4 sm:px-6 z-10 py-6", className)}
    >
      <GridBackground />

      {/* Central vertical energy spine */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden flex justify-center">
        <div className="relative w-px h-full">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-300/60 to-transparent"
            animate={{ opacity: [0.2, 0.6, 0.2], scaleY: [0.8, 1.1, 0.8] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center space-y-5">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            1. IDENTITY BLOCK
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          variants={itemVariants}
          className="relative z-20 text-center w-full flex flex-col items-center pt-2"
        >
          {/* Avatar halo + visual */}
          <div className="group relative flex justify-center mb-5">
            {/* Outer rings */}
            <motion.div
              className="absolute inset-[-16px] rounded-full border border-cyan-400/15"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-[-28px] rounded-full border border-cyan-400/8"
              animate={{ rotate: -360 }}
              transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
            />

            {/* Glow burst */}
            <motion.div
              className="absolute inset-0 rounded-full blur-[70px] bg-cyan-400/25"
              animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full blur-[40px] bg-violet-500/15"
              animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
              className="relative"
              whileHover={{ scale: 1.06 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <PactVisual symbol={pact.symbol} progress={progressPercentage} size="md" />
            </motion.div>
          </div>

          {/* Pact name with glitch-shimmer */}
          <motion.h1
            className="relative text-4xl sm:text-6xl font-black font-orbitron tracking-tight text-white mb-1"
            style={{
              textShadow: "0 0 30px rgba(6,182,212,0.4), 0 0 60px rgba(6,182,212,0.15), 0 0 1px rgba(255,255,255,0.8)",
            }}
          >
            {pact.name}
            {/* Subtle shimmer sweep */}
            <motion.span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-md pointer-events-none"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
            />
          </motion.h1>

          {/* MANTRA */}
          {pact.mantra && (
            <motion.div
              className="flex items-center gap-4 mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              transition={{ delay: 0.5 }}
            >
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent via-cyan-400/50 to-cyan-400/80" />
              <p className="text-[11px] sm:text-xs font-rajdhani font-semibold uppercase tracking-[0.3em] text-cyan-300/90 whitespace-nowrap">
                {pact.mantra}
              </p>
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent via-cyan-400/50 to-cyan-400/80" />
            </motion.div>
          )}

          {/* SMART PROJECT HEADER */}
          <div className="flex justify-center mt-1">
            <SmartProjectHeader focusGoals={focusGoals} allGoals={allGoals} />
          </div>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            2. RANK & XP CARD
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-2xl"
          ref={tilt.ref}
          onMouseMove={tilt.onMouseMove}
          onMouseLeave={tilt.onMouseLeave}
          style={{ perspective: 800 }}
        >
          <motion.div
            style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformStyle: "preserve-3d" }}
            className="relative"
          >
            {/* Outer glow layer */}
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-cyan-400/30 via-transparent to-violet-500/20 blur-[2px]" />

            {/* Card itself */}
            <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-black/70 backdrop-blur-xl shadow-[0_0_60px_rgba(6,182,212,0.08),inset_0_1px_0_rgba(255,255,255,0.06)]">
              <ScanlineOverlay />

              {/* Top accent line */}
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

              {/* Corner decorations — extended */}
              {[
                "top-0 left-0 border-t border-l rounded-tl-2xl",
                "top-0 right-0 border-t border-r rounded-tr-2xl",
                "bottom-0 left-0 border-b border-l rounded-bl-2xl",
                "bottom-0 right-0 border-b border-r rounded-br-2xl",
              ].map((cls, i) => (
                <div key={i} className={cn("absolute w-5 h-5 border-cyan-400/40", cls)} />
              ))}

              {/* Interior radial ambient */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.05)_0%,transparent_60%)] pointer-events-none" />

              <div className="relative p-5 sm:p-6">
                <div className="flex items-end justify-between mb-5">
                  {/* Left: current rank */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] text-cyan-400/80 font-orbitron uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Trophy size={10} className="text-cyan-400" />
                      {t("home.hero.currentRank", "Current Rank")}
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

                  {/* Right: next tier */}
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className="text-[9px] text-white/30 font-orbitron uppercase tracking-[0.2em]">
                      {t("home.hero.nextTier", "Next Tier")}
                    </span>
                    <div className="flex items-center gap-1.5 text-white/80 font-bold font-orbitron text-sm group cursor-default">
                      <span className="group-hover:text-amber-300 transition-colors duration-200">{nextRankName}</span>
                      <ChevronRight
                        size={10}
                        className="text-white/20 group-hover:text-amber-300/60 transition-colors"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Zap size={13} className="text-amber-400 fill-amber-400" />
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* XP Bar */}
                <div className="relative">
                  <XPProgressBar
                    currentXP={currentXP}
                    currentRankXP={currentRankMin}
                    nextRankXP={nextRankMin}
                    nextRankName={nextRankName}
                    isMaxRank={isMaxRank}
                    frameColor={currentRank?.frame_color}
                    showLabels={false}
                    className="h-3.5 rounded-full"
                  />
                  {/* Glow on bar fill */}
                  <div
                    className="absolute top-0 left-0 h-full rounded-full pointer-events-none transition-all duration-700"
                    style={{
                      width: `${xpFraction * 100}%`,
                      boxShadow: "0 0 10px 2px rgba(6,182,212,0.5), 0 0 20px 4px rgba(6,182,212,0.2)",
                    }}
                  />
                </div>

                <div className="flex justify-between mt-2.5 text-[9px] font-mono">
                  <span className="text-cyan-400/50">{currentXP.toLocaleString()} XP</span>
                  <span className="text-white/20">{nextRankMin.toLocaleString()} XP</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            3. MISSION RANDOMIZER
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div variants={itemVariants} className="w-full max-w-md">
          <MissionRandomizer allGoals={allGoals} />
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            4. DOCK ACTIONS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div variants={itemVariants} className="w-full sticky bottom-4 z-30">
          <QuickActionsBar ownedModules={ownedModules} />
        </motion.div>
      </div>
    </motion.section>
  );
}
