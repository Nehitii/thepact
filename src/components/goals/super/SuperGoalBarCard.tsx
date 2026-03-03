import React, { memo, useMemo } from "react";
import { Crown, Zap, Trophy, TrendingUp } from "lucide-react";
import { DIFFICULTY_OPTIONS, getDifficultyIntensity } from "@/lib/goalConstants";
import { getDifficultyLabel } from "@/lib/goalConstants";
import type { SuperGoalRule } from "./types";

interface SuperGoalBarCardProps {
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
    case "easy": return { color: "#22c55e", rgb: "34, 197, 94" };
    case "medium": return { color: "#fbbf24", rgb: "251, 191, 36" };
    case "hard": return { color: "#f97316", rgb: "249, 115, 22" };
    case "extreme": return { color: "#ef4444", rgb: "239, 68, 68" };
    case "impossible": return { color: "#d946ef", rgb: "217, 70, 239" };
    case "custom": {
      const base = customColor || "#a855f7";
      const hex = base.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) || 168;
      const g = parseInt(hex.substring(2, 4), 16) || 85;
      const b = parseInt(hex.substring(4, 6), 16) || 247;
      return { color: base, rgb: `${r}, ${g}, ${b}` };
    }
    default: return { color: "#94a3b8", rgb: "148, 163, 184" };
  }
};

const getDiffLabel = (difficulty: string, customName: string): string => {
  if (difficulty === "custom") return customName || "Custom";
  const found = DIFFICULTY_OPTIONS.find((d) => d.value === difficulty);
  return found?.value ? found.value.charAt(0).toUpperCase() + found.value.slice(1) : difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

export const SuperGoalBarCard = memo(function SuperGoalBarCard({
  id, name, childCount, completedCount, isDynamic, rule,
  difficulty = "medium", onClick, customDifficultyName = "", customDifficultyColor = "#a855f7",
  imageUrl,
}: SuperGoalBarCardProps) {
  const { theme, difficultyLabel, progressPercent, intensity, ruleLabel, isComplete } = useMemo(() => {
    const diff = difficulty || "medium";
    const prog = childCount > 0 ? Math.round((completedCount / childCount) * 100) : 0;
    let label = "";
    if (isDynamic && rule) {
      const parts: string[] = [];
      if (rule.difficulties?.length) parts.push(rule.difficulties.map(d => getDifficultyLabel(d, undefined, customDifficultyName)).join(", "));
      if (rule.focusOnly) parts.push("Focus");
      if (rule.excludeCompleted) parts.push("Active");
      label = parts.length > 0 ? `Auto: ${parts.join(" · ")}` : "Auto: All Goals";
    }
    return {
      theme: getDifficultyTheme(diff, customDifficultyColor),
      difficultyLabel: getDiffLabel(diff, customDifficultyName),
      progressPercent: prog,
      intensity: getDifficultyIntensity(diff),
      ruleLabel: label,
      isComplete: completedCount === childCount && childCount > 0,
    };
  }, [childCount, completedCount, isDynamic, rule, difficulty, customDifficultyName, customDifficultyColor]);

  const cssVars = {
    "--accent": theme.color,
    "--accent-rgb": theme.rgb,
    "--intensity": intensity,
    "--percent": `${progressPercent}%`,
  } as React.CSSProperties;

  return (
    <div className="bar-card-root" style={cssVars} onClick={() => onClick(id)}>
      <div className="bar-card-container noselect">
        <div className="bar-card-canvas">
          {[...Array(9)].map((_, i) => (
            <div key={i} className={`bar-card-tracker tr-${i + 1}`} />
          ))}
          <div className="bar-card-inner">
            <div className="bar-card-noise" />
            <div className="bar-card-content">
              <div className="bar-card-visual">
                <div className="bar-card-img-glow" />
                <div className="bar-card-img-frame">
                  {imageUrl ? (
                    <img src={imageUrl} alt={name} loading="lazy" />
                  ) : (
                    <div className="bar-card-placeholder">
                      <Crown size={24} />
                    </div>
                  )}
                </div>
                {childCount > 0 && (
                  <div
                    className="bar-card-mini-ring"
                    style={{ background: `conic-gradient(${theme.color} ${progressPercent}%, rgba(255,255,255,0.1) 0)` }}
                  >
                    <div className="bar-card-ring-inner">
                      {isComplete ? <Trophy size={10} color={theme.color} /> : <TrendingUp size={10} color="white" />}
                    </div>
                  </div>
                )}
              </div>

              <div className="bar-card-info">
                <div className="bar-card-header">
                  <div className="bar-card-tags-row">
                    <div className="bar-card-diff-tag">
                      <span className="bar-card-dot" />
                      {difficultyLabel}
                    </div>
                    <div className="bar-card-super-tag">
                      <Crown size={9} style={{ fill: "currentColor" }} />
                      SUPER
                    </div>
                    {isDynamic && (
                      <div className="bar-card-dynamic-tag">
                        <Zap size={9} />
                        Dynamic
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="bar-card-name">{name}</h3>
                <div className="bar-card-meta">
                  <div className="bar-card-status">{isComplete ? "Complete" : "In Progress"}</div>
                  <div className="bar-card-steps">
                    {completedCount} <span className="bar-card-sep">/</span> {childCount} goals
                  </div>
                </div>
                <div className="bar-card-progress">
                  <div className="bar-card-track">
                    <div className="bar-card-fill" />
                    <div className="bar-card-shine" />
                  </div>
                </div>
                {ruleLabel && <div className="bar-card-rule">{ruleLabel}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
