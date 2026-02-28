"use client";

import { motion, Variants } from "framer-motion";

import { SmartProjectHeader } from "./SmartProjectHeader";
import { QuickActionsBar } from "@/components/home/QuickActionsBar";
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

export function HeroSection({ pact, focusGoals, allGoals, rankData, ownedModules, className }: HeroSectionProps) {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("relative w-full max-w-5xl mx-auto z-10", className)}
    >
      <div className="flex flex-col gap-3">
        {/* System Status (collapsible Pact Nexus) */}
        <motion.div variants={itemVariants}>
          <SmartProjectHeader focusGoals={focusGoals} allGoals={allGoals} pact={pact} />
        </motion.div>

        {/* Command Strip */}
        <motion.div variants={itemVariants}>
          <QuickActionsBar ownedModules={ownedModules} />
        </motion.div>

        {/* Mission Randomizer */}
        <motion.div variants={itemVariants}>
          <MissionRandomizer allGoals={focusGoals.length ? focusGoals : allGoals} />
        </motion.div>
      </div>
    </motion.section>
  );
}
