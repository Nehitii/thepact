import React, { memo, useMemo } from "react";
import { Crown, Sparkles, Zap, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getDifficultyLabel, DIFFICULTY_OPTIONS } from "@/lib/goalConstants";
import { SuperGoalRule } from "./types";

interface SuperGoalCardProps {
  id: string;
  name: string;
  childCount: number;
  completedCount: number;
  isDynamic: boolean;
  rule?: SuperGoalRule | null;
  difficulty?: string;
  onClick: (id: string) => void;
  customDifficultyName?: string;
  customDifficultyColor?: string;
}

export const SuperGoalCard = memo(function SuperGoalCard({
  id,
  name,
  childCount,
  completedCount,
  isDynamic,
  rule,
  difficulty = "medium",
  onClick,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
}: SuperGoalCardProps) {
  const { progress, diffColor, ruleLabel } = useMemo(() => {
    const prog = childCount > 0 ? Math.round((completedCount / childCount) * 100) : 0;
    
    // Get difficulty color
    let color = "#6b7280";
    if (difficulty === "custom") {
      color = customDifficultyColor;
    } else {
      const found = DIFFICULTY_OPTIONS.find((d) => d.value === difficulty);
      if (found) {
        // Convert HSL to approximate hex for styling
        color = found.color.replace("hsl(", "").replace(")", "");
      }
    }
    
    // Generate rule label for auto-build
    let label = "";
    if (isDynamic && rule) {
      const parts: string[] = [];
      if (rule.difficulties?.length) {
        parts.push(rule.difficulties.map(d => getDifficultyLabel(d, undefined, customDifficultyName)).join(", "));
      }
      if (rule.focusOnly) parts.push("Focus");
      if (rule.excludeCompleted) parts.push("Active");
      label = parts.length > 0 ? `Auto: ${parts.join(" · ")}` : "Auto: All Goals";
    }
    
    return { progress: prog, diffColor: color, ruleLabel: label };
  }, [childCount, completedCount, isDynamic, rule, difficulty, customDifficultyName, customDifficultyColor]);

  const isComplete = completedCount === childCount && childCount > 0;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick(id)}
      className={cn(
        "relative cursor-pointer group",
        "rounded-2xl border-2 overflow-hidden",
        "bg-gradient-to-br from-card via-card/95 to-card/90",
        "transition-all duration-300",
        isComplete
          ? "border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
          : "border-primary/30 hover:border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
      )}
      style={{
        boxShadow: `0 0 30px rgba(91, 180, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Legendary aura effect */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top, hsl(var(--primary) / 0.3), transparent 70%)`,
        }}
      />
      
      {/* Animated border glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, transparent, hsl(var(--primary) / 0.1), transparent)`,
        }}
      />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {/* Crown icon with glow */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 flex items-center justify-center">
              <Crown className="h-6 w-6 text-yellow-500" />
            </div>
            {/* Pulse effect */}
            <div className="absolute inset-0 rounded-xl bg-yellow-500/20 animate-pulse opacity-50" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Super Goal badge */}
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 bg-primary/10 border-primary/30 text-primary font-bold uppercase tracking-wider"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Super Goal
              </Badge>
              {isDynamic && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 bg-purple-500/10 border-purple-500/30 text-purple-400"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Dynamic
                </Badge>
              )}
            </div>

            {/* Name */}
            <h3 className="font-orbitron font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
              {name}
            </h3>
          </div>
        </div>

        {/* Progress section */}
        <div className="space-y-3">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-rajdhani">Progress</span>
              <span className="font-bold text-foreground">{progress}%</span>
            </div>
            <Progress 
              value={progress} 
              className="h-2.5"
              style={{ 
                "--progress-background": isComplete ? "hsl(142, 70%, 45%)" : "hsl(var(--primary))" 
              } as React.CSSProperties}
            />
          </div>

          {/* Child goals count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>
                <span className="font-bold text-foreground">{completedCount}</span>
                <span className="mx-1">/</span>
                <span>{childCount}</span>
                <span className="ml-1">goals completed</span>
              </span>
            </div>

            {isComplete && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Complete
              </Badge>
            )}
          </div>

          {/* Rule label for dynamic super goals */}
          {ruleLabel && (
            <div className="pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground font-mono">{ruleLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)`,
        }}
      />
    </motion.div>
  );
});
