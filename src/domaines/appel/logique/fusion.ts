/* LA FUSION DIFFICILE, ET LE SCRIPT COULEUR DE LA SCISSION (acte III).
 *
 * CE QUE FAISAIT LE COEUR. La separation des lobes valait
 * `sin(scission · pi)` : une bosse parfaitement symetrique. Les deux
 * noyaux s ecartaient, atteignaient leur maximum a mi-course, et
 * revenaient par exactement le meme chemin. La refusion n etait pas un
 * evenement — c etait la separation lue a l envers.
 *
 * CE QU ON MET A LA PLACE. L ecart s ouvre vite, puis se referme en
 * LUTTANT : il approche, se fait repousser, approche de nouveau, plus pres
 * a chaque fois. Et la puissance suit la proximite PONDEREE PAR
 * L AVANCEMENT — un frolement precoce ne donne presque rien, le meme
 * frolement tard donne beaucoup. C est ce produit, et lui seul, qui fait
 * que plus ca refusionne, plus ca s accentue.
 *
 * L HORLOGE EST A ELLE. Elle demarre quand le recit ouvre la scission, et
 * n en depend plus ensuite : faire durer la fusion en ralentissant
 * `scission` aurait touche la machine a etats du recit.
 *
 * Ce module ne dessine rien : la toile lit l ecart, la puissance et
 * l instant de l union.
 */
import { TAU, doux, lerp, teinte, type Couleur } from "./coeur";
import { graine } from "./espace";

export const DUREE_DE_LA_FUSION = 2600;
/** Ils partent vite : la separation n est pas ce qui coute. */
export const PART_DE_L_OUVERTURE = 0.16;
/* TROIS ASSAUTS, PAS UN. Ils approchent a 0,51, sont rejetes jusqu au
   maximum, reviennent a 0,27, sont repousses plus mollement, puis se
   recollent. Chaque assaut va plus loin que le precedent : c est ce
   qu on lit comme une resistance qui cede. */
export const LUTTE = 0.44;
export const ASSAUTS = 4.4;
export const DECROISSANCE = 0.9;
/** Le temps que le triomphe met a retomber, en secondes. */
export const APRES_L_UNION = 0.9;
/** L ecart maximal des deux noyaux, en part du rayon de base. */
export const ECARTEMENT = 0.34;
export const DUREE_DE_LA_DETONATION = 1150;

export interface CourbeDeLaFusion {
  u: number;
  ecart: number;
  puissance: number;
}

/** La lutte, `ecoule` millisecondes apres l ouverture de la scission. */
export function courbeDeLaFusion(ecoule: number): CourbeDeLaFusion {
  const u = Math.max(0, Math.min(1, ecoule / DUREE_DE_LA_FUSION));
  let ecart: number, puissance = 0;
  if (u < PART_DE_L_OUVERTURE) {
    ecart = doux(0, 1, u / PART_DE_L_OUVERTURE);
  } else {
    const v = (u - PART_DE_L_OUVERTURE) / (1 - PART_DE_L_OUVERTURE);
    /* L enveloppe descend, l oscillation la fait bafouiller. En negatif,
       le premier mouvement apres l ouverture est une tentative de
       fermeture : ils essaient d abord, et c est l echec qui les rejette. */
    ecart = Math.max(0, Math.pow(1 - v, DECROISSANCE) * (1 - LUTTE * Math.sin(v * Math.PI * ASSAUTS)));
    puissance = (1 - Math.min(1, ecart)) * doux(0, 1, v);
  }
  /* APRES L UNION, LA PUISSANCE RETOMBE — et c est indispensable : sans ce
     retour, le coeur garderait le surcroit d eclat gagne en se recollant
     pendant les dix secondes suivantes, et le seul instant qui devait
     compter cesserait de se distinguer. */
  const depuisLUnion = (ecoule - DUREE_DE_LA_FUSION) / 1000;
  if (depuisLUnion > 0) {
    ecart = 0;
    puissance = Math.max(0, 1 - depuisLUnion / APRES_L_UNION);
  }
  return { u, ecart, puissance };
}

export interface HorlogeDeLaFusion {
  depart: number;
  unionFaite: boolean;
  /** L instant de l union, sur l horloge de la toile ; -1 hors detonation. */
  debutDeLUnion: number;
}

export function horlogeDeLaFusionNeuve(): HorlogeDeLaFusion {
  return { depart: -1, unionFaite: false, debutDeLUnion: -1 };
}

export interface EtatDeLaFusion extends CourbeDeLaFusion {
  union: boolean;
  /** L avancement de la detonation, de zero a un. */
  tDeLUnion: number;
  /** Vrai tant que la fusion commande la table de montage. */
  luttant: boolean;
}

/* L union ne se produit qu une fois par scission : sans ce verrou,
   l horloge restant au bout, la detonation repartirait a chaque image. */
export function avancerLaFusion(h: HorlogeDeLaFusion, scission: number, maintenant: number): EtatDeLaFusion {
  if (scission > 0.001) {
    if (h.depart < 0) h.depart = maintenant;
  } else {
    h.depart = -1;
    h.unionFaite = false;
    h.debutDeLUnion = -1;
  }
  const courbe = h.depart >= 0 ? courbeDeLaFusion(maintenant - h.depart) : { u: 0, ecart: 0, puissance: 0 };
  if (h.depart >= 0 && courbe.u >= 1 && !h.unionFaite) {
    h.unionFaite = true;
    h.debutDeLUnion = maintenant;
  }
  let union = false, tDeLUnion = 0;
  if (h.debutDeLUnion >= 0) {
    const t = (maintenant - h.debutDeLUnion) / DUREE_DE_LA_DETONATION;
    if (t >= 1) h.debutDeLUnion = -1;
    else { union = true; tDeLUnion = t; }
  }
  return { ...courbe, union, tDeLUnion, luttant: h.depart >= 0 && (courbe.u < 1 || union) };
}

/* LES RAYONS DE L UNION. La promesse — des traits qui convergent vers le
   col — et la radiation de la detonation partagent les memes directions,
   tirees une fois : c est ce qui fait que la lumiere repart par ou la
   matiere est arrivee. */
export const RAYONS_DE_L_UNION = 34;

export const RAYONS: { angle: number; portee: number; epais: boolean }[] = (() => {
  const alea = graine(310577);
  return Array.from({ length: RAYONS_DE_L_UNION }, (_, i) => ({
    angle: (i / RAYONS_DE_L_UNION) * TAU + (alea() - 0.5) * 0.16,
    portee: 0.3 + alea() * 1.05,
    epais: alea() < 0.3,
  }));
})();

/* ── LE SCRIPT COULEUR ─────────────────────────────────────────
 *
 * A dix secondes la teinte du coeur est le violet — pile entre le cyan du
 * depart et le magenta de la fin. Le coeur qui se divise se divise donc
 * en ses deux couleurs : a gauche celle d ou il vient, a droite celle ou
 * il va. Et leur union fait le blanc — en fusion additive, cyan et
 * magenta superposes, la toile le rend d elle-meme. Le blanc de l union
 * annonce le blanc de la fin.
 *
 * LA PURETE SUIT L ECART. Pleine quand les noyaux sont au large, nulle
 * quand ils se touchent : les couleurs se melent a chaque approche et se
 * separent a chaque rejet. C est la couleur qui raconte la resistance. */
export const CYAN_DU_DEPART = teinte(0);
export const MAGENTA_DE_LA_FIN = teinte(0.85);

/** `ecartRelatif` : la separation rapportee au rayon du coeur. */
export function pureteDuScript(ecartRelatif: number, deuxLobes: boolean): number {
  return deuxLobes ? doux(0.03, 0.2, ecartRelatif) : 0;
}

/** Cote negatif, le depart ; positif, la fin ; zero, le coeur tel quel. */
export function teinteDuLobe(c: Couleur, cote: number, purete: number): Couleur {
  if (purete <= 0 || cote === 0) return c;
  const vers = cote < 0 ? CYAN_DU_DEPART : MAGENTA_DE_LA_FIN;
  return [lerp(c[0], vers[0], purete), lerp(c[1], vers[1], purete), lerp(c[2], vers[2], purete)];
}
