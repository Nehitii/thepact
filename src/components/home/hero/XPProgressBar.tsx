"use client";

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPProgressBarProps {
  currentXP: number;
  currentRankXP: number;
  nextRankXP: number;
  nextRankName: string;
  isMaxRank: boolean;
  frameColor?: string;
  className?: string;
  showLabels?: boolean; // AJOUTÉ
}

/**
 * Animated XP progress bar with fluid fill effect and heartbeat indicator.
 */
export function XPProgressBar({
  currentXP,
  currentRankXP,
  nextRankXP,
  nextRankName,
  isMaxRank,
  frameColor = '#00d4ff',
  className,
  showLabels = true, // Valeur par défaut : true
}: XPProgressBarProps) {
  const progress = useMemo(() => {
    if (isMaxRank) return 100;
    if (nextRankXP - currentRankXP === 0) return 0;
    
    const percent = ((currentXP - currentRankXP) / (nextRankXP - currentRankXP)) * 100;
    return Math.min(Math.max(percent, 0), 100);
  }, [currentXP, currentRankXP, nextRankXP, isMaxRank]);

  const xpRemaining = nextRankXP - currentXP;
  const xpInRank = currentXP - currentRankXP;
  const xpRankSpan = nextRankXP - currentRankXP;

  // Max rank display
  if (isMaxRank) {
    return (
      <div className={cn("w-full max-w-3xl mx-auto", className)}>
        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 flex items-center justify-center gap-2 animate-pulse">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span className="font-orbitron font-bold text-cyan-400 tracking-wider text-sm sm:text-base">
            MAX RANK ACHIEVED
          </span>
          <Sparkles className="w-5 h-5 text-cyan-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 w-full max-w-3xl mx-auto", className)}>
      
      {/* Header with rank target (AFFICHAGE CONDITIONNEL) */}
      {showLabels && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-primary/50 font-orbitron uppercase tracking-widest">
              Progress to
            </span>
            <span 
              className="text-sm font-bold font-orbitron tracking-wide"
              style={{ 
                color: frameColor,
                textShadow: `0 0 12px ${frameColor}80`,
              }}
            >
              {nextRankName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-primary/60">
              {xpInRank.toLocaleString()} / {xpRankSpan.toLocaleString()} XP
            </span>
            <span className="text-xs font-mono text-cyan-400/80 bg-cyan-900/30 px-2 py-0.5 rounded-full border border-cyan-500/30">
              {xpRemaining.toLocaleString()} needed
            </span>
          </div>
        </div>
      )}

      {/* Progress bar container */}
      <div className="relative w-full h-full min-h-[1.5rem] flex items-center group"> 
        {/* Note: j'ai ajusté la hauteur pour s'adapter au className parent si besoin */}
        
        {/* Background track */}
        <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-full w-full bg-blue-950/60 backdrop-blur-xl rounded-full border border-blue-400/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]" />

        {/* Progress fill with fluid animation */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-full rounded-full overflow-hidden transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div
            className="w-full h-full animate-fluid opacity-80"
            style={{
              background: `linear-gradient(90deg, #0044cc 0%, #0099ff 50%, #00ccff 100%)`,
              backgroundSize: '200% 100%',
            }}
          />
          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-soft-light"
            style={{
              backgroundImage:
                "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%221%22/%3E%3C/svg%3E')",
            }}
          />
        </div>

        {/* Heart indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-1000 ease-out"
          style={{ left: `${progress}%` }}
        >
          <div 
            className="w-5 h-5 sm:w-7 sm:h-7 -ml-2.