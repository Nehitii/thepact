import React, { useMemo, memo } from "react";
import { Crown, Zap, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDifficultyLabel, DIFFICULTY_OPTIONS } from "@/lib/goalConstants";
import { type SuperGoalRule } from "./types";
import { useTranslation } from "react-i18next";
import { teinteDuPalier } from "@/hooks/useCarteObjectif";

interface SuperGoalGridCardProps {
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

/* Sixieme et derniere copie. Celle-ci portait les bonnes valeurs :
   c est elle qui a ete promue dans teinteDuPalier. */

export const SuperGoalGridCard = memo(function SuperGoalGridCard({
  id, name, childCount, completedCount, honore, pret, isDynamic, rule,
  difficulty = "medium", onClick, customDifficultyName = "", customDifficultyColor = "#a855f7",
  imageUrl,
}: SuperGoalGridCardProps) {
  const { t } = useTranslation();
  const { progress, theme, ruleLabel } = useMemo(() => {
    const prog = childCount > 0 ? Math.round((completedCount / childCount) * 100) : 0;
    const teinte = teinteDuPalier(difficulty, customDifficultyColor);
    let label = "";
    if (isDynamic && rule) {
      const parts: string[] = [];
      if (rule.difficulties?.length) parts.push(rule.difficulties.map(d => getDifficultyLabel(d, t, customDifficultyName)).join(", "));
      if (rule.focusOnly) parts.push(t("goals.rule.focus", "Focus"));
      if (rule.excludeCompleted) parts.push(t("goals.rule.active", "Actifs"));
      label = parts.length > 0 ? t("goals.rule.auto", "Auto : {{regles}}", { regles: parts.join(" · ") }) : t("goals.rule.autoAll", "Auto : tous les objectifs");
    }
    return { progress: prog, theme: teinte, ruleLabel: label };
  }, [childCount, completedCount, isDynamic, rule, difficulty, customDifficultyName, customDifficultyColor, t]);

  /* Trois etats, et non deux.
   *
   * Un groupe s'honore a la main depuis qu'on l'a decide. Celui dont
   * tous les membres sont franchis n'est donc pas honore : il est pret
   * a l'etre, et c'est une information — c'est le moment d'aller le
   * chercher. La carte le disait honore d'office, ce qui rendait le
   * geste invisible et contredisait la liste.
   *
   * Les deux etats arrivent calcules : estPretAHonorer() en est la
   * seule definition, partagee avec le registre et le filtre.
   */
  const isComplete = !!honore;

  const cssVars = {
    "--accent": theme.couleur,
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
          {getDifficultyLabel(difficulty, t, customDifficultyName)}
        </span>

        <div className="verre-socle">
          <span className="verre-lettre" aria-hidden="true">
            {getDifficultyLabel(difficulty, t, customDifficultyName).slice(0, 1)}
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

          <h3 className="verre-nom">{name}</h3>

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
              {t("goals.carte.honore", "HONORÉ")}
            </span>
          ) : pret ? (
            /* La meme bande, evidee : la forme est la, elle attend
               d'etre remplie. */
            <span className="verre-honore est-pret">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5.2 5.2L20 6.9" /></svg>
              {t("goals.carte.aHonorer", "À HONORER")}
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