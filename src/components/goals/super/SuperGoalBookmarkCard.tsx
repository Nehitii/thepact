import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Crown, Sparkles, Zap, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDifficultyColor as getUnifiedDifficultyColor } from "@/lib/utils";
import { getDifficultyLabel } from "@/lib/goalConstants";
import type { SuperGoalRule } from "./types";

interface SuperGoalBookmarkCardProps {
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

const getDifficultyIntensity = (difficulty: string): number => {
  switch (difficulty) {
    case "easy": return 1;
    case "medium": return 2;
    case "hard": return 3;
    case "extreme": return 4;
    case "impossible": case "custom": return 5;
    default: return 1;
  }
};

const withAlpha = (color: string, alpha: number): string => {
  if (color.startsWith("hsl(")) {
    const inner = color.slice(4, -1).trim();
    const base = inner.split("/")[0].trim();
    return `hsl(${base} / ${alpha})`;
  }
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    if (full.length === 6) {
      const r = parseInt(full.slice(0, 2), 16);
      const g = parseInt(full.slice(2, 4), 16);
      const b = parseInt(full.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return color;
};

const getDiffLabel = (diff: string, customName?: string): string => {
  if (diff === "custom") return customName || "Custom";
  return diff.charAt(0).toUpperCase() + diff.slice(1);
};

export const SuperGoalBookmarkCard = memo(function SuperGoalBookmarkCard({
  id, name, childCount, completedCount, isDynamic, rule,
  difficulty = "medium", onClick, customDifficultyName = "", customDifficultyColor = "#a855f7",
}: SuperGoalBookmarkCardProps) {
  const { progress, difficultyColor, intensity, ruleLabel, isComplete } = useMemo(() => {
    const diff = difficulty || "medium";
    const prog = childCount > 0 ? Math.round((completedCount / childCount) * 100) : 0;
    const color = diff === "custom" ? customDifficultyColor : getUnifiedDifficultyColor(diff);
    let label = "";
    if (isDynamic && rule) {
      const parts: string[] = [];
      if (rule.difficulties?.length) parts.push(rule.difficulties.map(d => getDifficultyLabel(d, undefined, customDifficultyName)).join(", "));
      if (rule.focusOnly) parts.push("Focus");
      if (rule.excludeCompleted) parts.push("Active");
      label = parts.length > 0 ? `Auto: ${parts.join(" · ")}` : "Auto: All Goals";
    }
    return {
      progress: prog,
      difficultyColor: color,
      intensity: getDifficultyIntensity(diff),
      ruleLabel: label,
      isComplete: completedCount === childCount && childCount > 0,
    };
  }, [childCount, completedCount, isDynamic, rule, difficulty, customDifficultyName, customDifficultyColor]);

  const getTierBackground = () => {
    switch (difficulty) {
      case "easy": return `linear-gradient(135deg, ${withAlpha(difficultyColor, 0.9)}, ${withAlpha(difficultyColor, 0.7)})`;
      case "medium": return `linear-gradient(135deg, ${withAlpha(difficultyColor, 0.95)}, ${withAlpha(difficultyColor, 0.75)})`;
      case "hard": return `linear-gradient(135deg, ${difficultyColor}, ${withAlpha(difficultyColor, 0.8)})`;
      case "extreme": return `linear-gradient(135deg, ${difficultyColor}, ${withAlpha(difficultyColor, 0.6)}, ${difficultyColor})`;
      case "impossible": case "custom":
        return `linear-gradient(135deg, ${difficultyColor}, ${withAlpha(difficultyColor, 0.7)}, ${difficultyColor})`;
      default: return difficultyColor;
    }
  };

  const glossIntensity = [0.08, 0.14, 0.22, 0.28, 0.32, 0.35][Math.min(intensity, 5)] || 0.08;

  const cardBgColor = "#050814";
  const tintedBg = `linear-gradient(180deg, #070b16 0%, #050814 40%, #040612 100%)`;

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      transition={{ duration: 0.25, type: "spring", stiffness: 320 }}
      onClick={() => onClick(id)}
      className="cursor-pointer"
      style={{ width: "210px", height: "280px" }}
    >
      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          width: "210px",
          height: "280px",
          borderRadius: "22px",
          background: tintedBg,
          padding: "5px",
          boxShadow: `
            0 18px 45px rgba(0,0,0,0.85),
            0 0 25px ${withAlpha(difficultyColor, 0.35)},
            0 0 40px rgba(251, 191, 36, 0.12)
          `,
          border: "1px solid rgba(251, 191, 36, 0.15)",
        }}
      >
        {/* Difficulty Badge */}
        <Badge
          className="absolute top-1 left-2 z-10 text-[10px] uppercase tracking-wide font-semibold px-3 py-1 overflow-hidden"
          style={{
            borderRadius: "999px",
            color: "white",
            background: getTierBackground(),
            border: `1px solid ${withAlpha(difficultyColor, 0.7)}`,
            boxShadow: `0 0 ${8 + intensity * 3}px ${withAlpha(difficultyColor, 0.7)}, inset 0 1px 1px rgba(255,255,255,${glossIntensity})`,
          }}
        >
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,${glossIntensity * 1.2}) 0%, rgba(255,255,255,${glossIntensity * 0.3}) 40%, transparent 60%)`,
              borderRadius: "inherit",
            }}
          />
          <span className="relative z-10">{getDiffLabel(difficulty, customDifficultyName)}</span>
        </Badge>

        {/* SUPER badge */}
        <div
          className="absolute top-1 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-bold tracking-widest uppercase"
          style={{
            color: "#fbbf24",
            background: "rgba(251, 191, 36, 0.15)",
            border: "1px solid rgba(251, 191, 36, 0.3)",
            boxShadow: "0 0 8px rgba(251, 191, 36, 0.2)",
          }}
        >
          <Sparkles className="w-2.5 h-2.5" />
          SUPER
        </div>

        {/* Top Section - Crown */}
        <div
          className="relative overflow-hidden flex-shrink-0"
          style={{
            height: "130px",
            width: "100%",
            borderRadius: "16px",
            background: `linear-gradient(45deg, ${withAlpha(difficultyColor, 0.7)} 0%, ${difficultyColor} 40%, ${withAlpha(difficultyColor, 0.4)} 100%)`,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Crown className="w-14 h-14 text-amber-300/90 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
          </div>

          {/* Cutout decorations */}
          <div
            className="absolute top-0 left-0"
            style={{
              borderBottomRightRadius: "10px",
              height: "30px", width: "130px",
              background: cardBgColor,
              transform: "skew(-40deg)",
              boxShadow: `-10px -10px 0 0 ${cardBgColor}`,
            }}
          />
          <div className="absolute" style={{ top: "0", right: "115px", width: "15px", height: "15px", background: "transparent", borderTopLeftRadius: "10px", boxShadow: `-5px -5px 0 2px ${cardBgColor}` }} />
          <div className="absolute" style={{ top: "30px", left: "0", width: "15px", height: "15px", background: "transparent", borderTopLeftRadius: "15px", boxShadow: `-5px -5px 0 2px ${cardBgColor}` }} />
        </div>

        {/* Separator */}
        <div style={{ marginTop: "8px", marginBottom: "6px", width: "100%", height: "2px", borderRadius: "999px", background: "linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.3), transparent)", opacity: 0.9 }} />

        {/* Bottom Section */}
        <div className="px-2 pb-2 flex-1 flex flex-col min-h-0">
          {/* Title */}
          <div className="h-10 flex items-start justify-center overflow-hidden">
            <h3
              className="text-center font-bold tracking-widest uppercase line-clamp-2 font-rajdhani leading-tight"
              style={{ fontSize: "13px", color: "#ffffff", letterSpacing: "1.6px" }}
            >
              {name}
            </h3>
          </div>

          {/* Goals + Progress */}
          <div className="mt-3 space-y-2 px-1">
            <div className="flex items-center justify-between text-xs font-rajdhani">
              <span style={{ color: "#7f8ca9" }}>Goals</span>
              <span className="font-bold" style={{ color: isComplete ? "#4ade80" : difficultyColor }}>
                {completedCount}/{childCount} • {progress}%
              </span>
            </div>

            <div
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ background: "#141827", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "inset 0 0 4px rgba(0,0,0,0.6)" }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                  background: isComplete
                    ? "linear-gradient(90deg, #4ade80, #22c55e)"
                    : `linear-gradient(90deg, ${withAlpha(difficultyColor, 0.2)}, ${difficultyColor}, ${withAlpha(difficultyColor, 0.9)})`,
                  boxShadow: `0 0 ${7 + intensity * 2}px ${withAlpha(difficultyColor, 0.85)}`,
                }}
              />
            </div>

            {isComplete && (
              <div className="flex items-center justify-center gap-1 text-emerald-300 text-xs font-rajdhani mt-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Complete</span>
              </div>
            )}

            {ruleLabel && !isComplete && (
              <div className="text-[8px] text-center text-gray-500 font-mono truncate mt-1">{ruleLabel}</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
