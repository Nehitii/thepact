"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useAnimation, Variants } from "framer-motion";
import { Dices, ChevronRight, Sparkles, Target, Focus, RotateCcw, Zap } from "lucide-react";
import { Goal } from "@/hooks/useGoals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useActiveMission, DeadlineType } from "@/hooks/useActiveMission";
import { DeadlineSelector } from "./DeadlineSelector";
import { ActiveMissionCard } from "./ActiveMissionCard";

// --- Types & Interfaces ---

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

// --- Utility Constants & Variants ---

const SLOT_HEIGHT = 60; // Hauteur d'une ligne dans la machine à sous
const REEL_LENGTH = 30; // Nombre d'éléments factices dans le rouleau pour l'illusion

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

// --- Sub-Components ---

/**
 * Composant d'effet "Scanline" pour le look Cyberpunk
 */
const CRTOverlay = () => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-2xl">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-10 bg-[length:100%_2px,3px_100%]" />
    <motion.div
      className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-transparent via-white/5 to-transparent"
      animate={{ top: ["-10%", "110%"] }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

export function MissionRandomizer({ allGoals, className }: MissionRandomizerProps) {
  const navigate = useNavigate();
  const controls = useAnimation();
  const { activeMission, hasMission, isLoading, focusMission, abandonMission, completeMissionStep } =
    useActiveMission();

  const [viewState, setViewState] = useState<ViewState>("idle");
  const [pendingMission, setPendingMission] = useState<PendingMission | null>(null);
  const [isFocusing, setIsFocusing] = useState(false);

  // On construit le "Reel" (le rouleau) une seule fois ou quand les buts changent
  const eligibleGoals = useMemo(() => {
    return allGoals.filter((g) => {
      const remaining = (g.total_steps || 0) - (g.validated_steps || 0);
      return remaining > 0 && g.status !== "fully_completed" && g.status !== "validated";
    });
  }, [allGoals]);

  const hasEligibleGoals = eligibleGoals.length > 0;

  // --- Core Logic ---

  const fetchStepForGoal = async (goal: Goal): Promise<PendingMission> => {
    try {
      const { data: steps, error } = await supabase
        .from("steps")
        .select("id, title, status")
        .eq("goal_id", goal.id)
        .eq("status", "pending")
        .order("order", { ascending: true })
        .limit(1);

      if (error) throw error;

      if (steps && steps.length > 0) {
        return { goal, stepTitle: steps[0].title, stepId: steps[0].id };
      } else {
        // Fallback si pas de step trouvée
        return { goal, stepTitle: "Continue working on this goal", stepId: null };
      }
    } catch (err) {
      console.error("Error fetching step:", err);
      return { goal, stepTitle: "Check your goal details", stepId: null };
    }
  };

  const handleSpin = async () => {
    if (!hasEligibleGoals || viewState === "spinning") return;

    setViewState("spinning");
    setPendingMission(null);

    // 1. Choisir le gagnant MAINTENANT (avant l'animation)
    const winnerIndex = Math.floor(Math.random() * eligibleGoals.length);
    const winnerGoal = eligibleGoals[winnerIndex];

    // 2. Lancer l'animation ET le fetch en parallèle
    // On veut que l'animation dure au moins 2.5s pour l'effet dramatique
    const animationPromise = controls.start({
      y: -((REEL_LENGTH - 1) * SLOT_HEIGHT), // On descend très bas
      transition: {
        duration: 2.5,
        ease: [0.15, 0.85, 0.35, 1], // Courbe de Bézier personnalisée (rapide puis freinage doux)
      },
    });

    const dataPromise = fetchStepForGoal(winnerGoal);

    // 3. Attendre que TOUT soit fini
    const [_, missionData] = await Promise.all([animationPromise, dataPromise]);

    // 4. Petite pause dramatique "freeze" sur le gagnant
    await new Promise((r) => setTimeout(r, 400));

    setPendingMission(missionData);
    setViewState("confirm");

    // Reset position discrètement pour le prochain tour
    controls.set({ y: 0 });
  };

  // --- Handlers ---

  const handleFocusChoice = () => setViewState("deadline");

  const handleReroll = () => {
    setViewState("idle");
    // Petit délai pour laisser l'UI reset avant de relancer si l'user spamme
    setTimeout(() => handleSpin(), 100);
  };

  const handleDeadlineSelect = async (deadline: DeadlineType) => {
    if (!pendingMission) return;
    setIsFocusing(true);
    const success = await focusMission(
      pendingMission.goal.id,
      pendingMission.goal.name,
      pendingMission.stepId,
      pendingMission.stepTitle,
      deadline,
    );
    if (success) {
      setPendingMission(null);
      setViewState("idle");
    }
    setIsFocusing(false);
  };

  // Génération du "Rouleau" virtuel pour l'animation
  // On répète les buts pour créer une longue liste, et on s'assure que le dernier est le gagnant (géré dynamiquement via logique visuelle ci-dessous)
  // Astuce : Pour simplifier ici, on va animer une liste purement visuelle.
  // La liste affichée sera : [Random, Random, ..., Random, WINNER]
  const renderSlotReel = () => {
    // On crée une liste déterministe pour l'animation basée sur le timestamp ou juste random
    // Le dernier élément DOIT être celui qui a été choisi au début du spin (mais ici on triche visuellement :
    // On ne sait pas qui gagne au début du render.
    // L'astuce : On anime une très longue liste aléatoire.
    // MAIS pour faire simple et robuste : on anime une liste infinie "floue" et on fade-in le vrai résultat à la fin ?
    // Non, faisons le "Vrai" slot :

    // Si on est en spinning, on veut voir une liste qui défile.
    // On va générer une liste statique longue d'éléments aléatoires tirés de eligibleGoals.
    const reelItems = Array.from({ length: REEL_LENGTH }).map((_, i) => {
      // Le dernier item est visuellement important, mais comme on transitionne vers un écran "Confirm",
      // l'animation s'arrête sur un item "flou" puis on change d'écran.
      // Pour faire plus propre : l'écran 'Spinning' affiche le résultat final à la fin.
      return eligibleGoals[i % eligibleGoals.length];
    });

    return (
      <div className="relative h-[60px] overflow-hidden w-full max-w-sm bg-black/40 border border-primary/30 rounded-lg shadow-inner">
        {/* Overlay d'ombre pour donner du volume */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/80 to-transparent z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/80 to-transparent z-10" />

        {/* Ligne de visée centrale */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-primary/50 z-20 shadow-[0_0_10px_rgba(0,255,255,0.8)]" />

        <motion.div animate={controls} initial={{ y: 0 }} className="flex flex-col items-center">
          {reelItems.map((goal, i) => (
            <div key={`${goal.id}-${i}`} className="h-[60px] w-full flex items-center justify-center px-4">
              <span
                className={cn(
                  "text-lg font-orbitron font-bold truncate text-white/90",
                  // On ajoute un effet de flou dynamique via CSS si besoin, ou juste via la vitesse
                )}
              >
                {goal.name}
              </span>
            </div>
          ))}
          {/* Le slot final (l'atterrissage) sera géré par le changement d'état vers 'Confirm' */}
        </motion.div>
      </div>
    );
  };

  // --- Render : Loading & Active ---

  if (isLoading)
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
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

  // --- Render : States ---

  return (
    <div className={cn("relative perspective-1000", className)}>
      <AnimatePresence mode="wait">
        {/* IDLE STATE */}
        {viewState === "idle" && (
          <motion.div
            key="idle"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative overflow-hidden rounded-2xl border bg-black/40 backdrop-blur-xl p-6 border-white/10 group hover:border-primary/40 transition-colors duration-500"
          >
            <CRTOverlay />
            <div className="relative z-10 flex flex-col items-center text-center space-y-5">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 shadow-2xl">
                  <Dices className="w-10 h-10 text-primary" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-orbitron font-bold text-white mb-1 tracking-wider">MISSION RANDOMIZER</h3>
                <p className="text-sm text-muted-foreground font-rajdhani">Fate awaits. Spin the wheel.</p>
              </div>

              <Button
                onClick={handleSpin}
                disabled={!hasEligibleGoals}
                size="lg"
                className={cn(
                  "w-full max-w-xs font-orbitron font-bold tracking-widest relative overflow-hidden transition-all duration-300",
                  "bg-transparent border border-primary/50 hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]",
                  "text-primary hover:text-white group",
                )}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {hasEligibleGoals ? (
                    <>
                      <Zap className="w-4 h-4" /> INITIALIZE SPIN
                    </>
                  ) : (
                    "NO TARGETS DETECTED"
                  )}
                </span>
                <div className="absolute inset-0 bg-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* SPINNING STATE */}
        {viewState === "spinning" && (
          <motion.div
            key="spinning"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative overflow-hidden rounded-2xl border bg-black/80 backdrop-blur-xl p-8 border-primary/50 shadow-[0_0_40px_rgba(6,182,212,0.15)]"
          >
            <CRTOverlay />
            <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
              <div className="flex items-center gap-3 text-primary/80 animate-pulse">
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span className="text-xs font-orbitron tracking-[0.2em]">ACCESSING MAINFRAME...</span>
              </div>

              {renderSlotReel()}

              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-16 h-1 rounded-full bg-primary/30"
                    animate={{ backgroundColor: ["rgba(6,182,212,0.3)", "rgba(6,182,212,1)", "rgba(6,182,212,0.3)"] }}
                    transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* CONFIRM STATE (WINNER) */}
        {viewState === "confirm" && pendingMission && (
          <motion.div
            key="confirm"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-gray-900 to-black p-0 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.2)]"
          >
            {/* Header Success */}
            <div className="relative px-6 py-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-xs font-orbitron font-bold text-amber-400 tracking-widest uppercase">
                  Target Locked
                </span>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
            </div>

            <div className="p-6 space-y-6 relative">
              <div className="space-y-2">
                <p className="text-xs font-rajdhani text-muted-foreground uppercase tracking-wider">
                  Primary Objective
                </p>
                <h2 className="text-2xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                  {pendingMission.goal.name}
                </h2>
              </div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-r-xl border-l-2 border-amber-500 bg-amber-500/5"
              >
                <p className="text-[10px] text-amber-500/80 font-orbitron mb-1">NEXT ACTIONABLE STEP</p>
                <p className="text-sm font-medium text-amber-100">{pendingMission.stepTitle}</p>
              </motion.div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={handleFocusChoice}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-orbitron font-bold tracking-wide"
                >
                  <Focus className="w-4 h-4 mr-2" /> ENGAGE
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReroll}
                  className="border-white/10 hover:bg-white/5 hover:text-white font-rajdhani"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Reroll
                </Button>
              </div>

              <button
                onClick={() => pendingMission && navigate(`/goals/${pendingMission.goal.id}`)}
                className="w-full text-center text-[10px] text-white/30 hover:text-amber-400 transition-colors uppercase tracking-widest mt-2"
              >
                Inspect Mission Data
              </button>
            </div>
          </motion.div>
        )}

        {/* DEADLINE SELECTOR STATE */}
        {viewState === "deadline" && pendingMission && (
          <motion.div
            key="deadline"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative overflow-hidden rounded-2xl border bg-black/60 backdrop-blur-xl border-primary/40 shadow-2xl"
          >
            <div className="px-6 py-4 border-b border-white/10 bg-primary/5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-orbitron text-primary tracking-widest">TIMEFRAME SELECTION</span>
            </div>

            <div className="p-6">
              <div className="mb-6 opacity-60">
                <p className="text-xs font-rajdhani text-primary mb-1">CONFIRMING MISSION:</p>
                <p className="text-sm text-white truncate">{pendingMission.stepTitle}</p>
              </div>

              <DeadlineSelector
                onSelect={handleDeadlineSelect}
                onCancel={() => setViewState("confirm")}
                isLoading={isFocusing}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
