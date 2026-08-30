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
   0,05 heure separe un objectif cree et acheve dans le meme geste de
   tout ce qui a demande du travail. */
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

/* L ORDRE DE LA LISTE EST L ORDRE DES DEBLOCAGES. Il etait celui des
   quatre `if` ; le changer changerait l ordre des notifications. */
export function honneursDuTemps(difficulte: string, heures: number | null): string[] {
  /* CE QUI NE SE MESURE PAS NE SE GAGNE PAS. */
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
   SEUILS d un coup — « echo_breaker » toujours, et les trois autres si
   la difficulte s y pretait.

   CE REPLI ETAIT DOMINE PAR LA BASE, ET NE L EST PAS PAR CONSTRUCTION.
   Releve le 30/08/2026 sur le compte : 38 objectifs, AUCUN sans date de
   depart, et la colonne `goals.start_date` porte une valeur par
   defaut — mais elle reste NULLABLE. Une insertion posant
   explicitement `start_date: null` aurait donne ses quatre
   distinctions au premier achevement venu.

   LE REPLI EST RETIRE. Un depart inconnu rend `null`, et une duree
   inconnue ne gagne rien : ce qui ne se mesure pas n est pas une
   performance. Le changement est INVISIBLE aujourd hui — aucun
   objectif n a de depart manquant — et il ferme la porte pour la
   suite.

   ET LE NOM NE DIT PAS CE QUE C EST. La fonction en aval appelle son
   parametre `createdAt` ; ce qu on lui passe est `start_date`. Les deux
   ne sont pas la meme chose : un objectif peut etre cree en janvier et
   commence en mars.
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
