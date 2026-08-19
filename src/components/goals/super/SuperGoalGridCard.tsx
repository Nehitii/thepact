import React, { useMemo, memo } from "react";
import { Crown, Zap, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDifficultyLabel, DIFFICULTY_OPTIONS } from "@/lib/goalConstants";
import { nomSansPrefixeGroupe, type SuperGoalRule } from "./types";

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

  /* La carte de groupe reprend "eclat de verre" a l'identique et n'ajoute
   * que les deux signes retenus pour la vue en barre : un arc de lumiere
   * doree qui parcourt le contour, et une pastille par objectif contenu.
   * Il ne faut pas deux langages dans une meme grille — ce qui distingue
   * doit s'ajouter, pas remplacer. */
  return (
    <article
      style={cssVars}
      onClick={() => onClick(id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(id);
        }
      }}
      aria-label={name}
      className={cn("verre verre-groupe", isComplete && "verre--honore")}
    >
      <span className="verre-groupe-bord" aria-hidden="true" />

      <div className="verre-in">
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" className="verre-img" />
        ) : (
          <div className="verre-vide" aria-hidden="true">
            <Crown size={40} strokeWidth={1} />
          </div>
        )}

        <span className="verre-voile" aria-hidden="true" />
        <span className="verre-flanc" aria-hidden="true" />

        <span className="verre-bande">
          {getDiffLabel(difficulty, customDifficultyName)}
        </span>

        <div className="verre-socle">
          <span className="verre-lettre" aria-hidden="true">
            {getDiffLabel(difficulty, customDifficultyName).slice(0, 1)}
          </span>

          <div className="verre-groupe-tags">
            <span className="verre-groupe-tag">
              <Crown size={9} style={{ fill: "currentColor" }} aria-hidden="true" />
              GROUPE
            </span>
            {isDynamic && (
              <span className="verre-groupe-tag verre-groupe-tag--dyn">
                <Zap size={9} aria-hidden="true" />
                AUTO
              </span>
            )}
          </div>

          <h3 className="verre-nom">{nomSansPrefixeGroupe(name)}</h3>

          {/* Une pastille par objectif contenu, allumee quand il est
              honore. Au-dela de douze elles formeraient un trait continu
              et ne compteraient plus rien : on les retire. */}
          {childCount > 0 && childCount <= 12 && (
            <span className="verre-pastilles" aria-hidden="true">
              {Array.from({ length: childCount }, (_, i) => (
                <u key={i} className={i < completedCount ? "on" : ""} />
              ))}
            </span>
          )}

          {/* Un groupe termine perd sa jauge — pleine, donc muette — et
              recoit la bande qui le dit en toutes lettres. */}
          {isComplete ? (
            <span className="verre-honore">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5.2 5.2L20 6.9" /></svg>
              HONORÉ
            </span>
          ) : (
            <div className="verre-bas">
              <span className="verre-etat">In Progress</span>
              <span className="verre-seg" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => (
                  <u key={i} className={i < Math.round(progress / 10) ? "on" : ""} />
                ))}
              </span>
              <b className="verre-pct">{completedCount}/{childCount}</b>
            </div>
          )}

          {ruleLabel && <span className="verre-regle">{ruleLabel}</span>}
        </div>
      </div>
    </article>
  );
});