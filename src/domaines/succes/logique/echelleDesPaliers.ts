import type { Rank } from "@/domaines/succes/types";

/* L ECHELLE DES PALIERS.
 *
 * ═══ POURQUOI UNE SEULE REPRESENTATION ═══
 *
 * Le panneau des rangs en montrait TROIS de la meme chose : une carte
 * du palier courant, une « ligne d XP » decoupee en segments, et une
 * liste de lignes a pastille carree. Trois dessins pour un seul fait —
 * ou l on en est —, et c est cela qui le rendait illisible, pas son
 * style.
 *
 * Une echelle en tient lieu. Les paliers y sont ranges par seuil, la
 * position courante est MARQUEE DESSUS au lieu d etre repetee dans une
 * carte separee, et l ecart au palier precedent se lit entre deux
 * barreaux.
 *
 * ═══ LE PLAFOND EST LE HAUT DE L ECHELLE ═══
 *
 * `totalMaxXP` est l XP que les objectifs du pacte peuvent rapporter en
 * tout. Un palier pose au-dessus n est pas une erreur de saisie a
 * refuser : c est un barreau qu on ne peut pas atteindre, et cela se
 * VOIT sur l echelle. L editeur le signalait apres coup, par une
 * notification, une fois la validation faite — on apprenait son erreur
 * apres l avoir commise.
 *
 * Tout est calcule ici, sans React : c est ce qui permet de le tester,
 * et de montrer un palier glisser a sa place PENDANT qu on tape son
 * seuil, sans dupliquer la regle dans l editeur.
 */

export interface BarreauDeLEchelle {
  palier: Rank;
  /** L ecart au palier precedent, en XP. `null` pour le premier. */
  ecart: number | null;
  /** Le seuil est franchi. */
  atteint: boolean;
  /** C est le palier ou l on se tient. */
  courant: boolean;
  /** Le seuil depasse ce que les objectifs peuvent rapporter. */
  horsDePortee: boolean;
  /** Avancement DANS ce barreau, de 0 a 100 — 0 s il n est pas entame. */
  avancement: number;
}

export interface Echelle {
  /** Du plus haut seuil au plus bas : une echelle se lit en montant. */
  barreaux: BarreauDeLEchelle[];
  /** Le palier ou l on se tient, ou `null` avant le premier seuil. */
  courant: Rank | null;
  /** Combien de barreaux sont hors de portee. */
  horsDePortee: number;
}

/**
 * Construit l echelle.
 *
 * `paliers` arrive trie par seuil croissant — c est ce que rend
 * `useRankXP` —, mais on le retrie ici : l ordre est la SEULE chose qui
 * donne son sens a l echelle, et le supposer serait le perdre le jour
 * ou un appelant l oublie. Pendant la frappe d un seuil, notamment, la
 * liste passee n est plus celle de la base.
 */
export function construireLEchelle(
  paliers: Rank[],
  currentXP: number,
  totalMaxXP: number,
): Echelle {
  const tries = [...paliers].sort((a, b) => a.min_points - b.min_points);

  /* Le palier courant est le DERNIER dont le seuil est franchi. La
     boucle de `useRankXP` s arrete au premier seuil non atteint, ce qui
     revient au meme sur une liste triee — et cette fonction, elle, ne
     depend pas de l ordre recu. */
  let courant: Rank | null = null;
  for (const p of tries) if (currentXP >= p.min_points) courant = p;

  const barreaux = tries.map((palier, i): BarreauDeLEchelle => {
    const precedent = i > 0 ? tries[i - 1] : null;
    const suivant = tries[i + 1] ?? null;
    const bas = palier.min_points;
    /* Le haut du barreau est le seuil suivant ; au dernier, c est le
       plafond — a defaut, le seuil lui-meme, et le barreau est plein
       des qu on y entre. */
    const haut = suivant ? suivant.min_points : Math.max(totalMaxXP, bas);
    const largeur = haut - bas;
    const dedans = Math.min(Math.max(currentXP - bas, 0), Math.max(largeur, 0));
    return {
      palier,
      ecart: precedent ? palier.min_points - precedent.min_points : null,
      atteint: currentXP >= bas,
      courant: courant?.id === palier.id,
      /* Un plafond a zero ne dit rien : aucun objectif n est encore
         pose, et rien n est donc hors de portee. */
      horsDePortee: totalMaxXP > 0 && bas > totalMaxXP,
      avancement: largeur > 0 ? Math.min(100, (dedans / largeur) * 100) : (currentXP >= bas ? 100 : 0),
    };
  });

  return {
    barreaux: barreaux.reverse(),
    courant,
    horsDePortee: barreaux.filter((b) => b.horsDePortee).length,
  };
}

/**
 * Ce qui cloche dans un seuil, pendant qu on le tape.
 *
 * Rend `null` quand il n y a rien a dire. LES DEUX FAUTES SE SIGNALENT
 * SOUS LE CHAMP, PAS APRES VALIDATION : l editeur refusait le seuil par
 * une notification une fois le formulaire envoye, c est-a-dire qu il
 * laissait commettre l erreur avant de la nommer.
 */
export type FauteDeSeuil =
  | { quoi: "occupe"; parQui: string }
  | { quoi: "au-dessus-du-plafond"; plafond: number };

export function fauteDuSeuil(
  seuil: number,
  idDuPalier: string,
  paliers: Rank[],
  totalMaxXP: number,
): FauteDeSeuil | null {
  const occupant = paliers.find((p) => p.id !== idDuPalier && p.min_points === seuil);
  if (occupant) return { quoi: "occupe", parQui: occupant.name };
  if (totalMaxXP > 0 && seuil > totalMaxXP) return { quoi: "au-dessus-du-plafond", plafond: totalMaxXP };
  return null;
}
