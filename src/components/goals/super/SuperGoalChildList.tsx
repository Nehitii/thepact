import React, { memo, useMemo } from "react";
import { Crown, Target, CheckCircle2, AlertTriangle, ExternalLink, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getDifficultyColor } from "@/lib/utils";
import { getDifficultyLabel, getStatusLabel, getDifficultyIntensity } from "@/lib/goalConstants";
import type { SuperGoalChildInfo } from "./types";

interface SuperGoalChildListProps {
  children: SuperGoalChildInfo[];
  onChildClick: (id: string) => void;
  customDifficultyName?: string;
  customDifficultyColor?: string;
}

export const SuperGoalChildList = memo(function SuperGoalChildList({
  children,
  onChildClick,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
}: SuperGoalChildListProps) {
  const { completedCount, totalCount } = useMemo(() => {
    const valid = children.filter(c => !c.isMissing);
    return {
      completedCount: valid.filter(c => c.isCompleted).length,
      totalCount: valid.length,
    };
  }, [children]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-5 w-5 text-yellow-500" />
          <span className="font-orbitron font-bold tracking-wider">Child Goals</span>
        </div>
        <Badge 
          variant="outline" 
          className="font-rajdhani text-sm border-primary/30"
        >
          {completedCount}/{totalCount} completed
        </Badge>
      </div>

      {/* Children list */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {children.map((child) => {
          const diffColor = getDifficultyColor(child.difficulty, customDifficultyColor);
          const intensity = getDifficultyIntensity(child.difficulty);

          return (
            <motion.div
              key={child.id}
              variants={itemVariants}
              className={cn(
                "relative group flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200",
                child.isMissing
                  ? "border-destructive/40 bg-destructive/5 opacity-60"
                  : child.isCompleted
                  ? "border-green-500/40 bg-green-500/5 hover:border-green-500/60"
                  : "border-border bg-card/50 hover:border-primary/40 hover:bg-card/80"
              )}
              onClick={() => !child.isMissing && onChildClick(child.id)}
              style={{
                boxShadow: child.isCompleted 
                  ? `0 0 15px rgba(34, 197, 94, 0.1)` 
                  : child.isMissing 
                  ? undefined 
                  : `0 0 10px ${diffColor}10`,
              }}
            >
              {/* Status indicator */}
              <div className="flex-shrink-0">
                {child.isMissing ? (
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                ) : child.isCompleted ? (
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                ) : (
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center border"
                    style={{
                      background: `${diffColor}10`,
                      borderColor: `${diffColor}30`,
                    }}
                  >
                    <Target className="h-5 w-5" style={{ color: diffColor }} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-rajdhani font-medium truncate",
                    child.isMissing ? "text-destructive line-through" : "text-foreground"
                  )}>
                    {child.isMissing ? "Missing Goal" : child.name}
                  </span>
                  {!child.isMissing && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 font-bold uppercase"
                      style={{
                        borderColor: diffColor,
                        color: diffColor,
                        backgroundColor: `${diffColor}15`,
                      }}
                    >
                      {getDifficultyLabel(child.difficulty, undefined, customDifficultyName)}
                    </Badge>
                  )}
                </div>

                {!child.isMissing && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-[200px]">
                      <Progress 
                        value={child.progress} 
                        className="h-1.5"
                        style={{
                          "--progress-background": child.isCompleted 
                            ? "hsl(142, 70%, 45%)" 
                            : diffColor
                        } as React.CSSProperties}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {child.progress}%
                    </span>
                  </div>
                )}
              </div>

              {/* Status badge */}
              {!child.isMissing && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase font-bold",
                    child.isCompleted
                      ? "border-green-500/30 text-green-400 bg-green-500/10"
                      : child.status === "in_progress"
                      ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {getStatusLabel(child.status)}
                </Badge>
              )}

              {/* Arrow */}
              {!child.isMissing && (
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {children.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="font-rajdhani">No child goals found</p>
        </div>
      )}
    </div>
  );
});
