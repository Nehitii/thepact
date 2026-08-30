/* LES QUATRE SUCCES QUI SE JUGENT SUR LE TEMPS MIS.
 *
 * Tous les autres se comptent — tant d objectifs, tant de mois, tant de
 * gestes. Ces quatre-la se MESURENT : ils regardent l ecart entre le
 * depart d un objectif et son achevement, et se declenchent sous un
 * seuil. Les seuils etaient ecrits en clair au milieu de quatre `if`,
 * et l instant de depart etait choisi ailleurs, dans un appelant.
 *
 * Un ecart faux ici ne casse rien : il DONNE un succes. Personne ne
 * vient jamais verifier qu une distinction etait meritee.
 */

/** Un objectif « impossible » boucle en moins d un mois. */
export const JOURS_HORS_DU_TEMPS = 30;
/** Un « extreme » boucle en moins de trois jours. */
export const HEURES_CHEMIN_COURBE = 72;
/** Le meme, en moins de deux. */
export const HEURES_SANG_RESOLU = 48;
/* TROIS MINUTES. Ce n est pas une performance, c est une signature :
   0,05 heure separe un objectif commence et acheve dans le meme geste
   de tout ce qui a demande du travail. */
export const HEURES_ECHO = 0.05;

export const MS_PAR_HEURE = 1000 * 60 * 60;
export const MS_PAR_JOUR = MS_PAR_HEURE * 24;

/* UNE DUREE INCONNUE N EST PAS UNE DUREE NULLE.
 *
 * Sans depart, on ne sait pas combien de temps l objectif a pris — et
 * `null` le dit, la ou zero pretendrait le contraire. Une date de
 * depart illisible tombe au meme endroit : ce qui ne se mesure pas
 * n est pas une performance. */
export function dureeEnHeures(depuis: string | null | undefined, jusqua: string): number | null {
  if (!depuis) return null;
  const heures = (new Date(jusqua).getTime() - new Date(depuis).getTime()) / MS_PAR_HEURE;
  return Number.isNaN(heures) ? null : heures;
}

/* ═══════════════════════════════════════════════════════════════
   UNE SEULE HORLOGE : CELLE QUE LA PERSONNE DECLARE.

   Les quatre distinctions se comptaient depuis `start_date`. Le
   30/08/2026 au matin, « briseur d echo » a ete deplace sur
   `created_at`, parce que sa definition en base disait « dans les 3
   minutes suivant SA CREATION » — et la mesure donnait raison au
   changement : depuis le depart, aucun des quatorze objectifs honores
   ne passait sous les trois minutes ; depuis la creation, dix y
   passaient.

   LA DEFINITION DECRIVAIT LA MAUVAISE CHOSE, et le changement a ete
   annule le meme jour. `created_at` est la date a laquelle la LIGNE a
   ete ecrite — un fait de comptabilite, pas un fait de la vie de
   quelqu un. Dans une application entierement declarative, la seule
   date qui veuille dire quelque chose est celle que la personne pose
   elle-meme. Recompenser `created_at`, c est recompenser le moment ou
   l on a ouvert le formulaire.

   Qui veut tricher trichera de toute facon : ce n est pas une raison
   de mesurer autre chose que ce qui est declare. La definition en base
   a ete recrite pour dire « suivant son depart ».

   L ORDRE DE LA LISTE EST L ORDRE DES DEBLOCAGES. Il etait celui des
   quatre `if` ; le changer changerait l ordre des notifications.
   ═══════════════════════════════════════════════════════════════ */
export function honneursDuTemps(difficulte: string, heures: number | null): string[] {
  /* CE QUI NE SE MESURE PAS NE SE GAGNE PAS. Un objectif sans date de
     depart — la case n a pas ete cochee a la creation — ne gagne aucune
     des quatre. */
  if (heures === null) return [];
  const gagnes: string[] = [];
  if (difficulte === "impossible" && heures / 24 < JOURS_HORS_DU_TEMPS) gagnes.push("cut_through_time");
  if (difficulte === "extreme" && heures < HEURES_CHEMIN_COURBE) gagnes.push("warping_path");
  if (difficulte === "extreme" && heures < HEURES_SANG_RESOLU) gagnes.push("blood_of_resolve");
  if (heures < HEURES_ECHO) gagnes.push("echo_breaker");
  return gagnes;
}

/* ═══════════════════════════════════════════════════════════════
   D OU PART LA MESURE, ET CE QUE VAUT UN DEPART MANQUANT.

   L appelant passait `goal.start_date || maintenant` : un objectif SANS
   date de depart etait donc traite comme commencant a l instant meme
   ou on l acheve. La duree valait ZERO, et zero passe SOUS LES QUATRE
   SEUILS d un coup.

   LE REPLI EST RETIRE, et il ne l est plus par precaution : depuis que
   la case « je sais quand j ai commence » existe a la creation, un
   objectif PEUT n avoir aucune date de depart, et c est une reponse,
   pas un oubli. Un depart inconnu rend `null`, et une duree inconnue ne
   gagne rien.

   RELEVE LE 30/08/2026 : les 38 objectifs du compte portent tous une
   date de depart, et tous anterieure a leur creation — aucune ne vient
   d un champ pre-rempli qu on n aurait pas touche.
   ═══════════════════════════════════════════════════════════════ */
export interface ButAHonorer {
  difficulty?: string | null;
  start_date?: string | null;
}

export interface MesureDeLHonneur {
  difficulte: string;
  /** `null` quand l objectif n a pas de date de depart. */
  depuis: string | null;
  jusqua: string;
}

/** La difficulte manquante vaut « medium », comme partout ailleurs. */
export const DIFFICULTE_PAR_DEFAUT = "medium";

/* UNE SEULE LECTURE D HORLOGE. L appelant en faisait deux, a la suite,
   pour le depart de secours et pour l achevement — deux sources pour un
   seul instant. */
export function mesureDeLHonneur(but: ButAHonorer, maintenant: Date): MesureDeLHonneur {
  return {
    difficulte: but.difficulty ?? DIFFICULTE_PAR_DEFAUT,
    /* Le OU logique, et non `??` : une date de depart vide vaut une
       date de depart absente. */
    depuis: but.start_date || null,
    jusqua: maintenant.toISOString(),
  };
}
