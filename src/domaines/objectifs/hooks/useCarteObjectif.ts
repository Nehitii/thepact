/**
 * CE QUE TOUTE CARTE D OBJECTIF A BESOIN DE SAVOIR.
 *
 * Les vues barre, grille et registre calculaient chacune la meme
 * chose sous des noms differents : palier, etapes, avancement,
 * teinte, libelle d etat. Trois calculs pour une seule verite — et
 * donc trois endroits ou corriger le moindre defaut. Toutes les
 * fautes relevees ce jour-la etaient a corriger trois fois : les
 * copies de getDiffLabel, les « Focus » en dur, les dependances de
 * useMemo oubliees.
 *
 * DEUX INCOHERENCES QUE CETTE REUNION SUPPRIME PAR CONSTRUCTION.
 *
 * 1. L OBJECTIF D HABITUDE. La grille comptait ses jours coches ;
 *    la barre lisait des etapes qu il n a pas, et affichait donc
 *    zero. Un objectif d habitude existe dans la base : il montrait
 *    sa progression dans une vue et rien dans l autre.
 *
 * 2. LA COULEUR DU PALIER. getDifficultyTheme etait ecrit QUATRE
 *    fois, avec DEUX palettes : « facile » valait #22c55e dans la
 *    barre et #4ade80 dans la grille et le registre. Le meme
 *    objectif changeait de couleur selon la vue. On garde celle du
 *    registre — la vue de reference, et la plus recente.
 *
 * Reste une troisieme palette, en HSL, dans lib/utils.ts : elle sert
 * la fiche d objectif et les listes de membres. La rapprocher de
 * celle-ci changerait des couleurs deja validees ailleurs ; c est
 * une decision a prendre, pas un nettoyage a faire en passant.
 */
import { useMemo } from "react";
import { joursEntre, jourLocal } from "@/socle/outils/jour";
import type { TFunction } from "i18next";
import { getDifficultyIntensity, getDifficultyLabel, getStatusLabel } from "@/domaines/objectifs/logique/goalConstants";
import { teinteDuPalier } from "@/domaines/objectifs/logique/teintes";
/* Reexportee : quatre composants et la porte l importaient depuis ce hook. */
export { teinteDuPalier };

/* LE STRICT NECESSAIRE, ET RIEN D AUTRE.
   Le hook ne demande pas un objectif complet : il demande les champs
   qu il lit. Les cartes declarent chacune leur propre interface Goal —
   toutes satisfont celle-ci sans rien changer. */
export interface ObjectifAffichable {
  difficulty?: string | null;
  status?: string | null;
  goal_type?: string;
  habit_duration_days?: number | null;
  habit_checks?: boolean[] | null;
  totalStepsCount?: number;
  completedStepsCount?: number;
  deadline?: string | null;
}

export interface CarteObjectif {
  palier: string;
  estHabitude: boolean;
  etapesTotal: number;
  etapesFaites: number;
  /** De 0 a 100. */
  avancement: number;
  teinte: { couleur: string; rgb: string };
  intensite: number;
  libellePalier: string;
  libelleEtat: string;
  echeance: { joursRestants: number; couleur: string } | null;
}

interface Options {
  t: TFunction;
  termine?: boolean;
  nomPersonnalise?: string;
  couleurPersonnalisee?: string;
}

export function useCarteObjectif(goal: ObjectifAffichable, options: Options): CarteObjectif {
  const { t, termine = false, nomPersonnalise = "", couleurPersonnalisee = "" } = options;

  return useMemo(() => {
    const palier = goal.difficulty || "easy";
    const estHabitude = (goal.goal_type || "standard") === "habit";

    /* Un objectif d habitude se compte en JOURS COCHES, pas en
       etapes : il n en a pas. */
    const etapesTotal = estHabitude
      ? goal.habit_duration_days || 0
      : goal.totalStepsCount || 0;
    const etapesFaites = estHabitude
      ? goal.habit_checks?.filter(Boolean).length || 0
      : goal.completedStepsCount || 0;

    const avancement = etapesTotal > 0
      ? Math.min(100, Math.round((etapesFaites / etapesTotal) * 100))
      : 0;

    let echeance: CarteObjectif["echeance"] = null;
    if (goal.deadline) {
      /* ═══ ON COMPTE DES JOURS CIVILS, PAS DES MILLISECONDES ═══
         `goal.deadline` est une colonne « date » : elle rend un jour
         nu, que `new Date` lisait a MINUIT UTC. L ecart en
         millisecondes avec l instant courant donnait alors un nombre
         de jours qui dependait de l heure qu il est — juste a Paris
         par la grace de l arrondi vers le haut, faux ailleurs. Deux
         jours civils se soustraient sans ambiguite. */
      const joursRestants = joursEntre(jourLocal(), goal.deadline);
      echeance = {
        joursRestants,
        couleur: joursRestants > 7 ? "#22c55e" : joursRestants > 0 ? "#f59e0b" : "#ef4444",
      };
    }

    return {
      palier,
      estHabitude,
      etapesTotal,
      etapesFaites,
      avancement,
      teinte: teinteDuPalier(palier, couleurPersonnalisee),
      intensite: getDifficultyIntensity(palier),
      libellePalier: getDifficultyLabel(palier, t, nomPersonnalise),
      libelleEtat: termine
        ? t("goals.statuses.fully_completed", "Terminé")
        : getStatusLabel(goal.status || "not_started", t),
      echeance,
    };
  }, [goal, termine, nomPersonnalise, couleurPersonnalisee, t]);
}
