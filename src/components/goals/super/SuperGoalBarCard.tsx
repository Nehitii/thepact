import React, { memo, useMemo } from "react";
import { Crown, Zap } from "lucide-react";
import { DIFFICULTY_OPTIONS, getDifficultyIntensity } from "@/lib/goalConstants";
import { getDifficultyLabel } from "@/lib/goalConstants";
import { type SuperGoalRule } from "./types";
import { useTranslation } from "react-i18next";
import { teinteDuPalier } from "@/hooks/useCarteObjectif";

interface SuperGoalBarCardProps {
  id: string;
  name: string;
  childCount: number;
  completedCount: number;
  /** Le groupe a ete honore — le geste, pas le seuil. */
  honore?: boolean;
  /** Tous les membres sont franchis, le geste reste a faire. */
  pret?: boolean;
  isDynamic: boolean;
  rule?: SuperGoalRule | null;
  difficulty?: string;
  onClick: (id: string) => void;
  customDifficultyName?: string;
  customDifficultyColor?: string;
  imageUrl?: string | null;
}

/* Cinquieme copie de la meme palette — et la variante sombre, celle
   de la vue barre. Un groupe « difficile » virait donc du #f97316 ici
   au #fb923c dans la grille. teinteDuPalier n en garde qu une. */

export const SuperGoalBarCard = memo(function SuperGoalBarCard({
  id, name, childCount, completedCount, honore, isDynamic, rule,
  difficulty = "medium", onClick, customDifficultyName = "", customDifficultyColor = "#a855f7",
  imageUrl,
}: SuperGoalBarCardProps) {
  const { t } = useTranslation();
  const { theme, difficultyLabel, progressPercent, intensity, ruleLabel, isComplete } = useMemo(() => {
    const diff = difficulty || "medium";
    const prog = childCount > 0 ? Math.round((completedCount / childCount) * 100) : 0;
    let label = "";
    if (isDynamic && rule) {
      const parts: string[] = [];
      if (rule.difficulties?.length) parts.push(rule.difficulties.map(d => getDifficultyLabel(d, t, customDifficultyName)).join(", "));
      if (rule.focusOnly) parts.push(t("goals.rule.focus", "Focus"));
      if (rule.excludeCompleted) parts.push(t("goals.rule.active", "Actifs"));
      label = parts.length > 0 ? t("goals.rule.auto", "Auto : {{regles}}", { regles: parts.join(" · ") }) : t("goals.rule.autoAll", "Auto : tous les objectifs");
    }
    return {
      theme: teinteDuPalier(diff, customDifficultyColor),
      difficultyLabel: getDifficultyLabel(diff, t, customDifficultyName),
      progressPercent: prog,
      intensity: getDifficultyIntensity(diff),
      ruleLabel: label,
      isComplete: !!honore,
    };
  }, [childCount, completedCount, honore, isDynamic, rule, difficulty, customDifficultyName, customDifficultyColor, t]);

  const cssVars = {
    "--accent": theme.couleur,
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
