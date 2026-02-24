import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Shield, Trophy } from "lucide-react";
import type { Rank } from "@/types/ranks";

// Re-export for convenience
export type { Rank };

// --- RANK BADGE ---
export interface RankBadgeProps {
  rank: Rank;
  currentXP?: number;
  nextRankMinXP?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RankBadge({ rank, size = "md", className }: RankBadgeProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-12 w-12 text-xs",
    lg: "h-16 w-16 text-sm",
  };

  const iconSize = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const frameColor = rank.frame_color || "#5bb4ff";
  const glowColor = rank.glow_color || "rgba(91,180,255,0.5)";

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm",
          sizeClasses[size],
        )}
        style={{
          border: `1.5px solid ${frameColor}`,
          boxShadow: `0 0 15px ${glowColor}`,
        }}
      >
        {rank.logo_url ? (
          <img src={rank.logo_url} alt={rank.name} className={cn("object-contain", iconSize[size])} />
        ) : (
          <Shield className={cn(iconSize[size])} style={{ color: frameColor }} />
        )}
      </div>

      {size !== "sm" && (
        <span className="text-xs font-rajdhani text-muted-foreground uppercase tracking-wider font-semibold">
          {rank.name}
        </span>
      )}
    </div>
  );
}

// --- RANK CARD ---
export interface RankCardProps {
  rank?: Rank;
  currentRank?: Rank;
  nextRank?: Rank | null;
  currentXP: number;
  nextRankMinXP?: number;
  totalMaxXP?: number;
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RankCard({ rank, currentRank: currentRankProp, nextRank, currentXP, nextRankMinXP, totalMaxXP, isActive, size = "md", className }: RankCardProps) {
  const currentRank = rank || currentRankProp!;
  const currentRankMin = currentRank.min_points;
  const nextRankMin = nextRankMinXP || nextRank?.min_points || currentRankMin * 1.5;

  const xpInRank = Math.max(0, currentXP - currentRankMin);
  const xpNeededForNext = Math.max(1, nextRankMin - currentRankMin);
  const progressPercent = Math.min(100, Math.max(0, (xpInRank / xpNeededForNext) * 100));

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-card border border-border/50 p-4", className)}>
      <div className="flex items-center gap-4">
        <RankBadge rank={currentRank} size="md" />

        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Current XP</span>
              <span className="text-lg font-bold font-rajdhani text-primary tabular-nums">
                {currentXP.toLocaleString()}
              </span>
            </div>
            {nextRank && (
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground">Next Rank: {nextRank.name}</span>
                <div className="text-xs font-mono text-primary/80">
                  {Math.floor(nextRankMin - currentXP).toLocaleString()} XP left
                </div>
              </div>
            )}
          </div>

          <div className="relative h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
            <Progress
              value={progressPercent}
              className="h-full [&>div]:bg-primary [&>div]:shadow-[0_0_10px_rgba(91,180,255,0.5)]"
            />
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-center justify-center opacity-50">
          {nextRank ? (
            <RankBadge rank={nextRank} size="sm" />
          ) : (
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <Trophy className="h-4 w-4 text-yellow-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
