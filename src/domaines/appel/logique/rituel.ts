/* LE MOTEUR DU RITUEL : ce que vingt secondes d appui produisent.
 *
 * Un avancement de zero a un, une teinte qui en decoule, un palier
 * que React observe, et deux textes. Tout etait pose au milieu d une
 * page de huit cents lignes dont trois cents de style en ligne.
 */

/** Vingt secondes d appui, en millisecondes. */
export const DUREE = 20000;

/* LA RAMPE DE COULEUR, ET SES DEUX CASSURES.
 *
 * Froid vers chaud sur la premiere moitie, chaud vers magenta
 * jusqu a 85 %, magenta vers blanc sur la fin. Les deux cassures ne
 * sont pas decoratives : la derniere, tres courte, est ce qui fait
 * que la fin se voit venir. */
export const FROID = [6, 182, 212] as const;
export const CHAUD = [139, 92, 246] as const;
export const MAGENTA = [255, 0, 255] as const;
export const BLANC = [255, 255, 255] as const;
export const CASSURE_CHAUDE = 0.5;
export const CASSURE_BLANCHE = 0.85;

export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

export const melange = (a: readonly number[], b: readonly number[], t: number) =>
  `rgb(${Math.round(lerp(a[0], b[0], t))}, ${Math.round(lerp(a[1], b[1], t))}, ${Math.round(lerp(a[2], b[2], t))})`;

export function teinteDe(p: number): string {
  if (p < CASSURE_CHAUDE) return melange(FROID, CHAUD, p / CASSURE_CHAUDE);
  if (p < CASSURE_BLANCHE) {
    return melange(CHAUD, MAGENTA, (p - CASSURE_CHAUDE) / (CASSURE_BLANCHE - CASSURE_CHAUDE));
  }
  return melange(MAGENTA, BLANC, (p - CASSURE_BLANCHE) / (1 - CASSURE_BLANCHE));
}

/* L AVANCEMENT SE BORNE AUX DEUX BOUTS.
 *
 * Sans la borne haute, garder le doigt une image de trop apres la fin
 * donnerait un avancement superieur a un — et une teinte hors rampe.
 * Sans la borne basse, une horloge qui recule (changement d heure,
 * mise en veille) donnerait un avancement negatif. */
export function avancementDuRituel(
  maintenant: number,
  depart: number,
  vitesse: number,
  duree = DUREE,
): number {
  return clamp(((maintenant - depart) * vitesse) / duree, 0, 1);
}

export type PalierDuRituel = "attente" | "montee" | "critique";

/* REACT NE VOIT QUE LES PALIERS : trois rendus au lieu de mille deux
   cents. La toile, elle, lit l avancement image par image. */
export function palierDe(p: number): PalierDuRituel {
  if (p >= CASSURE_BLANCHE) return "critique";
  return p > 0 ? "montee" : "attente";
}

/* LE COMPTE A REBOURS SE DEDUIT DE LA DUREE.
 *
 * Il etait ecrit « 20 - p * 20 », avec un vingt en dur a cote d une
 * constante DUREE valant vingt mille. Changer la duree du rituel
 * aurait laisse le compte a rebours annoncer vingt secondes pour un
 * appui qui en dure trente : un nombre faux, et plausible. */
export function resteEnSecondes(p: number, duree = DUREE): string {
  const secondes = duree / 1000;
  return `${(secondes - p * secondes).toFixed(1)}s`;
}

/** La charge affichee, en pourcent entier. */
export function chargeEnPourcent(p: number): string {
  return `${Math.round(p * 100)}%`;
}
