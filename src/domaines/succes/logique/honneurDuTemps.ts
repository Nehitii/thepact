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

export function dureeEnHeures(depuis: string, jusqua: string): number {
  return (new Date(jusqua).getTime() - new Date(depuis).getTime()) / MS_PAR_HEURE;
}

/* L ORDRE DE LA LISTE EST L ORDRE DES DEBLOCAGES. Il etait celui des
   quatre `if` ; le changer changerait l ordre des notifications. */
export function honneursDuTemps(difficulte: string, heures: number): string[] {
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
   date de depart est donc traite comme commencant a l instant meme ou
   on l acheve. La duree vaut alors ZERO, et zero passe SOUS LES QUATRE
   SEUILS d un coup — « echo_breaker » toujours, et les trois autres si
   la difficulte s y prete.

   CE REPLI EST AUJOURD HUI DOMINE PAR LA BASE. Releve le 30/08/2026 sur
   le compte : 38 objectifs, AUCUN sans date de depart, et la colonne
   `goals.start_date` porte une valeur par defaut. Le repli ne se
   declenche donc jamais.

   CE QUI LE RENDRAIT VIVANT : la colonne reste NULLABLE. Une insertion
   qui pose explicitement `start_date: null` — un import, une migration,
   un outil de M.I.A — donnerait ses quatre distinctions au premier
   achevement venu.

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
  depuis: string;
  jusqua: string;
}

/** La difficulte manquante vaut « medium », comme partout ailleurs. */
export const DIFFICULTE_PAR_DEFAUT = "medium";

/* UNE SEULE LECTURE D HORLOGE. L appelant en faisait deux, a la suite,
   pour le depart de secours et pour l achevement — deux sources pour un
   seul instant, et un ecart possible d une milliseconde entre le debut
   et la fin d une duree censee etre nulle. */
export function mesureDeLHonneur(but: ButAHonorer, maintenant: Date): MesureDeLHonneur {
  const instant = maintenant.toISOString();
  return {
    difficulte: but.difficulty ?? DIFFICULTE_PAR_DEFAUT,
    depuis: but.start_date || instant,
    jusqua: instant,
  };
}
