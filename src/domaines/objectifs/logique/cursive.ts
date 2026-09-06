/* L ECRITURE DU POURTOUR — une cursive, pas une geometrie.
 *
 * ═══ CE QU ELLE REMPLACE, ET POURQUOI ═══
 *
 * L inscription du cercle portait les signes du reseau : des polygones
 * fermes, poses a plat. Un cercle arcanique ne porte pas des figures
 * sur son pourtour, il porte du TEXTE — des lettres liees, debout vers
 * l exterieur, qu on ne lit pas mais qu on reconnait comme de
 * l ecriture. C est cette texture qui manquait, et sans elle la figure
 * lisait « rouage » plutot que « sceau ».
 *
 * ═══ CE QUI FAIT QU UN TRAIT EST UNE LETTRE ═══
 *
 * Le premier croquis ondulait au hasard et se lisait « gribouillis ».
 * Il lui manquait la seule chose qui distingue une ecriture d un
 * griffonnage : une REGLURE.
 *
 *   la ligne de base    a 0,62. Tout retombe dessus.
 *   l oeil              de 0,34 a 0,62. C est la hauteur commune, et
 *                       elle ne varie pas d une lettre a l autre.
 *   les hampes          montent a 0,10, les jambages descendent a
 *                       0,92 — au plus une par lettre, sinon la ligne
 *                       se hache.
 *
 * Trois lettres cote a cote partagent donc leur ligne et leur hauteur :
 * c est ce qui fait courir le mot. Le reste — le nombre de boucles, le
 * sens du crochet final, le point en l air — varie et fait la lettre.
 *
 * ═══ ELLE EST ILLISIBLE, ET C EST JUSTE ═══
 *
 * Sur le pourtour, une lettre fait neuf pixels. Aucune ne se lit, et
 * aucune n a a se lire : ce qu on doit reconnaitre, c est qu il y a la
 * une langue. Les references font exactement cela. La contrainte n est
 * donc pas la lisibilite mais la TEXTURE — une ligne reguliere, une
 * densite egale, pas de trou ni de paquet.
 */

const f = (x: number): string => x.toFixed(3);

/** La reglure. Tout le reste s y accroche. */
const BASE = 0.62;
const OEIL = 0.34;
const HAMPE = 0.10;
const JAMBAGE = 0.92;
/** Les marges : une lettre ne touche pas ses voisines. */
const GAUCHE = 0.1;
const DROITE = 0.9;

/**
 * Le melangeur.
 *
 * Un troisieme flot, distinct de celui du reseau et de celui des
 * ideogrammes : les trois ecritures se croisent sur le meme sceau, et
 * des indices correles feraient se repondre des formes sans raison.
 */
function melanger(i: number): number {
  let h = Math.imul(i ^ 0x6a09e667, 0xbb67ae85) >>> 0;
  h ^= h >>> 14;
  h = Math.imul(h, 0x3c6ef372) >>> 0;
  return (h ^ (h >>> 12)) >>> 0;
}

/**
 * La lettre d indice `i`.
 *
 * Elle part de la ligne de base a gauche, fait deux ou trois boucles
 * dans l oeil, et sort par un crochet. Une hampe ou un jambage au plus,
 * un point en l air au plus.
 */
export function lettre(i: number): string {
  const h = melanger(i);
  const boucles = 2 + (h & 1);
  const large = (DROITE - GAUCHE) / boucles;

  /* UNE HAMPE OU UN JAMBAGE, JAMAIS LES DEUX, et il se decide EN
     PREMIER parce que tout le reste s y plie. Une lettre qui monte et
     descend a la fois mange les deux lignes voisines ; sur un pourtour
     large de 0,1 unite, elle mord sur le filet et sur la piste. */
  const traverse = (h >>> 14) & 3;
  const monte = traverse === 1;
  const descend = traverse === 2;

  let d = `M${f(GAUCHE)} ${f(BASE)}`;
  let x = GAUCHE;

  for (let k = 0; k < boucles; k++) {
    const bits = (h >>> (2 + k * 3)) & 7;
    /* Une boucle monte dans l oeil, ou descend sous la ligne. Les deux
       reviennent SUR la ligne : c est ce qui fait courir le mot.
       Sous une hampe, aucune ne descend — sinon la lettre traverse la
       reglure de part en part. */
    const sous = (bits & 1) === 1 && k > 0 && !monte;
    /* LA PREMIERE BOUCLE ATTEINT L OEIL EXACTEMENT. Laissees libres,
       elles s arretaient parfois a 0,43 : la lettre ne faisait plus que
       0,19 de haut quand une autre en faisait 0,68, soit un rapport de
       trois et demi. Une ecriture se reconnait a ce que ses lettres se
       ressemblent en taille. */
    const haut = sous
      ? BASE + (BASE - OEIL) * 0.42
      : k === 0 ? OEIL : OEIL + (bits >> 1) * 0.03;
    const suivant = x + large;
    /* Le ventre de la boucle : deux points de controle, l un montant,
       l autre retombant. Une courbe cubique par boucle, pas plus — a
       neuf pixels, un detail de plus n est qu un pixel plus epais. */
    d += ` C${f(x + large * 0.18)} ${f(haut)}`
      + ` ${f(suivant - large * 0.18)} ${f(haut)}`
      + ` ${f(suivant)} ${f(BASE)}`;
    x = suivant;
  }

  /* LE CROCHET FINAL. Une lettre a une fin ; sans lui le trait s arrete
     comme une ligne coupee. Sous une hampe il remonte : une lettre qui
     monte de tout son long et redescend sous la ligne pour finir n a
     plus de hauteur commune avec ses voisines. */
  const versLeHaut = monte || ((h >>> 12) & 1) === 0;
  const bout = versLeHaut ? OEIL + 0.06 : BASE + 0.16;
  d += ` C${f(x + 0.06)} ${f(BASE + (versLeHaut ? -0.06 : 0.06))}`
    + ` ${f(x + 0.07)} ${f(bout)} ${f(x - 0.02)} ${f(bout)}`;

  const ou = GAUCHE + large * (0.5 + ((h >>> 16) & 1));
  if (monte) {
    d += ` M${f(ou)} ${f(BASE)} C${f(ou - 0.05)} ${f(OEIL)}`
      + ` ${f(ou + 0.05)} ${f(HAMPE + 0.08)} ${f(ou - 0.01)} ${f(HAMPE)}`;
  } else if (descend) {
    d += ` M${f(ou)} ${f(BASE)} C${f(ou + 0.05)} ${f(BASE + 0.14)}`
      + ` ${f(ou - 0.05)} ${f(JAMBAGE - 0.08)} ${f(ou + 0.01)} ${f(JAMBAGE)}`;
  }

  /* LE POINT EN L AIR. Une diacritique : elle ne dit rien, mais une
     ecriture qui n en a aucune parait pauvre, et une qui en a partout
     parait sale. Une lettre sur quatre, et TOUJOURS AU-DESSUS : pose
     sous la ligne, il faisait descendre une lettre qui montait deja. */
  if (((h >>> 18) & 3) === 0 && !monte) {
    const px = GAUCHE + (DROITE - GAUCHE) * 0.5;
    const py = OEIL - 0.12;
    d += ` M${f(px - 0.015)} ${f(py)} A0.015 0.015 0 1 1 ${f(px + 0.015)} ${f(py)}`
      + ` A0.015 0.015 0 1 1 ${f(px - 0.015)} ${f(py)}`;
  }

  return d;
}

/**
 * VINGT-QUATRE LETTRES DISTINCTES.
 *
 * Le melangeur reduit les collisions sans les supprimer. On ne compare
 * pas ici la forme VUE, comme pour les ideogrammes : sur le pourtour
 * une lettre fait neuf pixels et aucune ne se distingue de sa voisine.
 * Ce qu on veut, c est qu un nom ne soit pas ecrit deux fois avec la
 * meme lettre repetee — donc des chaines distinctes suffisent.
 */
export function alphabetCursif(combien = 24): string[] {
  const vus = new Set<string>();
  const sortie: string[] = [];
  for (let k = 0; sortie.length < combien && k < 8192; k++) {
    const d = lettre(k);
    if (vus.has(d)) continue;
    vus.add(d);
    sortie.push(d);
  }
  return sortie;
}

/** L ecriture du pourtour. */
export const CURSIVE: readonly string[] = alphabetCursif();
