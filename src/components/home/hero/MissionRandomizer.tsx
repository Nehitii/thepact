"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useAnimation, cubicBezier } from "framer-motion";
import { Dices, Target, Focus, RotateCcw, Zap, Lock, ChevronRight } from "lucide-react";
import { Goal } from "@/hooks/useGoals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useActiveMission, DeadlineType } from "@/hooks/useActiveMission";
import { DeadlineSelector } from "./DeadlineSelector";
import { ActiveMissionCard } from "./ActiveMissionCard";

// --- CONFIGURATION CINÉMATIQUE ---
const ITEM_HEIGHT = 80; // Hauteur d'une ligne plus grande pour l'impact
const SPIN_DURATION = 3; // Durée exacte du spin en secondes
const REEL_ITEMS = 40; // Nombre d'éléments dans la bande défilante

// --- TYPES ---
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

// --- COMPOSANT: BANDE DÉFILANTE (SLOT REEL) ---
// C'est lui qui gère l'animation physique pour éviter les bugs de rendu
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

  // On construit une bande statique : [Random, Random, ..., Random, WINNER]
  // On utilise useMemo pour que cette liste ne change JAMAIS pendant le render
  const reelStrip = useMemo(() => {
    const strip = [];
    // Remplissage avec des items aléatoires
    for (let i = 0; i < REEL_ITEMS - 1; i++) {
      strip.push(candidates[Math.floor(Math.random() * candidates.length)]);
    }
    // Le DERNIER est FORCÉMENT le gagnant
    strip.push(winner);
    return strip;
  }, [candidates, winner]);

  useEffect(() => {
    const animate = async () => {
      // 1. Reset position (au cas où)
      await controls.set({ y: 0, filter: "blur(0px)" });

      // 2. Démarrage violent (Motion Blur actif)
      const targetY = -((REEL_ITEMS - 1) * ITEM_HEIGHT);

      await controls.start({
        y: targetY,
        filter: ["blur(0px)", "blur(8px)", "blur(0px)"], // Flou cinétique pendant le mouvement
        transition: {
          duration: SPIN_DURATION,
          // Courbe de bézier : Accélération lente -> Très vite -> Freinage élastique
          ease: [0.25, 1, 0.5, 1],
        },
      });

      // 3. Petit délai pour l'impact visuel avant de notifier le parent
      setTimeout(() => {
        onSpinComplete();
      }, 500);
    };

    animate();
  }, [controls, onSpinComplete]); // Dépendances minimales

  return (
    <div className="relative h-[80px] w-full overflow-hidden border-y border-primary/30 bg-black/40">
      {/* Ligne de visée (Target Line) */}
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-between px-2">
        <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#06b6d4]" />
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#06b6d4]" />
      </div>

      {/* Ombre interne pour l'effet de profondeur (Cylindre) */}
      <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-black to-transparent z-10" />
      <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black to-transparent z-10" />

      {/* La Bande qui bouge */}
      <motion.div animate={controls} className="flex flex-col">
        {reelStrip.map((goal, index) => (
          <div key={index} className="h-[80px] flex items-center justify-center px-4">
            <span
              className={cn(
                "text-xl font-bold uppercase tracking-wider text-transparent bg-clip-text",
                index === reelStrip.length - 1
                  ? "bg-gradient-to-r from-amber-200 to-amber-500 shadow-amber-500 drop-shadow-md" // Style du gagnant
                  : "bg-white/40", // Style des perdants
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

// --- COMPOSANT PRINCIPAL ---

export function MissionRandomizer({ allGoals, className }: MissionRandomizerProps) {
  const navigate = useNavigate();
  const { activeMission, hasMission, isLoading, focusMission, abandonMission, completeMissionStep } =
    useActiveMission();

  const [viewState, setViewState] = useState<ViewState>("idle");
  const [targetMission, setTargetMission] = useState<PendingMission | null>(null); // Donnée finale
  const [tempWinner, setTempWinner] = useState<Goal | null>(null); // Goal gagnant (pour l'anim)
  const [isFocusing, setIsFocusing] = useState(false);

  // Filtrer les goals éligibles
  const eligibleGoals = useMemo(
    () =>
      allGoals.filter((g) => {
        const remaining = (g.total_steps || 0) - (g.validated_steps || 0);
        return remaining > 0 && g.status !== "fully_completed" && g.status !== "validated";
      }),
    [allGoals],
  );

  const hasEligibleGoals = eligibleGoals.length > 0;

  // --- LOGIQUE ---

  const handleSpinStart = async () => {
    if (!hasEligibleGoals) return;

    // 1. Déterminer le gagnant TOUT DE SUITE
    const winner = eligibleGoals[Math.floor(Math.random() * eligibleGoals.length)];
    setTempWinner(winner);
    setViewState("spinning");

    // 2. Lancer la récupération de la Step en arrière-plan (sans bloquer)
    try {
      const { data: steps } = await supabase
        .from("steps")
        .select("id, title")
        .eq("goal_id", winner.id)
        .eq("status", "pending")
        .order("order", { ascending: true })
        .limit(1);

      const stepData =
        steps && steps.length > 0
          ? { goal: winner, stepTitle: steps[0].title, stepId: steps[0].id }
          : { goal: winner, stepTitle: "Continue working on this goal", stepId: null };

      setTargetMission(stepData);
    } catch (e) {
      setTargetMission({ goal: winner, stepTitle: "Mission Data Corrupted", stepId: null });
    }
  };

  const handleSpinEnd = () => {
    // Appelé par SlotReel quand l'anim est finie
    setViewState("confirm");
  };

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

  // --- RENDER ---

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
    <div className={cn("relative w-full max-w-md mx-auto perspective-1000", className)}>
      <AnimatePresence mode="wait">
        {/* --- ETAT 1: IDLE (ATTENTE) --- */}
        {viewState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-6 text-center group"
          >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-purple-500/5 opacity-50" />

            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] group-hover:scale-110 transition-transform duration-500">
                <Dices className="w-8 h-8 text-white/80" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white tracking-widest uppercase font-mono">Mission Roulette</h3>
                <p className="text-xs text-muted-foreground">Select next objective via RNG protocol</p>
              </div>

              <Button
                size="lg"
                onClick={handleSpinStart}
                disabled={!hasEligibleGoals}
                className="w-full bg-primary hover:bg-primary/90 text-black font-bold tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all"
              >
                {hasEligibleGoals ? "INITIATE SPIN" : "NO GOALS"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* --- ETAT 2: SPINNING (ACTION) --- */}
        {viewState === "spinning" && tempWinner && (
          <motion.div
            key="spinning"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-xl border-x-2 border-primary/50 bg-black/80 backdrop-blur-xl p-8 flex flex-col items-center justify-center gap-4 shadow-[0_0_50px_rgba(6,182,212,0.2)]"
          >
            <div className="text-xs font-mono text-primary animate-pulse tracking-[0.3em]">
              CALCULATING TRAJECTORY...
            </div>

            {/* LE SLOT REEL EST ICI - ISOLÉ */}
            <SlotReel candidates={eligibleGoals} winner={tempWinner} onSpinComplete={handleSpinEnd} />

            <div className="flex gap-2 mt-2">
              {/* Loading dots cinématiques */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 bg-primary"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* --- ETAT 3: CONFIRM (RESULTAT) --- */}
        {viewState === "confirm" && targetMission && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative overflow-hidden rounded-xl border border-amber-500/50 bg-gradient-to-b from-gray-900 to-black p-0 shadow-[0_0_60px_rgba(245,158,11,0.2)]"
          >
            {/* Header Success */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 p-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest">Target Locked</span>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono">Objective</span>
                <h2 className="text-2xl font-bold text-white leading-tight">{targetMission.goal.name}</h2>
              </div>

              <div className="p-4 bg-white/5 rounded-lg border-l-2 border-amber-500">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider font-mono block mb-1">
                  Next Step
                </span>
                <p className="text-sm text-gray-200">{targetMission.stepTitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button onClick={handleConfirm} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                  <Focus className="w-4 h-4 mr-2" /> ENGAGE
                </Button>
                <Button onClick={handleReroll} variant="outline" className="border-white/10 hover:bg-white/5">
                  <RotateCcw className="w-4 h-4 mr-2" /> REROLL
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- ETAT 4: DEADLINE (FINAL) --- */}
        {viewState === "deadline" && targetMission && (
          <motion.div
            key="deadline"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl p-4"
          >
            <div className="mb-4 pb-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Set Deadline
              </h3>
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
