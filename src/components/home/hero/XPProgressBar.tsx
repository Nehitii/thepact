import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NoiseOverlay } from './NoiseOverlay';

interface XPProgressBarProps {
  currentXP: number;
  currentRankXP: number;
  nextRankXP: number;
  nextRankName: string;
  isMaxRank: boolean;
  frameColor?: string;
  className?: string;
}

/**
 * Premium XP progress bar with depth layers, inner shadows, noise texture,
 * tick marks at quartiles, and enhanced heart indicator glow.
 */
export function XPProgressBar({
  currentXP,
  currentRankXP,
  nextRankXP,
  nextRankName,
  isMaxRank,
  frameColor = '#00d4ff',
  className,
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
      <motion.div 
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ type: "spring", stiffness: 60, damping: 15 }}
        className={cn("w-full max-w-3xl mx-auto", className)}
      >
        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-500/40 flex items-center justify-center gap-2 animate-glow-pulse shadow-[0_0_30px_rgba(0,212,255,0.3)]">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span className="font-orbitron font-bold text-cyan-400 tracking-wider text-sm sm:text-base">
            MAX RANK ACHIEVED
          </span>
          <Sparkles className="w-5 h-5 text-cyan-400" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
      className={cn("space-y-3 w-full max-w-3xl mx-auto", className)}
    >
      {/* Header with rank target */}
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
          <span className="text-xs font-mono text-cyan-400/80 bg-cyan-900/40 px-2 py-0.5 rounded-full border border-cyan-500/40">
            {xpRemaining.toLocaleString()} needed
          </span>
        </div>
      </div>

      {/* Progress bar container with tick marks */}
      <div className="relative w-full h-8 sm:h-10 flex items-center group">
        {/* Background track with inner shadow for depth */}
        <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-3 sm:h-4 w-full bg-blue-950/70 backdrop-blur-xl rounded-full border border-blue-400/25 shadow-[inset_0_2px_6px_rgba(0,0,0,0.5),inset_0_-1px_2px_rgba(0,100,200,0.1)]">
          {/* Tick marks at quartiles */}
          <div className="absolute inset-0 flex items-center justify-between px-[25%]">
            <div className="w-px h-2 bg-blue-400/30 rounded-full" />
            <div className="w-px h-2.5 bg-blue-400/40 rounded-full" />
            <div className="w-px h-2 bg-blue-400/30 rounded-full" />
          </div>
        </div>

        {/* Progress fill with fluid animation and noise */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-3 sm:h-4 rounded-full overflow-hidden transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        >
          {/* Gradient fill */}
          <div
            className="w-full h-full animate-fluid"
            style={{
              background: `linear-gradient(90deg, #0033aa 0%, #0088ff 40%, #00ccff 100%)`,
              backgroundSize: '200% 100%',
            }}
          />
          
          {/* Noise texture overlay */}
          <NoiseOverlay opacity={0.25} />
          
          {/* Top highlight */}
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        </div>

        {/* Heart indicator with enhanced glow */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-1000 ease-out"
          style={{ left: `${progress}%` }}
        >
          {/* Outer glow ring */}
          <div 
            className="absolute -inset-2 rounded-full blur-md opacity-60 animate-pulse"
            style={{ background: `radial-gradient(circle, ${frameColor}80, transparent 70%)` }}
          />
          <div 
            className="relative w-6 h-6 sm:w-8 sm:h-8 -ml-3 sm:-ml-4 bg-cyan-50 rounded-full animate-heartbeat-circle border-[3px] sm:border-4 border-cyan-400 flex items-center justify-center"
            style={{
              boxShadow: `0 0 25px ${frameColor}, 0 0 50px ${frameColor}60`,
            }}
          >
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full blur-[1px]" />
          </div>
        </div>
      </div>

      {/* Footer with percentage */}
      <div className="flex justify-center items-center text-[10px] text-blue-300/50 font-orbitron uppercase tracking-widest">
        <span>Synchronization: {Math.round(progress)}%</span>
      </div>
    </motion.div>
  );
}
