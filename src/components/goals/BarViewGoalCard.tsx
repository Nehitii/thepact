import React, { memo } from "react";
import { Star, Target, Trophy } from "lucide-react";
import { getGoalStatusIcon } from "@/lib/goalConstants";
import { SharedGoalBadge } from "@/components/goals/SharedGoalBadge";
import { GoalLockOverlay } from "@/components/goals/GoalLockOverlay";
import { useTranslation } from "react-i18next";
import { useCarteObjectif } from "@/hooks/useCarteObjectif";

interface Goal {
  id: string;
  name: string;
  type: string;
  difficulty?: string | null;
  status?: string | null;
  image_url?: string | null;
  is_focus?: boolean | null;
  goal_type?: string;
  habit_duration_days?: number | null;
  habit_checks?: boolean[] | null;
  totalStepsCount?: number;
  completedStepsCount?: number;
  /** L etape ultime est franchie : l objectif est au zenith. */
  auZenith?: boolean;
  potential_score?: number | null;
  tags?: string[];
  deadline?: string | null;
  isShared?: boolean;
  isReadOnly?: boolean;
  sharedByName?: string;
  is_locked?: boolean;
}

interface BarViewGoalCardProps {
  goal: Goal;
  isCompleted?: boolean;
  customDifficultyName?: string;
  customDifficultyColor?: string;
  onNavigate: (goalId: string) => void;
  onToggleFocus: (goalId: string, currentFocus: boolean, e: React.MouseEvent) => void;
}

/* Cette carte portait sa propre palette : « facile » y valait #22c55e
   quand la grille et le registre affichaient #4ade80. Le meme objectif
   changeait donc de couleur selon la vue ouverte. Tout ce que la carte
   deduisait — palier, etapes, avancement, teinte, libelles — vient
   desormais de useCarteObjectif, qui le calcule une fois pour les
   trois vues. */

export const BarViewGoalCard = memo(function BarViewGoalCard({
  goal,
  isCompleted = false,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
  onNavigate,
  onToggleFocus,
}: BarViewGoalCardProps) {
  const { t } = useTranslation();
  /* Le bloc « kpi » qui vivait ici fabriquait une valeur et un libelle
     — « Intensity », « Done », « Progress », « Remaining », « Today »,
     « Overdue » — et le rendu ne s en servait nulle part : la refonte
     « eclat » avait remplace l indicateur par la jauge du bas sans
     retirer son calcul. Vingt lignes et six mots anglais qui
     n atteignaient aucun ecran. */
  const { teinte, libellePalier, avancement, libelleEtat, etapesTotal, etapesFaites, intensite, echeance } =
    useCarteObjectif(goal, {
      t,
      termine: isCompleted,
      nomPersonnalise: customDifficultyName,
      couleurPersonnalisee: customDifficultyColor,
    });

  const cssVars = {
    "--accent": teinte.couleur,
    "--accent-rgb": teinte.rgb,
    "--intensity": intensite,
    "--halo-intensity": intensite,
    "--percent": `${avancement}%`,
  } as React.CSSProperties;

  const StatusIcon = getGoalStatusIcon(goal.status || (isCompleted ? "fully_completed" : "not_started"));

  /* ÉCLAT
   *
   * Aucun rectangle. L'image ne tient plus dans un cadre : elle saigne
   * dans le fond de la carte par une coupe diagonale franche, une lumiere
   * rasante a la couleur du palier traverse l'ensemble, et le coin
   * bas-droit est tranche puis rempli d'une trame.
   *
   * La carte precedente empilait quatre blocs — vignette, informations,
   * indicateur, jauge — chacun dans sa boite. Ici il n'y a plus de
   * boites : la diagonale de l'image guide l'oeil vers le nom, et la
   * jauge ferme la lecture en bas. Une seule trajectoire au lieu de
   * quatre zones a balayer.
   */
  return (
    <div
      className={`eclat${goal.is_focus ? " eclat--focus" : ""}${isCompleted ? " eclat--honore" : ""}${goal.auZenith ? " eclat--zenith" : ""}`}
      style={cssVars}
      onClick={() => onNavigate(goal.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate(goal.id);
        }
      }}
    >
      {goal.is_locked && <GoalLockOverlay className="z-50" />}

      <div className="eclat-img">
        {goal.image_url ? (
          <img src={goal.image_url} alt="" loading="lazy" />
        ) : (
          <div className="eclat-vide"><Target size={26} strokeWidth={1.6} aria-hidden="true" /></div>
        )}
      </div>

      {/* La lumiere rasante : une bande claire en travers, a la couleur du
          palier. C'est elle qui relie l'image au texte. */}
      <span className="eclat-lueur" aria-hidden="true" />

      <div className="eclat-corps">
        <div className="eclat-tete">
          <span className="eclat-palier">{libellePalier}</span>
          <span className="eclat-sep" aria-hidden="true" />
          <span className="eclat-etat">
            <StatusIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
            {libelleEtat}
          </span>
          {echeance && !isCompleted && (
            <span className="eclat-delai" style={{ color: echeance.couleur }}>
              {echeance.joursRestants > 0
                ? t("goals.carte.restant", "J-{{n}}", { n: echeance.joursRestants })
                : echeance.joursRestants === 0
                  ? t("goals.carte.aujourdhui", "Aujourd'hui")
                  : t("goals.carte.retard", "J+{{n}}", { n: Math.abs(echeance.joursRestants) })}
            </span>
          )}
          {goal.isShared && <SharedGoalBadge ownerName={goal.sharedByName} />}
        </div>

        <h3 className="eclat-nom">{goal.name}</h3>

        <div className="eclat-bas">
          <span className="eclat-jauge">
            <i style={{ width: `${avancement}%` }} />
          </span>
          {etapesTotal > 0 ? (
            <span className="eclat-chiffre">
              {etapesFaites}<span className="eclat-fraction">/{etapesTotal}</span>
            </span>
          ) : (
            <span className="eclat-chiffre">{isCompleted ? <Trophy size={15} /> : `${intensite}/5`}</span>
          )}
        </div>
      </div>

      {/* Le coin tranche, rempli d'une trame diagonale. */}
      <span className="eclat-coin" aria-hidden="true" />

      <button
        type="button"
        aria-label={goal.is_focus ? t("goals.carte.focusRetirer", "Retirer du focus") : t("goals.carte.focusPoser", "Mettre en focus")}
        className={`eclat-focus${goal.is_focus ? " active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFocus(goal.id, !!goal.is_focus, e);
        }}
      >
        <Star size={14} fill={goal.is_focus ? teinte.couleur : "none"} stroke={teinte.couleur} />
      </button>
    </div>
  );
});

export default BarViewGoalCard;
