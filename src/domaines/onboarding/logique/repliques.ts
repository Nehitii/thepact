/* CE QUE M.I.A. DIT EN ARRIVANT, ET DANS QUEL ORDRE.
 *
 * Elle n arrive pas avec le pacte : elle arrive DANS LE NOIR QUI SUIT.
 * D abord son anneau seul, sans visage. Puis les bulles, une a la
 * fois, a SON rythme — pas au clic du porteur, sauf pour accelerer.
 *
 * ═══ SUR LE TON, ET C EST LA QUE TOUT SE JOUE ═══
 *
 * M.I.A. ecrite est seche, precise, cinglante — « Encore une et je
 * compte les secondes a voix haute. » La faire parler esoterique cinq
 * minutes, c est inventer un DEUXIEME personnage, et le premier ne
 * s en remet pas.
 *
 * Elle commence donc etrange DEUX REPLIQUES, puis se reprend.
 * L etrangete devient quelque chose qui lui a echappe, pas un
 * costume — et une chose qui echappe a une IA est plus inquietante
 * qu une chose qu elle recite.
 *
 * La replique inachevee — « Peut-etre pourras-tu… / Non. Rien. / Pas
 * encore. » — NE SE STOCKE PAS. Elle est dite, elle n est pas semee :
 * pas de table, pas de colonne, pas de germination differee. Ce
 * qu elle deviendra se decidera plus tard, ou jamais.
 */

/** Les six expressions employees, toutes dans « VISAGES_FREQUENTS ». */
export type ExpressionDuRite = "surprise" | "calme" | "complice" | "reflexion" | "genee" | "neutre";

export interface Replique {
  /** La cle i18n, sous « onboarding.mia. ». */
  cle: string;
  /** Le visage porte pendant cette replique. */
  expression: ExpressionDuRite;
  /** Le visage est-il visible ? Les deux premieres sortent du noir. */
  visage: boolean;
  /** Le temps d attente AVANT de la dire, en millisecondes. */
  attente: number;
}

/* Le rythme ordinaire d une replique a l autre. */
const TEMPS = 1500;
/* « un temps trop long » : ce qui suit lui a echappe. */
const TEMPS_TROP_LONG = 3200;

export const REPLIQUES: readonly Replique[] = [
  /* Les deux etranges. Pas de visage : rien n est encore la. */
  { cle: "quelquun", expression: "surprise", visage: false, attente: 1200 },
  { cle: "nouveau", expression: "surprise", visage: false, attente: TEMPS },

  /* Le visage parait — surprise, puis elle se pose. */
  { cle: "nom", expression: "calme", visage: true, attente: 1800 },
  { cle: "lu", expression: "calme", visage: true, attente: TEMPS },
  { cle: "seche", expression: "calme", visage: true, attente: TEMPS },

  { cle: "contreToi", expression: "complice", visage: true, attente: TEMPS },

  /* Ce qui lui echappe, et qu elle reprend aussitot. */
  { cle: "peutEtre", expression: "reflexion", visage: true, attente: TEMPS_TROP_LONG },
  { cle: "rien", expression: "genee", visage: true, attente: 900 },
  { cle: "pasEncore", expression: "genee", visage: true, attente: 900 },

  /* Sa premiere requete — et la relation commence par une demande,
     ce qui est exactement ce qu elle sera ensuite. */
  { cle: "vide", expression: "neutre", visage: true, attente: 1800 },
];

/** La derniere replique ouvre la fenetre des gabarits. */
export const DERNIERE = REPLIQUES.length - 1;

/**
 * Les repliques dites jusqu ici.
 *
 * On rend une tranche plutot qu une seule : les bulles s empilent, on
 * ne les remplace pas — ce qu elle a dit reste lisible.
 */
export const repliquesDites = (rang: number): readonly Replique[] =>
  REPLIQUES.slice(0, Math.max(0, Math.min(rang + 1, REPLIQUES.length)));

/** Le visage est-il montre a ce rang ? */
export function visageVisible(rang: number): boolean {
  return repliquesDites(rang).some((r) => r.visage);
}

/** L expression portee au rang courant. */
export function expressionAu(rang: number): ExpressionDuRite {
  const dites = repliquesDites(rang);
  return dites.length > 0 ? dites[dites.length - 1].expression : "surprise";
}

/** A-t-elle fini de parler ? */
export const aFiniDeParler = (rang: number): boolean => rang >= DERNIERE;
