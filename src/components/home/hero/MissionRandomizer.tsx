"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, ChevronRight, Sparkles, Target, Focus, RotateCcw } from 'lucide-react';
import { Goal } from '@/hooks/useGoals';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useActiveMission, DeadlineType } from '@/hooks/useActiveMission';
import { DeadlineSelector } from './DeadlineSelector';
import { ActiveMissionCard } from './ActiveMissionCard';

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

/**
 * Mission Randomizer with Slot Machine Animation
 * Now with persistent mission focus and deadline selection
 */
export function MissionRandomizer({ allGoals, className }: MissionRandomizerProps) {
  const navigate = useNavigate();
  const { activeMission, hasMission, isLoading, focusMission, abandonMission, completeMissionStep } = useActiveMission();
  
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [currentDisplayGoal, setCurrentDisplayGoal] = useState<string | null>(null);
  const [pendingMission, setPendingMission] = useState<PendingMission | null>(null);
  const [isFocusing, setIsFocusing] = useState(false);
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get goals with incomplete steps
  const eligibleGoals = allGoals.filter(g => {
    const remaining = (g.total_steps || 0) - (g.validated_steps || 0);
    return remaining > 0 && g.status !== 'fully_completed' && g.status !== 'validated';
  });

  const hasEligibleGoals = eligibleGoals.length > 0;

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
    };
  }, []);

  const spinSlotMachine = useCallback(async () => {
    if (!hasEligibleGoals || viewState === 'spinning') return;

    setViewState('spinning');
    setPendingMission(null);

    // Slot machine spinning effect (1.2s total)
    let spinCount = 0;
    const maxSpins = 15;
    const spinDuration = 1200;
    const intervalTime = spinDuration / maxSpins;

    spinIntervalRef.current = setInterval(() => {
      spinCount++;
      const randomGoal = eligibleGoals[Math.floor(Math.random() * eligibleGoals.length)];
      setCurrentDisplayGoal(randomGoal.name);

      if (spinCount >= maxSpins) {
        if (spinIntervalRef.current) {
          clearInterval(spinIntervalRef.current);
        }
        
        // Final selection
        const finalGoal = eligibleGoals[Math.floor(Math.random() * eligibleGoals.length)];
        setCurrentDisplayGoal(finalGoal.name);

        // Fetch actual incomplete step for this goal
        fetchFirstIncompleteStep(finalGoal);
      }
    }, intervalTime);
  }, [eligibleGoals, hasEligibleGoals, viewState]);

  const fetchFirstIncompleteStep = async (goal: Goal) => {
    try {
      const { data: steps, error } = await supabase
        .from('steps')
        .select('id, title, status')
        .eq('goal_id', goal.id)
        .eq('status', 'pending')
        .order('order', { ascending: true })
        .limit(1);

      if (error) throw error;

      if (steps && steps.length > 0) {
        setPendingMission({
          goal,
          stepTitle: steps[0].title,
          stepId: steps[0].id,
        });
      } else {
        // No pending steps found, try again with different goal
        const otherGoals = eligibleGoals.filter(g => g.id !== goal.id);
        if (otherGoals.length > 0) {
          const newGoal = otherGoals[Math.floor(Math.random() * otherGoals.length)];
          fetchFirstIncompleteStep(newGoal);
          return;
        }
        // Fallback: show goal without specific step
        setPendingMission({
          goal,
          stepTitle: 'Continue working on this goal',
          stepId: null,
        });
      }
      setViewState('confirm');
    } catch (err) {
      console.error('Error fetching step:', err);
      setPendingMission({
        goal,
        stepTitle: 'Continue working on this goal',
        stepId: null,
      });
      setViewState('confirm');
    }
  };

  const handleFocusChoice = () => {
    setViewState('deadline');
  };

  const handleDeadlineSelect = async (deadline: DeadlineType) => {
    if (!pendingMission) return;
    
    setIsFocusing(true);
    const success = await focusMission(
      pendingMission.goal.id,
      pendingMission.goal.name,
      pendingMission.stepId,
      pendingMission.stepTitle,
      deadline
    );
    
    if (success) {
      setPendingMission(null);
      setViewState('idle');
    }
    setIsFocusing(false);
  };

  const handleReroll = () => {
    setPendingMission(null);
    setViewState('idle');
    spinSlotMachine();
  };

  const handleCancelDeadline = () => {
    setViewState('confirm');
  };

  const goToGoal = () => {
    if (pendingMission) {
      navigate(`/goals/${pendingMission.goal.id}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-black/40 backdrop-blur-xl p-5",
          "border-white/10",
          className
        )}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </div>
      </motion.div>
    );
  }

  // Show Active Mission Card if user has a focused mission
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

  // Idle state - show the randomizer button
  if (viewState === 'idle') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-black/40 backdrop-blur-xl p-5",
          "border-white/10 hover:border-primary/30 transition-all duration-300",
          className
        )}
      >
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Dices className="w-8 h-8 text-primary animate-glow-pulse" />
          </div>
          
          <div>
            <h3 className="text-sm font-orbitron font-bold text-white mb-1">
              Mission Randomizer
            </h3>
            <p className="text-xs text-muted-foreground font-rajdhani">
              Don't know what to do? Let fate decide.
            </p>
          </div>

          <Button
            onClick={spinSlotMachine}
            disabled={!hasEligibleGoals}
            className={cn(
              "w-full font-orbitron text-xs tracking-wider",
              "bg-gradient-to-r from-primary/80 to-accent/80 hover:from-primary hover:to-accent",
              "border border-primary/30 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
            )}
          >
            <Dices className="w-4 h-4 mr-2" />
            {hasEligibleGoals ? "🎲 Pick My Mission" : "No Tasks Available"}
          </Button>
        </div>
      </motion.div>
    );
  }

  // Spinning state - slot machine animation
  if (viewState === 'spinning') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-black/60 backdrop-blur-xl p-5",
          "border-primary/40 shadow-[0_0_30px_rgba(0,212,255,0.4)]",
          className
        )}
      >
        {/* Animated scan line */}
        <motion.div 
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
          animate={{ y: [0, 100, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative z-10 flex flex-col items-center text-center py-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary animate-spin" />
            <span className="text-[10px] font-orbitron uppercase tracking-widest text-primary">
              Analyzing Goals...
            </span>
            <Sparkles className="w-4 h-4 text-primary animate-spin" />
          </div>

          {/* Slot machine display */}
          <div className="relative h-12 overflow-hidden rounded-lg bg-black/50 border border-primary/30 px-4 w-full max-w-xs">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentDisplayGoal}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ duration: 0.08 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="text-sm font-orbitron font-bold text-white truncate px-2">
                  {currentDisplayGoal || 'Loading...'}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-4 flex gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.4, delay: i * 0.15, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // Confirm state - ask user to focus or reroll
  if (viewState === 'confirm' && pendingMission) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-black/60 backdrop-blur-xl",
          "border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.3)]",
          className
        )}
      >
        {/* Success glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-primary/10" />
        
        {/* Header */}
        <div className="relative z-10 px-4 py-3 border-b border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-orbitron uppercase tracking-widest text-amber-400">
              Mission Found
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-4 space-y-4">
          {/* Goal name */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 flex-shrink-0">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider">
                Goal
              </p>
              <h4 className="text-sm font-orbitron font-bold text-white truncate">
                {pendingMission.goal.name}
              </h4>
            </div>
          </div>

          {/* Step to complete */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-[10px] text-primary/60 font-rajdhani uppercase tracking-wider mb-1">
              Next Step
            </p>
            <p className="text-sm font-rajdhani text-white leading-snug">
              {pendingMission.stepTitle}
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleFocusChoice}
              className={cn(
                "font-rajdhani text-xs",
                "bg-gradient-to-r from-primary/80 to-accent/80 hover:from-primary hover:to-accent",
                "border border-primary/30"
              )}
            >
              <Focus className="w-4 h-4 mr-1" />
              Focus on this
            </Button>
            
            <Button
              onClick={handleReroll}
              variant="outline"
              className="font-rajdhani text-xs border-amber-500/30 hover:bg-amber-500/10"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Roll again
            </Button>
          </div>

          {/* Go to goal link */}
          <button
            onClick={goToGoal}
            className="w-full flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors font-rajdhani uppercase tracking-wider py-1"
          >
            View full goal <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Deadline selection state
  if (viewState === 'deadline' && pendingMission) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-black/60 backdrop-blur-xl",
          "border-primary/40 shadow-[0_0_30px_rgba(0,212,255,0.3)]",
          className
        )}
      >
        {/* Header */}
        <div className="relative z-10 px-4 py-3 border-b border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2">
            <Focus className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-orbitron uppercase tracking-widest text-primary">
              Set Deadline
            </span>
          </div>
        </div>

        {/* Mission summary */}
        <div className="relative z-10 px-4 pt-3">
          <p className="text-xs text-white/70 font-rajdhani truncate">
            <span className="text-primary">Goal:</span> {pendingMission.goal.name}
          </p>
        </div>

        {/* Deadline selector */}
        <div className="relative z-10 p-4">
          <DeadlineSelector
            onSelect={handleDeadlineSelect}
            onCancel={handleCancelDeadline}
            isLoading={isFocusing}
          />
        </div>
      </motion.div>
    );
  }

  return null;
}
