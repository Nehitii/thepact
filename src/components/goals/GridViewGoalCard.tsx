import React, { useMemo } from "react";
import { Star, Target, Zap, ImageOff, CheckCircle, Link2 } from "lucide-react";
import { getTagColor, getTagLabel, getStatusLabel, getDifficultyIntensity, getGoalStatusIcon } from "@/lib/goalConstants";
import { cn } from "@/lib/utils";
import { SharedGoalBadge } from "@/components/goals/SharedGoalBadge";
import { GoalLockOverlay } from "@/components/goals/GoalLockOverlay";

// --- Interfaces ---
interface Goal {
  id: string;
  name: string;
  type?: string;
  difficulty?: string | null;
  image_url?: string | null;
  is_focus?: boolean | null;
  goal_type?: string;
  habit_duration_days?: number | null;
  habit_checks?: boolean[] | null;
  totalStepsCount?: number;
  completedStepsCount?: number;
  /** L etape ultime est franchie : l objectif est au zenith. */
  auZenith?: boolean;
  status?: string | null;
  tags?: string[];
  deadline?: string | null;
  isShared?: boolean;
  isReadOnly?: boolean;
  sharedByName?: string;
  is_locked?: boolean;
}

interface GridViewGoalCardProps {
  goal: Goal;
  isCompleted?: boolean;
  customDifficultyName?: string;
  customDifficultyColor?: string;
  onNavigate: (goalId: string) => void;
  onToggleFocus: (goalId: string, currentFocus: boolean, e: React.MouseEvent) => void;
}

// --- Helpers ---
const getDifficultyTheme = (difficulty: string, customColor?: string) => {
  switch (difficulty) {
    case "easy":
      return { color: "#4ade80", rgb: "74, 222, 128" };
    case "medium":
      return { color: "#facc15", rgb: "250, 204, 21" };
    case "hard":
      return { color: "#fb923c", rgb: "251, 146, 60" };
    case "extreme":
      return { color: "#f87171", rgb: "248, 113, 113" };
    case "impossible":
      return { color: "#c084fc", rgb: "192, 132, 252" };
    case "custom": {
      const base = customColor || "#a855f7";
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(base);
      const rgb = result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : "168, 85, 247";
      return { color: base, rgb };
    }
    default:
      return { color: "#94a3b8", rgb: "148, 163, 184" };
  }
};

const getDifficultyLabel = (diff: string, customName?: string): string => {
  if (diff === "custom") return customName || "Custom";
  return diff.charAt(0).toUpperCase() + diff.slice(1);
};

export function GridViewGoalCard({
  goal,
  isCompleted = false,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
  onNavigate,
  onToggleFocus,
}: GridViewGoalCardProps) {
  const derived = useMemo(() => {
    const diff = goal.difficulty || "easy";
    const goalType = goal.goal_type || "standard";
    const isHabit = goalType === "habit";

    const total = isHabit ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
    const completed = isHabit ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;
    const prog = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

    return {
      difficulty: diff,
      isHabitGoal: isHabit,
      totalSteps: total,
      completedSteps: completed,
      progress: prog,
      theme: getDifficultyTheme(diff, customDifficultyColor),
      statusLabel: isCompleted ? "Completed" : getStatusLabel(goal.status || "not_started"),
      displayTags: goal.tags?.slice(0, 2) || (goal.type ? [goal.type] : []),
      remainingTagsCount: Math.max(0, (goal.tags?.length || 0) - 2),
    };
  }, [goal, isCompleted, customDifficultyColor]);

  const {
    difficulty,
    isHabitGoal,
    totalSteps,
    completedSteps,
    progress,
    theme,
    statusLabel,
    displayTags,
    remainingTagsCount,
  } = derived;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onNavigate(goal.id);
    }
  };

  const intensity = getDifficultyIntensity(difficulty);
  const cssVars = {
    "--accent": theme.color,
    "--accent-rgb": theme.rgb,
    "--progress": `${progress}%`,
    "--halo-intensity": intensity,
  } as React.CSSProperties;

  /* ÉCLAT DE VERRE — silhouette brisée, socle d'affiche
   *
   * La carte etait une carte a collectionner : coins arrondis a 22px,
   * effet foil, panneau de verre flou pose sur l'image. Quatre couches
   * decoratives pour porter cinq informations.
   *
   * Ici la carte est un fragment. Le bas est coupe en pointe
   * asymetrique — aucun cote n'est parallele a un autre — et le palier
   * descend en bande lumineuse sur le flanc gauche. Une bande inclinee
   * traverse l'image et porte le nom du palier.
   *
   * Le socle vient de la proposition "affiche" : un aplat plein, teinte
   * par le palier, qui porte le nom en grand et une lettre geante en
   * filigrane. C'est lui qui donne a chaque carte une identite lisible
   * de loin en grille, la ou des vignettes sombres se ressemblent
   * toutes.
   */
  return (
    <article
      style={cssVars}
      onClick={() => onNavigate(goal.id)}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={goal.name}
      className={cn(
        "verre",
        goal.is_focus && "verre--focus",
        isCompleted && "verre--honore",
        /* Un objectif au zenith charge la carte entiere plutot que de
           gagner un badge de plus : le halo, le rail et la bande sont
           tous les trois transfigures. */
        goal.auZenith && "verre--zenith",
        goal.isShared && "verre--partage",
      )}
    >
      {goal.is_locked && <GoalLockOverlay />}

      <div className="verre-in">
        {/* Image plein cadre : elle n'est plus enfermee dans une vignette. */}
        {goal.image_url ? (
          <img src={goal.image_url} alt="" loading="lazy" className="verre-img" />
        ) : (
          <div className="verre-vide" aria-hidden="true">
            <ImageOff size={40} strokeWidth={1} />
          </div>
        )}

        <span className="verre-voile" aria-hidden="true" />
        <span className="verre-flanc" aria-hidden="true" />

        {/* Bande inclinee : le palier traverse l'image. */}
        <span className="verre-bande">{getDifficultyLabel(difficulty, customDifficultyName)}</span>

        {/* Socle d'affiche, teinte par le palier. */}
        <div className="verre-socle">
          <span className="verre-lettre" aria-hidden="true">
            {getDifficultyLabel(difficulty, customDifficultyName).slice(0, 1)}
          </span>

          <h3 className="verre-nom">{goal.name}</h3>

          {goal.isShared && <SharedGoalBadge ownerName={goal.sharedByName} className="verre-partage-badge" />}

          {/* Un objectif honore perd sa jauge — pleine, donc muette — et
              recoit la bande qui le dit en toutes lettres. */}
          {isCompleted ? (
            /* La bande garde son mot et sa place. Ce qui change au
               zenith, c est ce dont elle est faite — et les deux
               etoiles qui disent d ou vient cet or. */
            <span className="verre-honore">
              {goal.auZenith && <i className="verre-zenith-etoile" aria-hidden="true">✦</i>}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5.2 5.2L20 6.9" /></svg>
              HONORÉ
              {goal.auZenith && <i className="verre-zenith-etoile" aria-hidden="true">✦</i>}
            </span>
          ) : (
            <div className="verre-bas">
              <span className="verre-etat">{statusLabel}</span>
              <span className="verre-seg" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => (
                  <u key={i} className={i < Math.round(progress / 10) ? "on" : ""} />
                ))}
              </span>
              <b className="verre-pct">
                {totalSteps > 0 ? `${completedSteps}/${totalSteps}` : `${progress}%`}
              </b>
            </div>
          )}

        </div>

        <button
          type="button"
          className={cn("verre-focus", goal.is_focus && "active")}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFocus(goal.id, !!goal.is_focus, e);
          }}
          aria-label={goal.is_focus ? "Remove from focus" : "Set as focus"}
        >
          <Star
            className="w-4 h-4"
            fill={goal.is_focus ? "currentColor" : "none"}
            strokeWidth={goal.is_focus ? 0 : 2}
          />
        </button>
      </div>
    </article>
  );
}

export default GridViewGoalCard;
