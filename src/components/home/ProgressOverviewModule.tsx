import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressOverviewModuleProps {
  data: {
    goalsCompleted: number;
    totalGoals: number;
    totalStepsCompleted: number;
    totalSteps: number;
    statusCounts: {
      not_started: number;
      in_progress: number;
      fully_completed: number;
    };
  };
  compact?: boolean;
}

export function ProgressOverviewModule({ data, compact = false }: ProgressOverviewModuleProps) {
  const [showDetails, setShowDetails] = useState(false);

  const goalsPercentage = data.totalGoals > 0 
    ? ((data.goalsCompleted / data.totalGoals) * 100) 
    : 0;
  
  const stepsPercentage = data.totalSteps > 0 
    ? ((data.totalStepsCompleted / data.totalSteps) * 100) 
    : 0;

  // Calculate ring circumference (2 * PI * radius)
  const outerRadius = compact ? 50 : 70;
  const innerRadius = compact ? 35 : 50;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;

  return (
    <div className="relative group animate-fade-in">
      <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
      
      <div className={cn(
        "relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg overflow-hidden hover:border-primary/50 transition-all",
        compact ? "p-4" : "p-6"
      )}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
        </div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className={cn(
            "text-primary/70 uppercase tracking-widest font-orbitron",
            compact ? "text-[10px] mb-3" : "text-xs mb-4"
          )}>
            Progress Overview
          </div>
          
          {/* Dual Ring Display */}
          <div className="flex items-center justify-center gap-8">
            {/* Concentric rings */}
            <div className="relative">
              <svg 
                className={cn("-rotate-90", compact ? "w-28 h-28" : "w-40 h-40")}
                viewBox={compact ? "0 0 120 120" : "0 0 160 160"}
              >
                {/* Outer ring background (Goals) */}
                <circle
                  cx={compact ? "60" : "80"}
                  cy={compact ? "60" : "80"}
                  r={outerRadius}
                  stroke="hsl(var(--primary) / 0.15)"
                  strokeWidth={compact ? "8" : "10"}
                  fill="none"
                />
                {/* Outer ring progress (Goals) */}
                <circle
                  cx={compact ? "60" : "80"}
                  cy={compact ? "60" : "80"}
                  r={outerRadius}
                  stroke="url(#goalGradient)"
                  strokeWidth={compact ? "8" : "10"}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(goalsPercentage / 100) * outerCircumference} ${outerCircumference}`}
                  className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]"
                />
                
                {/* Inner ring background (Steps) */}
                <circle
                  cx={compact ? "60" : "80"}
                  cy={compact ? "60" : "80"}
                  r={innerRadius}
                  stroke="hsl(var(--primary) / 0.15)"
                  strokeWidth={compact ? "6" : "8"}
                  fill="none"
                />
                {/* Inner ring progress (Steps) */}
                <circle
                  cx={compact ? "60" : "80"}
                  cy={compact ? "60" : "80"}
                  r={innerRadius}
                  stroke="url(#stepGradient)"
                  strokeWidth={compact ? "6" : "8"}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(stepsPercentage / 100) * innerCircumference} ${innerCircumference}`}
                  className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]"
                />
                
                <defs>
                  <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--health))" />
                    <stop offset="100%" stopColor="hsl(142 76% 46%)" />
                  </linearGradient>
                  <linearGradient id="stepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={cn(
                  "font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]",
                  compact ? "text-xl" : "text-3xl"
                )}>
                  {Math.round((goalsPercentage + stepsPercentage) / 2)}%
                </div>
                <div className={cn(
                  "text-primary/50 font-rajdhani uppercase",
                  compact ? "text-[8px]" : "text-[10px]"
                )}>
                  Overall
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-health to-green-500 shadow-[0_0_6px_rgba(74,222,128,0.5)]" />
                  <span className={cn(
                    "uppercase tracking-wider font-orbitron text-primary/70",
                    compact ? "text-[9px]" : "text-[10px]"
                  )}>Goals</span>
                </div>
                <div className={cn(
                  "font-bold text-health font-orbitron",
                  compact ? "text-lg" : "text-xl"
                )}>
                  {data.goalsCompleted}/{data.totalGoals}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent shadow-[0_0_6px_rgba(91,180,255,0.5)]" />
                  <span className={cn(
                    "uppercase tracking-wider font-orbitron text-primary/70",
                    compact ? "text-[9px]" : "text-[10px]"
                  )}>Steps</span>
                </div>
                <div className={cn(
                  "font-bold text-primary font-orbitron",
                  compact ? "text-lg" : "text-xl"
                )}>
                  {data.totalStepsCompleted}/{data.totalSteps}
                </div>
              </div>
            </div>
          </div>
          
          {/* Expandable Status Details */}
          {!compact && (
            <div className="mt-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-center gap-2 py-2 text-primary/60 hover:text-primary transition-colors"
              >
                <span className="text-[10px] uppercase tracking-wider font-orbitron">
                  Status Details
                </span>
                {showDetails ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
              
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-primary/20">
                      {/* Not Started */}
                      <div className="text-center p-3 rounded-lg bg-card/30 border border-primary/20">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                          <span className="text-[9px] uppercase font-orbitron text-muted-foreground">Not Started</span>
                        </div>
                        <div className="text-xl font-bold text-muted-foreground font-orbitron">
                          {data.statusCounts.not_started}
                        </div>
                      </div>
                      
                      {/* In Progress */}
                      <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/30">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <span className="text-[9px] uppercase font-orbitron text-primary">In Progress</span>
                        </div>
                        <div className="text-xl font-bold text-primary font-orbitron">
                          {data.statusCounts.in_progress}
                        </div>
                      </div>
                      
                      {/* Completed */}
                      <div className="text-center p-3 rounded-lg bg-health/5 border border-health/30">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <div className="w-2 h-2 rounded-full bg-health" />
                          <span className="text-[9px] uppercase font-orbitron text-health">Completed</span>
                        </div>
                        <div className="text-xl font-bold text-health font-orbitron">
                          {data.statusCounts.fully_completed}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
