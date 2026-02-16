import React, { useMemo, memo } from "react";
import { Crown, Zap, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDifficultyLabel, DIFFICULTY_OPTIONS } from "@/lib/goalConstants";
import type { SuperGoalRule } from "./types";

interface SuperGoalGridCardProps {
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
  imageUrl?: string | null;
}

const getDifficultyTheme = (difficulty: string, customColor?: string) => {
  switch (difficulty) {
    case "easy": return { color: "#4ade80", rgb: "74, 222, 128" };
    case "medium": return { color: "#facc15", rgb: "250, 204, 21" };
    case "hard": return { color: "#fb923c", rgb: "251, 146, 60" };
    case "extreme": return { color: "#f87171", rgb: "248, 113, 113" };
    case "impossible": return { color: "#c084fc", rgb: "192, 132, 252" };
    case "custom": {
      const base = customColor || "#a855f7";
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(base);
      const rgb = result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : "168, 85, 247";
      return { color: base, rgb };
    }
    default: return { color: "#94a3b8", rgb: "148, 163, 184" };
  }
};

const getDiffLabel = (diff: string, customName?: string): string => {
  if (diff === "custom") return customName || "Custom";
  return diff.charAt(0).toUpperCase() + diff.slice(1);
};

export const SuperGoalGridCard = memo(function SuperGoalGridCard({
  id, name, childCount, completedCount, isDynamic, rule,
  difficulty = "medium", onClick, customDifficultyName = "", customDifficultyColor = "#a855f7",
  imageUrl,
}: SuperGoalGridCardProps) {
  const { progress, theme, ruleLabel } = useMemo(() => {
    const prog = childCount > 0 ? Math.round((completedCount / childCount) * 100) : 0;
    const t = getDifficultyTheme(difficulty, customDifficultyColor);
    let label = "";
    if (isDynamic && rule) {
      const parts: string[] = [];
      if (rule.difficulties?.length) parts.push(rule.difficulties.map(d => getDifficultyLabel(d, undefined, customDifficultyName)).join(", "));
      if (rule.focusOnly) parts.push("Focus");
      if (rule.excludeCompleted) parts.push("Active");
      label = parts.length > 0 ? `Auto: ${parts.join(" · ")}` : "Auto: All Goals";
    }
    return { progress: prog, theme: t, ruleLabel: label };
  }, [childCount, completedCount, isDynamic, rule, difficulty, customDifficultyName, customDifficultyColor]);

  const isComplete = completedCount === childCount && childCount > 0;

  const cssVars = {
    "--accent": theme.color,
    "--accent-rgb": theme.rgb,
    "--progress": `${progress}%`,
  } as React.CSSProperties;

  return (
    <article
      style={cssVars}
      onClick={() => onClick(id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(id); } }}
      className={cn(
        "group relative w-full max-w-[340px] min-w-[260px] mx-auto cursor-pointer select-none rounded-[20px]",
        "transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "hover:-translate-y-1 hover:z-20 active:scale-[0.98]",
        "[perspective:1000px]",
        isComplete && "grayscale-[0.4] hover:grayscale-0",
      )}
    >
      <div
        className={cn(
          "relative w-full rounded-[20px] overflow-hidden",
          "bg-[#09090b] border border-white/[0.08]",
          "shadow-sm transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
          "group-hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.6),0_0_0_1px_rgba(var(--accent-rgb),0.3)]",
          "group-hover:border-[rgba(var(--accent-rgb),0.3)]",
        )}
        style={{ aspectRatio: "4/5" }}
      >
        {/* Image Layer */}
        <div className="absolute inset-0 z-0">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/10 via-black/20 to-black/90" />
            </>
          ) : (
            <>
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle at center, rgba(var(--accent-rgb), 0.25), rgba(var(--accent-rgb), 0.05) 60%, #111827)`,
                }}
              >
                <ImageOff className="w-12 h-12 text-white/20" />
              </div>
              <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/10 via-black/20 to-black/90" />
            </>
          )}
        </div>

        {/* Shine Effect */}
        <div className="absolute inset-0 z-[2] pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-[shimmer_1s_forwards]" />

        {/* Top Bar - Difficulty only */}
        <div className="absolute top-0 left-0 right-0 p-3.5 flex justify-between items-start z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 backdrop-blur-lg border border-white/10 rounded-full text-[10px] font-bold tracking-wider text-gray-100 uppercase">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }}
            />
            {getDiffLabel(difficulty, customDifficultyName)}
          </div>
        </div>

        {/* Glass Panel Content */}
        <div
          className={cn(
            "absolute bottom-3 left-3 right-3 p-4 rounded-2xl z-10",
            "bg-[rgba(20,20,25,0.75)] backdrop-blur-xl border border-white/[0.08]",
            "shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
            "flex flex-col gap-3 transition-all duration-300",
            "group-hover:bg-[rgba(20,20,25,0.85)] group-hover:border-white/[0.15]",
          )}
        >
          {/* Header Row with SUPER tag */}
          <div className="flex justify-between items-center mb-1.5">
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
              style={{
                background: "linear-gradient(135deg, #b8860b, #fbbf24, #b8860b)",
                color: "#fff",
                boxShadow: "0 0 10px rgba(251, 191, 36, 0.5), inset 0 1px 1px rgba(255,255,255,0.25)",
              }}
            >
              <Crown size={10} className="fill-current" />
              SUPER
            </div>
            {isDynamic && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-purple-500/30 text-purple-400 bg-black/40 uppercase">
                <Zap className="w-2.5 h-2.5 inline mr-0.5" />Dynamic
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold leading-tight text-white line-clamp-2 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
            {name}
          </h3>

          {/* Progress */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] font-semibold">
              <span className={cn("uppercase tracking-wider", isComplete ? "text-green-400" : "text-gray-400")}>
                {isComplete ? "Complete" : "In Progress"}
              </span>
              <span className="text-gray-100 tabular-nums">{progress}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                style={{
                  width: `${progress}%`,
                  background: isComplete ? "#4ade80" : "var(--accent)",
                  boxShadow: isComplete ? "0 0 8px #4ade80" : "0 0 8px var(--accent)",
                }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500">
                {completedCount} / {childCount} goals
              </span>
            </div>
          </div>

          {/* Rule label */}
          {ruleLabel && (
            <div className="pt-1 border-t border-white/[0.06]">
              <span className="text-[9px] text-gray-500 font-mono truncate block">{ruleLabel}</span>
            </div>
          )}
        </div>

        {/* Border Glow */}
        <div
          className={cn(
            "absolute inset-0 rounded-[20px] border border-transparent pointer-events-none z-20",
            "transition-all duration-300",
            "group-hover:border-[rgba(var(--accent-rgb),0.4)] group-hover:shadow-[inset_0_0_20px_rgba(var(--accent-rgb),0.05)]",
          )}
        />
      </div>
    </article>
  );
});
