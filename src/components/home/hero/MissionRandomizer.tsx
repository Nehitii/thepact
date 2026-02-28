"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Dices, Target, Focus, RotateCcw, Zap, Lock } from "lucide-react";
import { Goal } from "@/hooks/useGoals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useActiveMission, DeadlineType } from "@/hooks/useActiveMission";
import { DeadlineSelector } from "./DeadlineSelector";
import { ActiveMissionCard } from "./ActiveMissionCard";

const ITEM_HEIGHT = 80;
const SPIN_DURATION = 2.5;
const REEL_ITEMS = 40;

interface MissionRandomizerProps {
  allGoals: Goal[];
  className?: string;
}

interface PendingMission {
  goal: Goal;
  stepTitle: string;
  stepId: string | null;
}

type ViewState = "idle" | "spinning" | "confirm" | "deadline";

const SlotReel = ({
  candidates,
  winner,
  onSpinComplete,
}: {
  candidates: Goal[];
  winner: Goal;
  onSpinComplete: () => void;
}) => {
  const controls = useAnimation();

  const reelStrip = useMemo(() => {
    const strip = [];
    for (let i = 0; i < REEL_ITEMS - 1; i++) {
      strip.push(candidates[Math.floor(Math.random() * candidates.length)]);
    }
    strip.push(winner);
    return strip;
  }, [candidates, winner]);

  useEffect(() => {
    const animate = async () => {
      await controls.set({ y: 0, filter: "blur(0px)" });
      const targetY = -((REEL_ITEMS - 1) * ITEM_HEIGHT);
      await controls.start({
        y: targetY,
        filter: ["blur(0px)", "blur(8px)", "blur(0px)"],
        transition: {
          duration: SPIN_DURATION,
          ease: [0.25, 1, 0.5, 1],
        },
      });
      setTimeout(() => {
        onSpinComplete();
      }, 400);
    };
    animate();
  }, [controls, onSpinComplete]);

  return (
    <div className="relative h-[80px] w-full overflow-hidden border-y border-[rgba(0,180,255,0.2)] bg-[rgba(2,4,10,0.8)] shadow-inner">
      {/* Target Line */}
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-between px-2">
        <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
      </div>

      {/* 3D cylinder shadows */}
      <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />

      <motion.div animate={controls} className="flex flex-col w-full">
        {reelStrip.map((goal, index) => (
          <div key={index} className="h-[80px] flex items-center justify-center px-4 w-full">
            <span
              className={cn(
                "text-lg md:text-xl font-bold uppercase tracking-wider text-center truncate w-full",
                index === reelStrip.length - 1
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500"
                  : "text-white/30",
              )}
            >
              {goal.name}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export function MissionRandomizer({ allGoals, className }: MissionRandomizerProps) {
  const navigate = useNavigate();
  const { activeMission, hasMission, isLoading, focusMission, abandonMission, completeMissionStep } =
    useActiveMission();

  const [viewState, setViewState] = useState<ViewState>("idle");
  const [targetMission, setTargetMission] = useState<PendingMission | null>(null);
  const [tempWinner, setTempWinner] = useState<Goal | null>(null);
  const [isFocusing, setIsFocusing] = useState(false);

  const eligibleGoals = useMemo(
    () =>
      allGoals.filter((g) => {
        if (g.goal_type === 'habit') return false;
        const remaining = (g.total_steps || 0) - (g.validated_steps || 0);
        return remaining > 0 && g.status !== "fully_completed" && g.status !== "validated";
      }),
    [allGoals],
  );

  const hasEligibleGoals = eligibleGoals.length > 0;

  const handleSpinStart = async () => {
    if (!hasEligibleGoals) return;
    const winner = eligibleGoals[Math.floor(Math.random() * eligibleGoals.length)];
    setTempWinner(winner);
    setViewState("spinning");

    try {
      const { data: steps } = await supabase
        .from("steps")
        .select("id, title")
        .eq("goal_id", winner.id)
        .eq("status", "pending")
        .eq("exclude_from_spin", false)
        .order("order", { ascending: true })
        .limit(1);

      const stepData =
        steps && steps.length > 0
          ? { goal: winner, stepTitle: steps[0].title, stepId: steps[0].id }
          : { goal: winner, stepTitle: "Continue working on this goal", stepId: null };
      setTargetMission(stepData);
    } catch (e) {
      console.error("Error fetching step", e);
      setTargetMission({ goal: winner, stepTitle: "Goal Selected", stepId: null });
    }
  };

  const handleSpinEnd = () => setViewState("confirm");
  const handleConfirm = () => setViewState("deadline");
  const handleReroll = () => {
    setViewState("idle");
    setTargetMission(null);
    setTempWinner(null);
  };

  const handleDeadlineSelect = async (deadline: DeadlineType) => {
    if (!targetMission) return;
    setIsFocusing(true);
    const success = await focusMission(
      targetMission.goal.id,
      targetMission.goal.name,
      targetMission.stepId,
      targetMission.stepTitle,
      deadline,
    );
    if (success) {
      setTargetMission(null);
      setViewState("idle");
    }
    setIsFocusing(false);
  };

  if (isLoading)
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );

  if (hasMission && activeMission) {
    return (
      <ActiveMissionCard
        mission={activeMission}
        onAbandon={abandonMission}
        onComplete={completeMissionStep}
        className={className}
      />
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      <AnimatePresence mode="wait">
        {/* IDLE */}
        {viewState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden bg-[rgba(6,11,22,0.92)] backdrop-blur-xl border border-[rgba(0,180,255,0.12)] shadow-[0_8px_48px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(0,212,255,0.06)] p-4 group"
            style={{ borderRadius: "4px" }}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,210,255,0.12)] to-transparent" />

            <div className="relative z-10 flex items-center gap-4">
              <Dices className="w-6 h-6 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-[11px] font-orbitron font-bold text-[#ddeeff] tracking-[0.15em] uppercase">Mission Roulette</h3>
                <p className="text-[10px] text-[rgba(160,210,255,0.35)]">Select next objective via RNG protocol</p>
              </div>
              <Button
                size="sm"
                onClick={handleSpinStart}
                disabled={!hasEligibleGoals}
                className="bg-transparent border border-[rgba(0,210,255,0.4)] text-primary hover:bg-primary hover:text-black font-orbitron text-[10px] uppercase tracking-[0.15em] shadow-[0_0_12px_rgba(0,210,255,0.15)] hover:shadow-[0_0_20px_rgba(0,210,255,0.4)] transition-all"
                style={{ borderRadius: "4px" }}
              >
                {hasEligibleGoals ? "SPIN" : "NO GOALS"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* SPINNING */}
        {viewState === "spinning" && tempWinner && (
          <motion.div
            key="spinning"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden bg-[rgba(2,4,10,0.95)] backdrop-blur-xl border border-[rgba(0,180,255,0.3)] p-6 flex flex-col items-center justify-center gap-4 shadow-[0_0_50px_rgba(0,180,255,0.1)]"
            style={{ borderRadius: "4px" }}
          >
            <div className="relative z-10 flex flex-col items-center w-full gap-4">
              <div className="text-[10px] font-mono text-primary animate-pulse tracking-[0.3em] uppercase">
                Running Algorithm...
              </div>
              <SlotReel candidates={eligibleGoals} winner={tempWinner} onSpinComplete={handleSpinEnd} />
              <div className="flex gap-2 mt-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* CONFIRM */}
        {viewState === "confirm" && targetMission && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="relative overflow-hidden bg-[rgba(6,11,22,0.95)] backdrop-blur-xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(245,158,11,0.06)]"
            style={{ borderRadius: "4px" }}
          >
            <div className="relative z-10 p-5 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="text-[10px] font-orbitron font-bold text-amber-500 uppercase tracking-[0.15em]">
                    Target Locked
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-mono text-amber-500/70 mr-2 uppercase hidden sm:inline-block">
                    Awaiting Input
                  </span>
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 bg-amber-500 rounded-sm"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </div>

              {/* Goal Info */}
              <div className="space-y-1">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono flex items-center gap-1">
                  <Target className="w-3 h-3" /> Mission Objective
                </span>
                <h2 className="text-xl font-bold text-white leading-tight font-sans tracking-wide">
                  {targetMission.goal.name}
                </h2>
              </div>

              {/* Step Detail */}
              <div className="p-4 bg-[rgba(2,4,10,0.8)] border-l-2 border-amber-500" style={{ borderRadius: "4px" }}>
                <span className="text-[10px] text-amber-400 uppercase tracking-wider font-mono block mb-1">
                  {">"} Next Actionable Step
                </span>
                <p className="text-sm font-medium text-gray-200">{targetMission.stepTitle}</p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                <Button
                  onClick={handleConfirm}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold tracking-wider border border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  style={{ borderRadius: "4px" }}
                >
                  <Focus className="w-4 h-4 mr-2" /> ENGAGE
                </Button>
                <Button
                  onClick={handleReroll}
                  variant="outline"
                  className="border-white/10 hover:bg-white/5 hover:text-white hover:border-white/30"
                  style={{ borderRadius: "4px" }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> DISMISS
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* DEADLINE */}
        {viewState === "deadline" && targetMission && (
          <motion.div
            key="deadline"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="relative overflow-hidden bg-[rgba(6,11,22,0.92)] backdrop-blur-xl border border-[rgba(0,180,255,0.12)] p-5 shadow-[0_8px_48px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(0,212,255,0.06)]"
            style={{ borderRadius: "4px" }}
          >
            <div className="mb-4 pb-4 border-b border-[rgba(0,180,255,0.1)] flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Set Timeline</h3>
            </div>
            <DeadlineSelector
              onSelect={handleDeadlineSelect}
              onCancel={() => setViewState("confirm")}
              isLoading={isFocusing}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
