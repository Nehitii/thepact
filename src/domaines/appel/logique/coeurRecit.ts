/* LE RECIT ET LA MAIN : LES DEUX MACHINES A ETATS DU RITUEL.
 *
 * Elles ne dessinent rien non plus. Elles disent, image par image, ou
 * en est le recit — quatre seuils, quatre evenements — et ce que la
 * main a laisse derriere elle. Ce sont les seules parties du coeur qui
 * se souviennent d une image a l autre, et donc les seules ou une
 * erreur s accumule au lieu de se voir tout de suite.
 */
import { INCLINAISONS_BASE, NB_ANNEAUX, SEUILS, clamp01, lerp } from "./coeur";

/* ── LE RECIT : QUATRE SEUILS, QUATRE EVENEMENTS ─────────────── */

export interface EtatDuRecit {
  seuilAtteint: number;
  eclatSeuil: number;
  alignement: number;
  scission: number;
  excentrique: number;
  inclinaisons: number[];
}

export function recitNeuf(): EtatDuRecit {
  return {
    seuilAtteint: -1, eclatSeuil: 0, alignement: 0, scission: 0, excentrique: 0,
    inclinaisons: [...INCLINAISONS_BASE],
  };
}

/* UN SEUL SEUIL PAR IMAGE, ET ON PART DU PLUS HAUT.
 *
 * La boucle descend depuis le dernier seuil et s arrete au premier
 * franchi : un bond de 10 % a 95 % en une image pose directement le
 * quatrieme palier, sans jouer les trois premiers. C est voulu — les
 * rejouer ferait quatre eclairs en quatre images.
 *
 * LE RETOUR A ZERO SE FAIT SOUS 2 %, PAS A ZERO. Relacher le doigt
 * ramene l avancement a zero en plusieurs images ; attendre l egalite
 * stricte laisserait le recit arme pendant la descente. */
export const RETOUR_DU_RECIT = 0.02;

export function avancerLeRecit(
  etat: EtatDuRecit,
  p: number,
  dt: number,
  actif: boolean,
): { etat: EtatDuRecit; onde: boolean } {
  const s = { ...etat, inclinaisons: [...etat.inclinaisons] };
  let onde = false;

  if (actif) {
    for (let i = SEUILS.length - 1; i >= 0; i--) {
      if (p >= SEUILS[i] && s.seuilAtteint < i) {
        s.seuilAtteint = i;
        s.eclatSeuil = 1;
        onde = true;
        break;
      }
    }
    if (p < RETOUR_DU_RECIT) s.seuilAtteint = -1;
    s.alignement = clamp01(s.alignement + (s.seuilAtteint >= 0 ? dt * 1.6 : -dt * 3));
    s.scission = s.seuilAtteint >= 1 ? clamp01(s.scission + dt * 1.2) : clamp01(s.scission - dt * 3);
    s.excentrique = s.seuilAtteint >= 2 ? clamp01(s.excentrique + dt * 1.1) : clamp01(s.excentrique - dt * 3);
    for (let i = 0; i < NB_ANNEAUX; i++) {
      s.inclinaisons[i] = lerp(INCLINAISONS_BASE[i], 0.42, s.alignement);
    }
  } else {
    s.seuilAtteint = -1; s.alignement = 0; s.scission = 0; s.excentrique = 0;
    for (let i = 0; i < NB_ANNEAUX; i++) s.inclinaisons[i] = INCLINAISONS_BASE[i];
  }
  /* L eclair du seuil s eteint TOUJOURS, meme recit coupe : sinon il
     resterait fige a un si l option tombait pile apres un seuil. */
  s.eclatSeuil = Math.max(0, s.eclatSeuil - dt * 2.2);
  return { etat: s, onde };
}

/* ── LA MAIN : L APPUI ET LA RUPTURE ─────────────────────────── */

export type EvenementMain = "appui" | "rupture";

export interface EtatDeLaMain {
  impulsion: number;
  purge: number;
  ecarts: number[];
}

export function mainNeuve(): EtatDeLaMain {
  return { impulsion: 0, purge: 0, ecarts: Array.from({ length: NB_ANNEAUX }, () => 0) };
}

/* LES TROIS DECROISSANCES TOURNENT MEME QUAND L OPTION EST COUPEE.
 * Seule la lecture des evenements est conditionnee : ce qui a ete
 * declenche doit pouvoir s eteindre, sinon couper l option en pleine
 * impulsion la figerait pour toujours.
 *
 * Trois vitesses, et l ordre n est pas indifferent : l impulsion
 * s eteint en trois dixiemes, la purge en deux tiers de seconde, la
 * dispersion des anneaux en un peu plus d une seconde — le coup part
 * vite, le desordre qu il laisse met plus longtemps. */
export function avancerLaMain(
  etat: EtatDeLaMain,
  dt: number,
  evenements: EvenementMain[],
  actif: boolean,
  hasard: () => number = Math.random,
): EtatDeLaMain {
  const s = { ...etat, ecarts: [...etat.ecarts] };
  if (actif) {
    for (const e of evenements) {
      if (e === "appui") s.impulsion = 1;
      else if (e === "rupture") {
        s.purge = 1;
        for (let i = 0; i < NB_ANNEAUX; i++) s.ecarts[i] = 0.35 + hasard() * 0.5;
      }
    }
  }
  s.impulsion = Math.max(0, s.impulsion - dt * 3.4);
  s.purge = Math.max(0, s.purge - dt * 1.5);
  for (let i = 0; i < NB_ANNEAUX; i++) s.ecarts[i] = Math.max(0, s.ecarts[i] - dt * 0.9);
  return s;
}
