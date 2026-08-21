import React, { memo, useMemo } from "react";
import { Crown, Zap } from "lucide-react";
import { DIFFICULTY_OPTIONS, getDifficultyIntensity } from "@/lib/goalConstants";
import { getDifficultyLabel } from "@/lib/goalConstants";
import { type SuperGoalRule } from "./types";

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
    /* La carte de groupe reprend Eclat a l identique et n ajoute que deux
       signes : un arc de lumiere qui parcourt le contour, et une pastille
       par objectif contenu. Rien d autre ne la distingue — il ne faut pas
       deux langages dans une meme liste. */
    <div
      role="button"
      tabIndex={0}
      aria-label={name}
      className="eclat-groupe-cadre"
      style={cssVars}
      onClick={() => onClick(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(id);
        }
      }}
    >
      {/* Un arc de lumiere doree parcourt le contour en six secondes. Le
          contour DEVIENT l'effet : rien n'est ajoute par-dessus la carte,
          ce qui evite d'alourdir une ligne deja dense. */}
      <span className="eclat-groupe-bord" aria-hidden="true" />

      <div className="eclat eclat-groupe">
        <div className="eclat-img">
          {imageUrl ? (
            <img src={imageUrl} alt="" loading="lazy" />
          ) : (
            <div className="eclat-vide"><Crown size={24} strokeWidth={1.6} aria-hidden="true" /></div>
          )}
        </div>

        <span className="eclat-lueur" aria-hidden="true" />

        <div className="eclat-corps eclat-corps--groupe">
          <div className="eclat-tete">
            <span className="eclat-palier">{difficultyLabel}</span>
            <span className="eclat-sep" aria-hidden="true" />
            <span className="eclat-groupe-tag">
              <Crown size={9} style={{ fill: "currentColor" }} aria-hidden="true" />
              GROUPE
            </span>
            {isDynamic && (
              <span className="eclat-groupe-tag eclat-groupe-tag--dyn">
                <Zap size={9} aria-hidden="true" />
                AUTO
              </span>
            )}
          </div>

          <h3 className="eclat-nom">{name}</h3>

          <div className="eclat-bas">
            <span className="eclat-jauge">
              <i style={{ width: `${progressPercent}%` }} />
            </span>
            <span className="eclat-chiffre">
              {completedCount}<span className="eclat-fraction">/{childCount}</span>
            </span>
          </div>
        </div>

        {/* Une pastille par objectif contenu, allumee quand il est honore.
            Le groupe montre son contenu : on lit son avancement sans lire
            un chiffre. Au-dela de douze enfants on s'arrete — au-dela, les
            pastilles deviennent un trait et ne comptent plus rien. */}
        {childCount > 0 && childCount <= 12 && (
          <span className="eclat-pastilles" aria-hidden="true">
            {Array.from({ length: childCount }, (_, i) => (
              <u key={i} className={i < completedCount ? "on" : ""} />
            ))}
          </span>
        )}

        <span className="eclat-coin" aria-hidden="true" />
      </div>

      {ruleLabel && <div className="eclat-groupe-regle">{ruleLabel}</div>}
    </div>
  );
});
