/* LA TABLE DE MONTAGE.
 *
 * CE QU ELLE REPARE. Chaque calque a ete regle seul, l un apres l autre,
 * et chacun montait avec l avancement. A une seconde de la fin ils
 * etaient donc tous au maximum en meme temps : mesure sur le banc, 0,7 %
 * de l image restait noire a p 0,95, contre 76,5 % au repos. Le moment le
 * plus intense etait le plus plat — a l ecran, l intensite vient du
 * contraste, et plus rien n etait sombre. Avec la table, plus de la
 * moitie de l image reste noire jusqu a la derniere seconde.
 *
 * CE QU ELLE EST. Une partition que les calques LISENT au lieu de decider
 * chacun pour soi. Cinq actes, un par intervalle entre les seuils ; pour
 * chacun, un sujet, et le dosage de ce qui n est pas lui. Les poids
 * multiplient ce que chaque calque aurait peint, ils ne le remplacent
 * pas : table a zero, tout vaut un.
 *
 *   I   · Eveil        le noyau, seul dans le noir
 *   II  · Alignement   les anneaux qui se verrouillent
 *   III · Scission     les deux noyaux, puis leur union
 *   IV  · Decentrage   le systeme qui perd son axe
 *   V   · Critique     le noyau, et la naissance des jets
 *
 * LES REPERES NE DISENT QUE CE QUI CHANGE. Un repere qui ne cite pas un
 * calque garde la valeur du precedent ; deux reperes identiques font un
 * palier ; entre deux reperes, une rampe douce. C est tout le langage —
 * assez pour que la camera et le son, plus tard, lisent la meme table.
 *
 * LE HALO SE RESSERRE AU LIEU DE S ETEINDRE. Baisser le fond partout
 * aurait assombri le noyau avec le reste : c est sa PORTEE qui recule.
 * L aura du noyau aussi, et seulement a la fin : l eclat ne bouge pas, la
 * lumiere se durcit au lieu de s etaler, comme une etoile qui se contracte
 * avant de ceder.
 */
import { doux, lerp } from "./coeur";

export const SUJETS = ["fond", "portee", "aura", "grille", "ondes", "anneaux", "matiere", "plumes"] as const;
export type Sujet = (typeof SUJETS)[number];
export type Dosage = Record<Sujet, number>;

interface Repere {
  p: number;
  poids?: Partial<Dosage>;
}

/* Chaque transition dure trois centiemes d avancement — six dixiemes de
   seconde —, centree sur son seuil. Les actes SONT les intervalles entre
   les seuils : leurs bornes se lisent dans `SEUILS`. */
export const REPERES: Repere[] = [
  /* I · Eveil. Au repos le noyau est deja seul : un etat juste ne bouge
     pas pour faire symetrique. */
  { p: 0 },
  { p: 0.235 },
  /* II · Alignement — les anneaux passent devant ; la matiere et la
     grille reculent pour les laisser se lire. */
  { p: 0.265, poids: { fond: 0.9, portee: 0.6, grille: 0.7, matiere: 0.6 } },
  { p: 0.485 },
  /* III · Scission — pendant la lutte, c est l insert qui commande. Ce
     qui suit est l apres-union : le noyau reunifie reprend la scene et
     les protuberances naissent. */
  { p: 0.515, poids: { fond: 0.85, portee: 0.45, grille: 0.5, ondes: 0.6, anneaux: 0.65, matiere: 0.55, plumes: 0.8 } },
  { p: 0.735 },
  /* IV · Decentrage — le sujet est le SYSTEME : anneaux et matiere
     reviennent, la grille aussi pour que la dechirure se lise. Le halo
     recule d autant : c est lui qui eclaire la plus grande surface. */
  { p: 0.765, poids: { fond: 0.72, portee: 0.3, grille: 0.9, ondes: 0.7, anneaux: 0.95, matiere: 0.9, plumes: 0.72 } },
  { p: 0.885 },
  /* V · Critique — le cadre se vide vers le noyau jusqu au bout : la seule
     rampe qui dure tout un acte. Les protuberances restent : elles sont
     l activite du noyau, donc du sujet. */
  { p: 0.915, poids: { fond: 0.72, portee: 0.26, aura: 0.75, grille: 0.35, ondes: 0.4, anneaux: 0.6, matiere: 0.5, plumes: 0.7 } },
  { p: 1, poids: { fond: 0.6, portee: 0.14, aura: 0.4, grille: 0.12, ondes: 0.15, anneaux: 0.3, matiere: 0.25, plumes: 0.6 } },
];

/* L INSERT DE LA FUSION. Elle a sa propre horloge : elle ne peut pas etre
   calee sur l avancement. Tant qu elle lutte — detonation comprise —
   elle devient le sujet et ETEINT ce qui n est pas elle. Un insert
   n eclaire jamais rien : il ne peut que baisser un poids. */
export const INSERT_DE_LA_FUSION: Partial<Dosage> = {
  grille: 0.35, ondes: 0.35, anneaux: 0.35, matiere: 0.35, plumes: 0.25, portee: 0.4,
};

const unite = (): Dosage =>
  Object.fromEntries(SUJETS.map((k) => [k, 1])) as Dosage;

/* La partition depliee une fois : chaque repere recoit les poids qu il ne
   cite pas, herites du precedent. */
export const PARTITION: { p: number; poids: Dosage }[] = (() => {
  let courant = unite();
  return REPERES.map((r) => {
    courant = { ...courant, ...r.poids };
    return { p: r.p, poids: courant };
  });
})();

export const dosageNeuf = unite;

/* Ecrit le dosage de l avancement `p` dans `dosage` — un seul objet,
   reecrit a chaque image. `force` a zero rend la table muette (l astre
   d apres est hors partition : c est un epilogue, il a deja son calme) ;
   `focus` mesure a quel point la fusion commande. */
export function lireLeMontage(dosage: Dosage, p: number, force: number, focus: number): void {
  let i = 0;
  while (i < PARTITION.length - 1 && PARTITION[i + 1].p <= p) i++;
  const a = PARTITION[i];
  const b = PARTITION[Math.min(i + 1, PARTITION.length - 1)];
  const t = b.p > a.p ? doux(a.p, b.p, p) : 0;
  for (const k of SUJETS) {
    let v = lerp(a.poids[k], b.poids[k], t);
    const insert = INSERT_DE_LA_FUSION[k];
    if (insert !== undefined) v = Math.min(v, lerp(v, insert, focus));
    dosage[k] = lerp(1, v, force);
  }
}

/* L insert suit la lutte avec un temps de reponse d un quart de seconde :
   assez pour ne pas claquer, assez court pour ne pas arriver apres
   l evenement. */
export const REPONSE_DE_L_INSERT = 0.22;

export function suivreLeFocus(focus: number, luttant: boolean, dt: number): number {
  return focus + ((luttant ? 1 : 0) - focus) * (1 - Math.exp(-dt / REPONSE_DE_L_INSERT));
}
