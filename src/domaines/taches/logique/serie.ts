import { jourLocal } from "@/socle/outils/jour";
/* LA SERIE, ET LES COMPTEURS QUI L ACCOMPAGNENT.
 *
 * Ce calcul vivait au milieu de `completeTask` : entre trois ecritures
 * Supabase, un rattrapage d erreur et un appel de procedure stockee.
 * Il est pourtant entierement determine par deux choses — les
 * compteurs d hier, et l heure qu il est.
 *
 * UNE SERIE FAUSSE NE SE VOIT PAS. Elle affiche un nombre plausible.
 * C est le genre de calcul qu on ne relit qu apres avoir perdu une
 * serie de quarante jours, et alors il est trop tard pour la rendre.
 */

/** « Aujourd hui » se lit dans le fuseau de l utilisateur, pas a
 *  Greenwich. `toISOString()` renvoie la date UTC : une tache terminee
 *  a 00 h 30 a Paris comptait pour la veille, et cassait une serie qui
 *  aurait du tenir. */
export const cleDuJour: (d: Date) => string = jourLocal;

export interface CompteursDeTaches {
  current_streak: number;
  longest_streak: number;
  last_completion_date: string | null;
  tasks_completed_month: number;
  tasks_completed_year: number;
  current_month: number;
  current_year: number;
}

/** Ce que la procedure stockee attend, nomme. */
export interface Avancement {
  serie: number;
  plusLongueSerie: number;
  compteDuMois: number;
  compteDeLAnnee: number;
  mois: number;
  annee: number;
  jour: string;
}

export function avancerLaSerie(compteurs: CompteursDeTaches, maintenant: Date): Avancement {
  const jour = cleDuJour(maintenant);
  const mois = maintenant.getMonth() + 1;
  const annee = maintenant.getFullYear();

  /* Un mois qui change remet le compteur du mois a zero, pas celui de
     l annee — et reciproquement. Les deux se testent separement parce
     qu ils tombent ensemble une fois sur douze seulement. */
  const duMois = compteurs.current_month !== mois ? 0 : compteurs.tasks_completed_month;
  const deLAnnee = compteurs.current_year !== annee ? 0 : compteurs.tasks_completed_year;

  /* TERMINER DEUX TACHES LE MEME JOUR N AVANCE PAS LA SERIE. Une serie
     compte des JOURS, pas des taches ; sans ce garde, une journee
     productive vaudrait une semaine de constance. */
  let serie = compteurs.current_streak;
  if (compteurs.last_completion_date !== jour) {
    const hier = new Date(maintenant);
    hier.setDate(hier.getDate() - 1);
    /* La veille prolonge ; tout le reste — un trou, ou rien du tout —
       repart a un. Pas a zero : la tache qu on vient de terminer
       compte. */
    serie = compteurs.last_completion_date === cleDuJour(hier) ? compteurs.current_streak + 1 : 1;
  }

  return {
    serie,
    plusLongueSerie: Math.max(compteurs.longest_streak, serie),
    compteDuMois: duMois + 1,
    compteDeLAnnee: deLAnnee + 1,
    mois,
    annee,
    jour,
  };
}
