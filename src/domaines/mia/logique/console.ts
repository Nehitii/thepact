/* LES MESURES DE LA CONSOLE.
 *
 * Une largeur qu on tire a la main, une hauteur de champ qui suit le
 * texte, un pourcentage ecrete, un titre coupe, et une regle de
 * pluriel ecrite cinq fois. Rien de spectaculaire — mais chacune de
 * ces valeurs finit dans un style en ligne ou dans une phrase, et
 * une borne fausse ne se voit qu a l usage.
 */

/* ── LA LARGEUR DE LA CONSOLE ────────────────────────────────── */

export const LARGEUR_DEFAUT = 560;
export const LARGEUR_MIN = 380;
export const LARGEUR_MAX = 900;

/* LA POIGNEE EST A GAUCHE, LA CONSOLE A DROITE : la largeur est donc
   la distance du pointeur au BORD DROIT de la fenetre. Tirer vers la
   gauche elargit. */
export function largeurDepuisLePointeur(largeurFenetre: number, x: number): number {
  return Math.min(LARGEUR_MAX, Math.max(LARGEUR_MIN, largeurFenetre - x));
}

/* UNE LARGEUR RETENUE HORS BORNES EST OUBLIEE, PAS ECRETEE.
 *
 * C est deliberement different de la poignee : une valeur ecrite sur
 * un ecran large — mille deux cents pixels — n a pas de sens sur un
 * ecran etroit, et l ECRETER a neuf cents donnerait une console qui
 * mange tout. Retomber sur la largeur par defaut vaut mieux que
 * garder une trace d un autre ecran.
 *
 * Number(null) et Number("") valent ZERO, qui echoue le minimum : une
 * preference absente retombe donc sur le defaut sans test special. */
export function largeurRetenue(brut: string | null): number {
  const v = Number(brut);
  return Number.isFinite(v) && v >= LARGEUR_MIN && v <= LARGEUR_MAX ? v : LARGEUR_DEFAUT;
}

/* ── LA HAUTEUR DU CHAMP DE SAISIE ───────────────────────────── */

/** Environ sept lignes : au-dela, le champ defile. */
export const HAUTEUR_MAX_DU_CHAMP = 168;

export interface HauteurDuChamp {
  hauteur: number;
  /** Le texte deborde : le champ porte une marque et defile. */
  plein: boolean;
}

/* LE PLAFOND SERT DEUX FOIS, ET LES DEUX COMPARAISONS NE SONT PAS LA
   MEME : la hauteur posee est le MINIMUM des deux, tandis que la
   marque de debordement se decide sur une comparaison STRICTE. A
   exactement cent soixante-huit pixels, le champ est plein sans etre
   marque — c est voulu : il n a pas encore de quoi defiler. */
export function hauteurDuChamp(hauteurDuTexte: number): HauteurDuChamp {
  return {
    hauteur: Math.min(HAUTEUR_MAX_DU_CHAMP, hauteurDuTexte),
    plein: hauteurDuTexte > HAUTEUR_MAX_DU_CHAMP,
  };
}

/* ── CE QUI S AFFICHE SUR SON VISAGE ─────────────────────────── */

/* LA PART ECOULEE DU PACTE, ECRETEE AUX DEUX BOUTS. Elle vient d un
   calcul de dates : un pacte dont la fin est passee donne plus de
   cent, et un pacte qui commence demain donne moins de zero. Les deux
   dessineraient un anneau faux. */
export function partEcoulee(pct: number | null | undefined): number {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return 0;
  return Math.min(100, Math.max(0, pct));
}

/* LE PLURIEL FRANCAIS PREND UN « S » A PARTIR DE DEUX, pas a partir
   de deux exclus ni des un : « 0 etape », « 1 etape », « 2 etapes ».
   La regle etait ecrite CINQ fois dans le fichier, a chaque fois sous
   la forme `${n > 1 ? "s" : ""}`. */
export function pluriel(n: number): string {
  return n > 1 ? "s" : "";
}

/** « 3 étapes », « 1 tâche » — le nombre et son mot accorde. */
export function accorde(n: number, mot: string): string {
  return `${n} ${mot}${pluriel(n)}`;
}

/* ── LE TITRE D UN FIL ───────────────────────────────────────── */

/* SOIXANTE CARACTERES DU PREMIER MESSAGE. Le fil n a pas d autre nom
   tant qu on ne l a pas renomme : couper trop court rendrait deux
   conversations voisines indistinguables dans la liste. */
export const TITRE_MAX = 60;

export function titreDuFil(premierMessage: string): string {
  return premierMessage.slice(0, TITRE_MAX);
}
