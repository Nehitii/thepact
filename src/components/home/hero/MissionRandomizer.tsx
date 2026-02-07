"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Dices, Target, Focus, RotateCcw, Zap, Lock } from 'lucide-react';
import { Goal } from '@/hooks/useGoals';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useActiveMission, DeadlineType } from '@/hooks/useActiveMission';
import { DeadlineSelector } from './DeadlineSelector';
import { ActiveMissionCard } from './ActiveMissionCard';

// --- CONFIGURATION ---
const ITEM_HEIGHT = 80; // Hauteur d'une ligne (en px)
const SPIN_DURATION = 2.5; // Durée de l'animation en secondes
const REEL_ITEMS = 40; // Nombre d'éléments dans la bande défilante pour l'effet de vitesse

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

type ViewState = 'idle' | 'spinning' | 'confirm' | 'deadline';

// --- COMPOSANT ISOLÉ : SLOT REEL (BANDE DÉFILANTE) ---
// Gère sa propre physique pour éviter les re-renders du parent pendant le spin
const SlotReel = ({ 
  candidates, 
  winner, 
  onSpinComplete 
}: { 
  candidates: Goal[], 
  winner: Goal, 
  onSpinComplete: () => void 
}) => {
  const controls = useAnimation();
  
  // Création de la bande : [Random, Random, ..., Random, WINNER]
  const reelStrip = useMemo(() => {
    const strip = [];
    for (let i = 0; i < REEL_ITEMS - 1; i++) {
      strip.push(candidates[Math.floor(Math.random() * candidates.length)]);
    }
    strip.push(winner); // Le dernier est forcé
    return strip;
  }, [candidates, winner]);

  useEffect(() => {
    const animate = async () => {
      // 1. Reset
      await controls.set({ y: 0, filter: "blur(0px)" });

      // 2. Calcul de la position finale (on remonte la bande)
      const targetY = -((REEL_ITEMS - 1) * ITEM_HEIGHT);
      
      // 3. Lancement de l'animation physique
      await controls.start({
        y: targetY,
        // Flou cinétique dynamique : net -> flou -> net
        filter: ["blur(0px)", "blur(8px)", "blur(0px)"], 
        transition: { 
          duration: SPIN_DURATION, 
          // Courbe : Accélération progressive -> Vitesse max -> Freinage mécanique avec léger rebond
          ease: [0.25, 1, 0.5, 1] 
        }
      });

      // 4. Petit délai pour l'impact visuel avant de passer à l'écran suivant
      setTimeout(() => {
        onSpinComplete();
      }, 400);
    };

    animate();
  }, [controls, onSpinComplete]);

  return (
    <div className="relative h-[80px] w-full overflow-hidden border-y border-primary/30 bg-black/40 shadow-inner">
      {/* Ligne de visée (Target Line) */}
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-between px-2">
        <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#06b6d4]" />
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent shadow-[0_0_5px_#06b6d4]" />
        <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#06b6d4]" />
      </div>

      {/* Ombres pour effet de cylindre 3D */}
      <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />

      {/* La Bande animée */}
      <motion.div animate={controls} className="flex flex-col w-full">
        {reelStrip.map((goal, index) => (
          <div 
            key={index} 
            className="h-[80px] flex items-center justify-center px-4 w-full"
          >
            <span className={cn(
              "text-lg md:text-xl font-bold uppercase tracking-wider text-center truncate w-full",
              index === reelStrip.length - 1 
                ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-sm" // Style Gagnant
                : "text-white/30" // Style Perdants (défilement)
            )}>
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
  const { activeMission, hasMission, isLoading, focusMission, abandonMission, completeMissionStep } = useActiveMission();
  
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [targetMission, setTargetMission] = useState<PendingMission | null>(null); // Données complètes (Goal + Step)
  const [tempWinner, setTempWinner] = useState<Goal | null>(null); // Juste le Goal (pour l'anim)
  const [isFocusing, setIsFocusing] = useState(false);

  // Filtrer les goals éligibles
  const eligibleGoals = useMemo(() => allGoals.filter(g => {
    const remaining = (g.total_steps || 0) - (g.validated_steps || 0);
    return remaining > 0 && g.status !== 'fully_completed' && g.status !== 'validated';
  }), [allGoals]);

  const hasEligibleGoals = eligibleGoals.length > 0;

  // --- LOGIQUE ---

  const handleSpinStart = async () => {
    if (!hasEligibleGoals) return;

    // 1. Choix immédiat du but gagnant
    const winner = eligibleGoals[Math.floor(Math.random() * eligibleGoals.length)];
    setTempWinner(winner);
    setViewState('spinning');

    // 2. Fetch de la Step en arrière-plan (pendant que ça tourne)
    // On ne bloque pas l'UI.
    try {
      const { data: steps } = await supabase
        .from('steps')
        .select('id, title')
        .eq('goal_id', winner.id)
        .eq('status', 'pending')
        .order('order', { ascending: true })
        .limit(1);

      const stepData = steps && steps.length > 0 
        ? { goal: winner, stepTitle: steps[0].title, stepId: steps[0].id }
        : { goal: winner, stepTitle: 'Continue working on this goal', stepId: null };

      setTargetMission(stepData);
    } catch (e) {
      console.error("Error fetching step", e);
      setTargetMission({ goal: winner, stepTitle: 'Goal Selected', stepId: null });
    }
  };

  const handleSpinEnd = () => {
    // Appelé par SlotReel à la fin exacte de l'animation
    setViewState('confirm');
  };

  const handleConfirm = () => setViewState('deadline');
  
  const handleReroll = () => {
    setViewState('idle');
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
      deadline
    );
    if (success) {
      setTargetMission(null);
      setViewState('idle');
    }
    setIsFocusing(false);
  };

  // --- RENDU ---

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"/></div>;

  if (hasMission && activeMission) {
    return <ActiveMissionCard mission={activeMission} onAbandon={abandonMission} onComplete={completeMissionStep} className={className} />;
  }

  return (
    <div className={cn("relative w-full perspective-1000", className)}>
      <AnimatePresence mode="wait">
        
        {/* --- ETAT 1: IDLE (ATTENTE) --- */}
        {viewState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-6 text-center group"
          >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-purple-500/5 opacity-50" />
            
            <div className="relative z-10 flex flex-col items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                  <Dices className="w-8 h-8 text-primary" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white tracking-widest uppercase font-mono">Mission Roulette</h3>
                <p className="text-xs text-muted-foreground font-sans">Select next objective via RNG protocol</p>
              </div>

              <Button 
                size="lg" 
                onClick={handleSpinStart}
                disabled={!hasEligibleGoals}
                className={cn(
                  "w-full font-bold tracking-widest transition-all duration-300 relative overflow-hidden",
                  "bg-transparent border border-primary/50 text-primary hover:text-black hover:bg-primary",
                  "shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                )}
              >
                {hasEligibleGoals ? "INITIATE SPIN" : "NO GOALS"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* --- ETAT 2: SPINNING (ACTION) --- */}
        {viewState === 'spinning' && tempWinner && (
          <motion.div
            key="spinning"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-xl border-x-2 border-primary/50 bg-black/80 backdrop-blur-xl p-8 flex flex-col items-center justify-center gap-4 shadow-[0_0_50px_rgba(6,182,212,0.15)]"
          >
            {/* Scanlines Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center w-full gap-4">
                <div className="text-[10px] font-mono text-primary animate-pulse tracking-[0.3em] uppercase">
                    Running Algorithm...
                </div>
                
                {/* LE SLOT REEL */}
                <SlotReel 
                  candidates={eligibleGoals} 
                  winner={tempWinner} 
                  onSpinComplete={handleSpinEnd} 
                />

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

        {/* --- ETAT 3: CONFIRM (RESULTAT / WAITING INPUT) --- */}
        {viewState === 'confirm' && targetMission && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className={cn(
              "relative overflow-hidden rounded-xl bg-black/90 backdrop-blur-xl",
              // Bordure qui "respire" pour demander l'attention
              "border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
              "group"
            )}
          >
            {/* 1. SCANNERS & BACKGROUND EFFECTS */}
            
            {/* Grille de fond subtile */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            
            {/* Ligne de scan radar verticale qui balaie l'interface */}
            <motion.div 
              className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent z-0 pointer-events-none"
              animate={{ top: ["0%", "100%"], opacity: [0, 1, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Effet de "Spotlight" mouvant */}
            <motion.div 
              className="absolute -inset-full bg-gradient-to-tr from-transparent via-amber-500/5 to-transparent z-0 pointer-events-none"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />

            {/* 2. HUD CORNERS (Coins futuristes) */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-500/40 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-500/40 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-500/40 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-500/40 rounded-br-lg pointer-events-none" />

            {/* 3. CONTENU PRINCIPAL */}
            <div className="relative z-10 p-6 flex flex-col gap-5">
              
              {/* Header: Status "Standby" */}
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest">
                    Target Locked
                  </span>
                </div>
                
                {/* LES DIODES QUI CLIGNOTENT (Waiting Animation) */}
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-mono text-amber-500/70 mr-2 uppercase hidden sm:inline-block">Awaiting Input</span>
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 bg-amber-500 rounded-sm"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        delay: i * 0.2, // Décalage pour créer une vague
                        ease: "easeInOut" 
                      }}
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
              
              {/* Step Detail Box */}
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative group/box"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-transparent blur opacity-50 group-hover/box:opacity-100 transition duration-500" />
                <div className="relative p-4 bg-black/80 rounded-lg border-l-2 border-amber-500">
                  <span className="text-[10px] text-amber-400 uppercase tracking-wider font-mono block mb-1">
                    > Next Actionable Step
                  </span>
                  <p className="text-sm font-medium text-gray-200">
                    {targetMission.stepTitle}
                  </p>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button 
                  onClick={handleConfirm} 
                  className={cn(
                    "bg-amber-500 hover:bg-amber-400 text-black font-bold tracking-wider transition-all duration-300",
                    "shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]",
                    "border border-amber-400"
                  )}
                >
                  <Focus className="w-4 h-4 mr-2" /> ENGAGE
                </Button>
                
                <Button 
                  onClick={handleReroll} 
                  variant="outline" 
                  className="border-white/10 hover:bg-white/5 hover:text-white hover:border-white/30 transition-all"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> DISMISS
                </Button>
              </div>
              
            </div>
          </motion.div>
        )}

        {/* --- ETAT 4: DEADLINE (FINAL) --- */}
        {viewState === 'deadline' && targetMission && (
          <motion.div
            key="deadline"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl p-5 shadow-2xl"
          >
             <div className="mb-4 pb-4 border-b border-white/10 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Set Timeline
                </h3>
             </div>
             <DeadlineSelector 
                onSelect={handleDeadlineSelect} 
                onCancel={() => setViewState('confirm')}
                isLoading={isFocusing}
             />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}