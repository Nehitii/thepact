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

/* ═══════════════════════════════════════════════════════════════
   DEUX DUREES, PAS UNE — ET C EST LA BASE QUI LE DIT.

   Les trois premieres distinctions parlent du TEMPS MIS : « franchir
   un objectif extreme en 48 heures » se compte depuis son depart.

   « Briseur d echo » ne dit pas cela. Sa definition, mot pour mot
   dans `achievement_definitions` : « Franchissez un objectif dans
   les 3 minutes suivant SA CREATION ». Ce n est pas une duree de
   travail, c est une signature : creer et franchir d un seul geste.

   Les deux instants ne sont pas le meme. Un objectif peut etre cree
   en janvier et commence en mars — la colonne `start_date` se
   choisit a la main, `created_at` non.

   MESURE LE 30/08/2026, sur les 14 objectifs honores du compte :
   depuis le depart, AUCUN ne passait sous les trois minutes ; depuis
   la creation, DIX y passent. La distinction n etait pas dure a
   obtenir, elle etait mesuree sur la mauvaise horloge.

   L ORDRE DE LA LISTE EST L ORDRE DES DEBLOCAGES. Il etait celui des
   quatre `if` ; le changer changerait l ordre des notifications.
   ═══════════════════════════════════════════════════════════════ */
export function honneursDuTemps(
  difficulte: string,
  heuresDepuisLeDepart: number | null,
  heuresDepuisLaCreation: number | null,
): string[] {
  const gagnes: string[] = [];
  /* CE QUI NE SE MESURE PAS NE SE GAGNE PAS — et les deux horloges
     se taisent separement : un depart manquant n empeche pas la
     signature, une creation manquante n empeche pas le reste. */
  if (heuresDepuisLeDepart !== null) {
    if (difficulte === "impossible" && heuresDepuisLeDepart / 24 < JOURS_HORS_DU_TEMPS) gagnes.push("cut_through_time");
    if (difficulte === "extreme" && heuresDepuisLeDepart < HEURES_CHEMIN_COURBE) gagnes.push("warping_path");
    if (difficulte === "extreme" && heuresDepuisLeDepart < HEURES_SANG_RESOLU) gagnes.push("blood_of_resolve");
  }
  /* ═══ UN ECART NEGATIF PASSE ENCORE ═══
     Un objectif achevé AVANT d avoir ete cree n est pas une
     performance de trois minutes ; c est une ligne retrodatee. La
     comparaison ne le distingue pas de zero.

     MESURE : sur les 14 objectifs honores, UN porte un achevement
     anterieur a sa creation — de 3 161 heures. Constate, non
     corrige : exiger un ecart positif est une seconde decision. */
  if (heuresDepuisLaCreation !== null && heuresDepuisLaCreation < HEURES_ECHO) gagnes.push("echo_breaker");
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
  /* L instant ou la LIGNE a ete ecrite, que personne ne choisit. */
  created_at?: string | null;
}

export interface MesureDeLHonneur {
  difficulte: string;
  /** `null` quand l objectif n a pas de date de depart. */
  depuis: string | null;
  /** `null` quand la ligne ne porte pas sa date d ecriture. */
  cree: string | null;
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
    /* Le OU logique, et non `??` : une date vide vaut une date
       absente. Les deux se lisent pareil. */
    depuis: but.start_date || null,
    cree: but.created_at || null,
    jusqua: maintenant.toISOString(),
  };
}
