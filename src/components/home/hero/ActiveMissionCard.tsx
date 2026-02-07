"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Clock, AlertTriangle, Check, Flag, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ActiveMission } from '@/hooks/useActiveMission';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ActiveMissionCardProps {
  mission: ActiveMission;
  onAbandon: () => Promise<boolean>;
  onComplete: () => Promise<boolean>;
  className?: string;
}

/**
 * Displays the active mission with countdown timer
 * Only way to clear is via "Abandon" with confirmation
 */
export function ActiveMissionCard({ mission, onAbandon, onComplete, className }: ActiveMissionCardProps) {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Calculate and update countdown
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const expires = new Date(mission.expires_at).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('EXPIRED');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [mission.expires_at]);

  // Urgency level based on time remaining
  const urgencyLevel = useMemo(() => {
    const now = new Date().getTime();
    const expires = new Date(mission.expires_at).getTime();
    const diff = expires - now;
    const totalDuration = expires - new Date(mission.created_at).getTime();
    const percentRemaining = (diff / totalDuration) * 100;

    if (percentRemaining <= 10) return 'critical';
    if (percentRemaining <= 25) return 'warning';
    return 'normal';
  }, [mission.expires_at, mission.created_at]);

  const handleAbandon = async () => {
    setIsAbandoning(true);
    await onAbandon();
    setIsAbandoning(false);
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    await onComplete();
    setIsCompleting(false);
  };

  const goToGoal = () => {
    navigate(`/goals/${mission.goal_id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-xl",
        urgencyLevel === 'critical' && "border-destructive/50 bg-destructive/10",
        urgencyLevel === 'warning' && "border-amber-500/40 bg-amber-500/10",
        urgencyLevel === 'normal' && "border-primary/40 bg-black/60",
        className
      )}
    >
      {/* Pulsing border for critical */}
      {urgencyLevel === 'critical' && (
        <motion.div
          className="absolute inset-0 border-2 border-destructive/60 rounded-2xl"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {/* Header */}
      <div className={cn(
        "relative z-10 px-4 py-3 border-b",
        urgencyLevel === 'critical' && "border-destructive/30 bg-destructive/10",
        urgencyLevel === 'warning' && "border-amber-500/20 bg-amber-500/5",
        urgencyLevel === 'normal' && "border-primary/20 bg-primary/5"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className={cn(
              "w-4 h-4",
              urgencyLevel === 'critical' && "text-destructive animate-pulse",
              urgencyLevel === 'warning' && "text-amber-400",
              urgencyLevel === 'normal' && "text-primary"
            )} />
            <span className="text-[10px] font-orbitron uppercase tracking-widest text-white/70">
              Active Mission
            </span>
          </div>
          
          {/* Countdown Timer */}
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono font-bold",
            isExpired && "bg-destructive/20 text-destructive",
            urgencyLevel === 'critical' && !isExpired && "bg-destructive/20 text-destructive animate-pulse",
            urgencyLevel === 'warning' && !isExpired && "bg-amber-500/20 text-amber-400",
            urgencyLevel === 'normal' && !isExpired && "bg-primary/20 text-primary"
          )}>
            <Clock className="w-3 h-3" />
            {timeRemaining}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 space-y-4">
        {/* Goal info */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg flex-shrink-0",
            urgencyLevel === 'critical' && "bg-destructive/20 border border-destructive/30",
            urgencyLevel === 'warning' && "bg-amber-500/20 border border-amber-500/30",
            urgencyLevel === 'normal' && "bg-primary/20 border border-primary/30"
          )}>
            <Target className={cn(
              "w-5 h-5",
              urgencyLevel === 'critical' && "text-destructive",
              urgencyLevel === 'warning' && "text-amber-400",
              urgencyLevel === 'normal' && "text-primary"
            )} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider">
              Goal
            </p>
            <h4 className="text-sm font-orbitron font-bold text-white truncate">
              {mission.goal_name}
            </h4>
          </div>
        </div>

        {/* Current step */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-[10px] text-white/50 font-rajdhani uppercase tracking-wider mb-1">
            Focused Step
          </p>
          <p className="text-sm font-rajdhani text-white leading-snug">
            {mission.step_title}
          </p>
        </div>

        {/* Expired warning */}
        {isExpired && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/20 border border-destructive/30">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-xs text-destructive font-rajdhani">
              Deadline passed! Complete or abandon to continue.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleComplete}
            disabled={isCompleting || isAbandoning}
            className={cn(
              "font-rajdhani text-xs",
              "bg-gradient-to-r from-health/80 to-health hover:from-health hover:to-health/80",
              "border border-health/30"
            )}
          >
            <Check className="w-4 h-4 mr-1" />
            {isCompleting ? 'Saving...' : 'Complete'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isCompleting || isAbandoning}
                className="font-rajdhani text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Abandon
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-destructive/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-orbitron text-destructive">
                  Abandon Mission?
                </AlertDialogTitle>
                <AlertDialogDescription className="font-rajdhani">
                  Are you sure you want to abandon this mission? This action cannot be undone.
                  You will be able to pick a new mission after abandoning.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-rajdhani">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleAbandon}
                  className="bg-destructive hover:bg-destructive/80 font-rajdhani"
                >
                  {isAbandoning ? 'Abandoning...' : 'Yes, Abandon'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
