import React from "react";
import { Star, ImageOff } from "lucide-react";
import { cn } from "@/socle/outils/utils";
import { SharedGoalBadge } from "@/domaines/objectifs/composants/SharedGoalBadge";
import { GoalLockOverlay } from "@/domaines/objectifs/composants/GoalLockOverlay";
import { useTranslation } from "react-i18next";
import { useCarteObjectif } from "@/domaines/objectifs/hooks/useCarteObjectif";

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

/* La palette qui vivait ici est devenue celle de tout le module :
   c est la sienne — et celle du registre — qui a ete retenue, contre
   celle de la vue barre. useCarteObjectif la sert maintenant aux
   trois vues, et calcule avec elle les etapes, l avancement et les
   libelles que ce fichier deduisait de son cote. */

export function GridViewGoalCard({
  goal,
  isCompleted = false,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
  onNavigate,
  onToggleFocus,
}: GridViewGoalCardProps) {
  const { t } = useTranslation();
  /* « displayTags », « remainingTagsCount » et « isHabitGoal » etaient
     calcules, extraits, puis jamais poses : aucune etiquette n apparait
     sur cette carte, ni sur les deux autres vues. Avec eux partaient
     six imports inutilises — quatre icones et deux fonctions
     d etiquette. */
  const { teinte, libellePalier, avancement, libelleEtat, etapesTotal, etapesFaites, intensite } =
    useCarteObjectif(goal, {
      t,
      termine: isCompleted,
      nomPersonnalise: customDifficultyName,
      couleurPersonnalisee: customDifficultyColor,
    });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onNavigate(goal.id);
    }
  };

  const cssVars = {
    "--accent": teinte.couleur,
    "--accent-rgb": teinte.rgb,
    "--progress": `${avancement}%`,
    "--halo-intensity": intensite,
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
        <span className="verre-bande">{libellePalier}</span>

        {/* Socle d'affiche, teinte par le palier. */}
        <div className="verre-socle">
          <span className="verre-lettre" aria-hidden="true">
            {libellePalier.slice(0, 1)}
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
              {t("goals.carte.honore", "HONORÉ")}
              {goal.auZenith && <i className="verre-zenith-etoile" aria-hidden="true">✦</i>}
            </span>
          ) : (
            <div className="verre-bas">
              <span className="verre-etat">{libelleEtat}</span>
              <span className="verre-seg" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => (
                  <u key={i} className={i < Math.round(avancement / 10) ? "on" : ""} />
                ))}
              </span>
              <b className="verre-pct">
                {etapesTotal > 0 ? `${etapesFaites}/${etapesTotal}` : `${avancement}%`}
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
          aria-label={goal.is_focus ? t("goals.carte.focusRetirer", "Retirer du focus") : t("goals.carte.focusPoser", "Mettre en focus")}
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
