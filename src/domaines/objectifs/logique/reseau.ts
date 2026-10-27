/* L ECRITURE DU SCEAU — VERSION 2.
 *
 * Les vingt-quatre signes de la v1 etaient des traits : une barre, un
 * mat, une pente, un arc. Dessines un par un, ils ne formaient pas une
 * famille — chacun se lisait seul, aucun n etait parent des autres.
 *
 * Ceux-ci sont ENGENDRES. Une regle unique les produit tous : trois ou
 * quatre noeuds pris sur une couronne de huit places, relies d un
 * trait, parfois refermes. C est la regle qui fait la famille, pas le
 * soin qu on a mis a les dessiner.
 *
 * ILS NE SONT PAS RUNIQUES, et c est voulu. Une rune est une lettre
 * scandinave : elle appartient a quelqu un d autre. Ces signes-ci
 * n appartiennent qu a ce produit.
 *
 * ═══ CE QU ON VOIT, ET CE QU ON AVAIT DESSINE ═══
 *
 * Ils ont ete concus comme des noeuds relies — un graphe, cousin de
 * l anneau de M.I.A. A la taille ou le sceau les rend, une quinzaine
 * de pixels, les noeuds disparaissent : il ne reste que le contour, et
 * l on lit des polygones fermes. C est ce qui a ete retenu, en
 * connaissance de cause. La regle reste celle du graphe ; le rendu est
 * celui d une geometrie.
 */

/** La couronne : huit places, sur laquelle les noeuds se posent. */
const PLACES: readonly (readonly [number, number])[] = [
  [0.2, 0.18], [0.5, 0.12], [0.8, 0.2], [0.86, 0.5],
  [0.8, 0.82], [0.5, 0.9], [0.2, 0.82], [0.14, 0.5],
];

/** Le rayon d un noeud, dans la boite unitaire. */
const RAYON_NOEUD = 0.042;

/**
 * Le melangeur.
 *
 * Les parametres se prennent ICI, pas dans les bits bruts de l indice.
 * Lus directement — « i >> 3 » ne change qu une fois sur huit — ils
 * restent correles et la famille se repete : quatorze signes distincts
 * sur vingt-quatre, mesure. Melanges, ils couvrent l espace.
 */
function melanger(i: number): number {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

const f = (x: number): string => x.toFixed(3);

/**
 * Le signe d indice `i`.
 *
 * LES NOEUDS SE REPARTISSENT sur la couronne, deux places au moins
 * entre eux. Tires librement, trois d entre eux pouvaient tomber
 * presque alignes — un signe haut de huit centiemes dans une boite
 * de un.
 */
export function signeDuReseau(i: number): string {
  const h = melanger(i);
  const noeuds = 3 + (h & 1);
  const pas = noeuds === 3 ? 3 : 2;
  const depart = (h >>> 4) % PLACES.length;

  const pris: (readonly [number, number])[] = [];
  for (let k = 0; k < noeuds; k++) pris.push(PLACES[(depart + k * pas) % PLACES.length]);

  let d = `M${f(pris[0][0])} ${f(pris[0][1])}`;
  for (let k = 1; k < noeuds; k++) d += ` L${f(pris[k][0])} ${f(pris[k][1])}`;
  /* Le circuit se referme une fois sur deux. */
  if ((h >>> 11) & 1) d += ` L${f(pris[0][0])} ${f(pris[0][1])}`;

  /* Les noeuds, en petits cercles traces — deux arcs, parce qu un
     cercle complet ne se fait pas d un seul arc SVG. */
  const r = RAYON_NOEUD;
  for (const [x, y] of pris) {
    d += ` M${f(x + r)} ${f(y)}`
      + ` A${f(r)} ${f(r)} 0 1 1 ${f(x - r)} ${f(y)}`
      + ` A${f(r)} ${f(r)} 0 1 1 ${f(x + r)} ${f(y)}`;
  }
  return d;
}

/**
 * VINGT-QUATRE SIGNES DISTINCTS, GARANTIS.
 *
 * Le melangeur reduit les collisions, il ne les supprime pas : le
 * tirage direct en laissait seize sur vingt-quatre. On parcourt donc
 * l espace du generateur et l on ne retient que les formes qu on n a
 * pas deja vues — sans quoi deux lettres porteraient le meme signe, et
 * le sceau cesserait d identifier.
 *
 * La borne existe pour qu une regle mal ecrite ne tourne pas sans fin.
 */
export function alphabetEngendre(signe: (i: number) => string, combien = 24): string[] {
  const vus = new Set<string>();
  const sortie: string[] = [];
  for (let k = 0; sortie.length < combien && k < 8192; k++) {
    const d = signe(k);
    if (vus.has(d)) continue;
    vus.add(d);
    sortie.push(d);
  }
  return sortie;
}

/** L alphabet de la version 2 : vingt-quatre signes, tous distincts. */
export const ALPHABET_V2: readonly string[] = alphabetEngendre(signeDuReseau);
