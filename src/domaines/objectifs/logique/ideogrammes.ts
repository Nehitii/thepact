/* L ECRITURE DES VALEURS — des ideogrammes, pas des lettres.
 *
 * ═══ POURQUOI UNE SECONDE ECRITURE ═══
 *
 * Le sceau ecrit deux choses de nature differente avec le meme
 * alphabet. La bande epelle un NOM, lettre a lettre : chaque signe y
 * vaut un caractere, et un signe seul n y veut rien dire. Les
 * medaillons, eux, portent une VALEUR — un mot entier, un concept.
 * Leur donner une lettre revenait a ecrire « liberte » avec un « l ».
 *
 * Une valeur merite donc un caractere qui la tienne entiere. C est la
 * distinction que font les ecritures ideographiques : un signe, une
 * idee. La bande garde ses signes de reseau ; les medaillons recoivent
 * ceux-ci.
 *
 * ═══ CE QU ILS EMPRUNTENT AU KANJI, ET CE QU ILS N EMPRUNTENT PAS ═══
 *
 * On leur prend la GRAMMAIRE, pas les formes. Un kanji tient dans un
 * carre, se compose de traits droits, s organise en parties — une a
 * gauche et une a droite, ou une au-dessus et une en dessous, ou une
 * enfermee dans une autre — et il s equilibre autour d une charpente.
 * C est cette mecanique-la qui donne l impression d une ecriture, et
 * elle n appartient a personne.
 *
 * ON NE COPIE AUCUN CARACTERE. Les elements sont abstraits — une
 * echelle, un toit, un coffre, des jambes — et se combinent par une
 * regle. Aucun n est repris d un caractere existant, et la table n en
 * contient aucun en dur. Ce qui sort est une ecriture perdue : elle a
 * l air de vouloir dire quelque chose, et elle ne dit rien.
 *
 * ═══ LA TAILLE COMMANDE TOUT ═══
 *
 * Le medaillon offre un anneau de 23,4 px sur le sceau du tableau de
 * bord. Un caractere dense y devient une tache : c est la contrainte
 * qui fixe la grammaire, pas l inverse.
 *
 *   quatre a six traits           au-dela, ils se touchent
 *   trois barres paralleles au plus   a quatre, l ecart tombe sous
 *                                     l epaisseur du trait
 *   que des segments droits       une courbe de trois pixels est un
 *                                 accident, pas une intention
 *
 * Mesure : la boite dessinee fait 0,13 unite, soit 13,7 px, et trois
 * barres y laissent 4,5 px d ecart pour un trait de 1,5 px.
 */

const f = (x: number): string => x.toFixed(3);

/** La boite du contenu. Le reste est la marge du caractere. */
const A = 0.14;
const B = 0.86;

interface Boite {
  x0: number; y0: number; x1: number; y1: number;
}

const CADRE: Boite = { x0: A, y0: A, x1: B, y1: B };
const cx = (b: Boite) => (b.x0 + b.x1) / 2;
const cy = (b: Boite) => (b.y0 + b.y1) / 2;

const trait = (x1: number, y1: number, x2: number, y2: number) =>
  `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`;

/* ═══ LES ELEMENTS ═══
 *
 * Chacun se dessine dans la boite qu on lui donne et n en sort jamais.
 * C est ce qui rend la composition possible sans reglage : deux
 * elements poses dans deux boites disjointes ne peuvent pas se
 * toucher.
 */

/** Des barres horizontales, reparties sur la hauteur. */
const barres = (b: Boite, n: number): string => {
  const traits: string[] = [];
  for (let i = 0; i < n; i++) {
    const y = n === 1 ? cy(b) : b.y0 + (i * (b.y1 - b.y0)) / (n - 1);
    traits.push(trait(b.x0, y, b.x1, y));
  }
  return traits.join(" ");
};

/** Des mats verticaux, repartis sur la largeur. */
const mats = (b: Boite, n: number): string => {
  const traits: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? cx(b) : b.x0 + (i * (b.x1 - b.x0)) / (n - 1);
    traits.push(trait(x, b.y0, x, b.y1));
  }
  return traits.join(" ");
};

/** Un coffre : quatre cotes fermes. */
const coffre = (b: Boite): string =>
  `M${f(b.x0)} ${f(b.y0)} L${f(b.x1)} ${f(b.y0)} L${f(b.x1)} ${f(b.y1)}`
  + ` L${f(b.x0)} ${f(b.y1)} Z`;

/** Un toit : deux pentes qui se rejoignent en haut. */
const toit = (b: Boite): string =>
  `M${f(b.x0)} ${f(b.y1)} L${f(cx(b))} ${f(b.y0)} L${f(b.x1)} ${f(b.y1)}`;

/** Des jambes : deux pentes qui partent d un sommet. */
const jambes = (b: Boite): string =>
  `${trait(cx(b), b.y0, b.x0, b.y1)} ${trait(cx(b), b.y0, b.x1, b.y1)}`;

/** Une croix : un mat et une barre, au centre. */
const croix = (b: Boite): string =>
  `${trait(b.x0, cy(b), b.x1, cy(b))} ${trait(cx(b), b.y0, cx(b), b.y1)}`;

/** Un croc : un mat qui se replie au pied. */
const croc = (b: Boite): string => {
  const pli = b.y1 - (b.y1 - b.y0) * 0.22;
  return `M${f(cx(b))} ${f(b.y0)} L${f(cx(b))} ${f(pli)} L${f(b.x0)} ${f(b.y1)}`;
};

/** Une fourche : un mat qui se separe a mi-hauteur. */
const fourche = (b: Boite): string => {
  const m = cy(b);
  return `${trait(cx(b), b.y0, cx(b), m)} ${trait(cx(b), m, b.x0, b.y1)}`
    + ` ${trait(cx(b), m, b.x1, b.y1)}`;
};

/** Un socle : une barre, et deux pieds courts qui descendent. */
const socle = (b: Boite): string => {
  const pied = b.y0 + (b.y1 - b.y0) * 0.55;
  return `${trait(b.x0, b.y0, b.x1, b.y0)} ${trait(b.x0, b.y0, b.x0, pied)}`
    + ` ${trait(b.x1, b.y0, b.x1, pied)}`;
};

/**
 * Un peigne : un mat, et des barres qui LE TRAVERSENT.
 *
 * C EST L ELEMENT QUI MANQUAIT. La premiere grammaire posait ses
 * elements dans des boites disjointes, si bien qu aucun trait n en
 * croisait jamais un autre — et c est precisement le croisement qui
 * fait lire un caractere plutot qu un assemblage. Sur vingt-quatre
 * signes engendres, six n etaient que des barres paralleles.
 */
const peigne = (b: Boite, n: number): string =>
  `${trait(cx(b), b.y0, cx(b), b.y1)} ${barres(b, n)}`;

/** Un coffre ouvert d un cote : trois murs, pas quatre. */
const demiCoffre = (b: Boite, versLeBas: boolean): string =>
  versLeBas
    ? `M${f(b.x0)} ${f(b.y1)} L${f(b.x0)} ${f(b.y0)} L${f(b.x1)} ${f(b.y0)} L${f(b.x1)} ${f(b.y1)}`
    : `M${f(b.x1)} ${f(b.y0)} L${f(b.x0)} ${f(b.y0)} L${f(b.x0)} ${f(b.y1)} L${f(b.x1)} ${f(b.y1)}`;

/* ═══ DEUX FAMILLES, ET ON N EN PREND JAMAIS DEUX DE LA MEME ═══
 *
 * Une cle est etroite et debout ; un corps est large et pose. Composer
 * deux cles donne un peigne bancal, composer deux corps donne un
 * empilement de barres — c est ce que faisait la premiere regle, qui
 * tirait ses deux parts dans le meme sac.
 */

/** Les cles : etroites, verticales, deux ou trois traits. */
const CLES: readonly ((b: Boite) => string)[] = [
  (b) => mats(b, 1),
  (b) => mats(b, 2),
  croc,
  fourche,
  jambes,
];

/* CHAQUE CORPS DIT SON SENS DOMINANT. « traverse » a besoin de le
   savoir : une charpente horizontale posee sur trois barres
   horizontales ne croise rien, elle en ajoute une quatrieme. C est
   exactement ce qui sortait au signe neuf — trois barres et une barre,
   soit un signe egal. */
interface Corps {
  dessin: (b: Boite) => string;
  /** « pose » : des horizontales dominent. « debout » : des verticales. */
  sens: "pose" | "debout" | "mixte";
}

const CORPS: readonly Corps[] = [
  { dessin: (b) => peigne(b, 2), sens: "mixte" },
  { dessin: (b) => peigne(b, 3), sens: "mixte" },
  { dessin: (b) => barres(b, 2), sens: "pose" },
  { dessin: (b) => barres(b, 3), sens: "pose" },
  { dessin: croix, sens: "mixte" },
  { dessin: toit, sens: "mixte" },
  { dessin: socle, sens: "pose" },
  { dessin: (b) => demiCoffre(b, true), sens: "debout" },
  { dessin: (b) => demiCoffre(b, false), sens: "debout" },
];

/* ═══ LES COMPOSITIONS ═══
 *
 * Quatre facons d occuper le carre. Ce sont elles qui font qu on lit
 * une ecriture et non une collection de formes : un systeme se
 * reconnait a ce que ses signes se ressemblent sans se confondre.
 */

/** Une cle en haut, un corps en bas — ou l inverse. */
function empile(h: number, cle: (b: Boite) => string, corps: Corps): string {
  const coupe = 0.44 + ((h >>> 3) & 1) * 0.08;
  const haut: Boite = { x0: A, y0: A, x1: B, y1: A + (B - A) * (coupe - 0.06) };
  const bas: Boite = { x0: A, y0: A + (B - A) * (coupe + 0.08), x1: B, y1: B };
  /* La cle passe dessus une fois sur deux : sinon toutes les valeurs
     auraient la meme silhouette, etroit en haut, large en bas. */
  return ((h >>> 13) & 1)
    ? `${cle({ ...haut, x0: A + (B - A) * 0.3, x1: B - (B - A) * 0.3 })} ${corps.dessin(bas)}`
    : `${corps.dessin(haut)} ${cle({ ...bas, x0: A + (B - A) * 0.3, x1: B - (B - A) * 0.3 })}`;
}

/** Une cle a gauche, un corps a droite. */
function cote(h: number, cle: (b: Boite) => string, corps: Corps): string {
  /* La cle est plus etroite que le corps : c est ce que font les
     ecritures ideographiques, et cela evite deux moities de meme poids
     qui se liraient comme un miroir plutot que comme un caractere. */
  const part = 0.3 + ((h >>> 5) & 1) * 0.06;
  const g: Boite = { x0: A, y0: A, x1: A + (B - A) * part, y1: B };
  const d: Boite = { x0: A + (B - A) * (part + 0.16), y0: A, x1: B, y1: B };
  return `${cle(g)} ${corps.dessin(d)}`;
}

/**
 * Une charpente qui TRAVERSE le corps, et non qui l evite.
 *
 * Elle se posait dans la moitie que le corps ne remplissait pas — donc
 * sans jamais le croiser. Un mat qui passe au travers de trois barres
 * est un caractere ; le meme mat pose au-dessus est un dessin.
 */
function traverse(h: number, corps: Corps): string {
  /* PERPENDICULAIRE AU CORPS, TOUJOURS. Un corps pose recoit un mat,
     un corps debout recoit une barre ; seuls les corps mixtes laissent
     le choix. Sans cette regle, « trois barres » traverse par une
     barre donnait quatre horizontales et rien d autre. */
  const debout = corps.sens === "pose" ? true
    : corps.sens === "debout" ? false
    : ((h >>> 7) & 1) === 0;
  const charpente = debout
    ? trait(cx(CADRE), A - 0.05, cx(CADRE), B + 0.05)
    : trait(A - 0.05, cy(CADRE), B + 0.05, cy(CADRE));
  /* Le corps occupe la boite entiere : la charpente le coupe. */
  return `${charpente} ${corps.dessin(CADRE)}`;
}

/** Un coffre, et ce qu il enferme. */
function enclos(h: number, cle: (b: Boite) => string): string {
  const marge = 0.2 + ((h >>> 9) & 1) * 0.06;
  const m = (B - A) * marge;
  const dedans: Boite = { x0: A + m, y0: A + m, x1: B - m, y1: B - m };
  const mur = ((h >>> 15) & 1)
    ? coffre(CADRE)
    : demiCoffre(CADRE, ((h >>> 16) & 1) === 0);
  return `${mur} ${cle(dedans)}`;
}

/**
 * Le melangeur.
 *
 * UN AUTRE FLOT QUE CELUI DU RESEAU, volontairement : les deux
 * ecritures se lisent sur le meme sceau, et si la valeur d indice
 * trois et la lettre d indice trois etaient tirees de la meme suite,
 * leurs formes se repondraient sans raison. Les constantes different
 * pour que les deux tirages n aient rien a voir.
 */
function melanger(i: number): number {
  let h = Math.imul(i ^ 0x27d4eb2f, 0x165667b1) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2545f491) >>> 0;
  return (h ^ (h >>> 13)) >>> 0;
}

/**
 * L ideogramme d indice `i`.
 *
 * Une composition, un ou deux elements. La regle est courte parce que
 * c est elle qui fait la famille : allonger la grammaire donnerait des
 * signes plus varies et une ecriture moins credible.
 */
export function ideogramme(i: number): string {
  const h = melanger(i);
  const cle = CLES[(h >>> 11) % CLES.length];
  const corps = CORPS[(h >>> 17) % CORPS.length];
  /* Le croisement n est pas laisse au hasard : « traverse » sort une
     fois sur trois, et les trois autres compositions en portent un par
     leur corps ou par leur coffre. */
  switch (h % 3) {
    case 0: return traverse(h, corps);
    case 1: return ((h >>> 21) & 1) ? empile(h, cle, corps) : cote(h, cle, corps);
    default: return ((h >>> 22) & 1) ? enclos(h, cle) : cote(h, cle, corps);
  }
}

/* ═══ DEUX CARACTERES DIFFERENTS DOIVENT SE VOIR DIFFERENTS ═══
 *
 * Ecarter les chemins IDENTIQUES ne suffit pas. Le premier tirage
 * rendait vingt-quatre chaines distinctes dont plusieurs paires
 * etaient indiscernables a la taille du medaillon : un coffre a mat
 * court et un coffre a mat long, un mat a deux barres et le meme a
 * trois. Trente pixels ne retiennent pas un dixieme de trait.
 *
 * On compare donc ce qu on VOIT : chaque caractere est projete sur une
 * grille de sept par sept, la ou il passe, et deux caracteres doivent
 * differer d au moins « ECART_MIN » cases. C est grossier a dessein —
 * c est exactement ce que le medaillon montre.
 */

/** Le cote de la grille de comparaison. Impair : il y a un centre. */
const COTE = 7;
/** Cases de difference exigees entre deux caracteres, sur 49. */
const ECART_MIN = 5;

/**
 * La trace d un caractere sur la grille.
 *
 * Les chemins n ont que des segments droits — « M », « L », « Z » —
 * ce qui permet de les parcourir sans moteur de rendu. Chaque segment
 * est echantillonne assez fin pour qu aucune case traversee ne soit
 * manquee : le pas vaut un tiers de case.
 */
function trace(d: string): boolean[] {
  const cases = new Array<boolean>(COTE * COTE).fill(false);
  const marquer = (x: number, y: number) => {
    const i = Math.min(COTE - 1, Math.max(0, Math.floor(x * COTE)));
    const j = Math.min(COTE - 1, Math.max(0, Math.floor(y * COTE)));
    cases[j * COTE + i] = true;
  };
  const jetons = d.split(/\s+/).filter(Boolean);
  let depart: [number, number] | null = null;
  let ou: [number, number] | null = null;
  for (let k = 0; k < jetons.length; k++) {
    const t = jetons[k];
    if (t === "Z" || t === "z") {
      if (ou && depart) segment(ou, depart, marquer);
      ou = depart;
      continue;
    }
    const lettre = /^[MLml]/.test(t) ? t[0].toUpperCase() : null;
    if (!lettre) continue;
    const x = parseFloat(t.slice(1) || jetons[++k]);
    const y = parseFloat(jetons[++k]);
    if (Number.isNaN(x) || Number.isNaN(y)) continue;
    const point: [number, number] = [x, y];
    if (lettre === "M") { depart = point; marquer(x, y); }
    else if (ou) segment(ou, point, marquer);
    ou = point;
  }
  return cases;
}

function segment(a: readonly [number, number], b: readonly [number, number],
                 marquer: (x: number, y: number) => void): void {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const pas = Math.max(2, Math.ceil(Math.hypot(dx, dy) * COTE * 3));
  for (let i = 0; i <= pas; i++) marquer(a[0] + (dx * i) / pas, a[1] + (dy * i) / pas);
}

/** Combien de cases separent deux traces. */
function ecart(a: readonly boolean[], b: readonly boolean[]): number {
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
}

/**
 * VINGT-QUATRE IDEOGRAMMES, TOUS DISCERNABLES.
 *
 * On parcourt l espace du generateur et l on ne retient un caractere
 * que s il se distingue de TOUS ceux deja retenus — pas seulement du
 * dernier. Deux valeurs qui porteraient le meme caractere, ou deux
 * qu on ne saurait pas separer d un coup d oeil, feraient un sceau qui
 * n identifie plus.
 *
 * La borne existe pour qu une regle mal ecrite ne tourne pas sans fin.
 */
export function ecritureEngendree(signe: (i: number) => string, combien = 24): string[] {
  const retenus: boolean[][] = [];
  const sortie: string[] = [];
  for (let k = 0; sortie.length < combien && k < 8192; k++) {
    const d = signe(k);
    const t = trace(d);
    if (retenus.some((autre) => ecart(t, autre) < ECART_MIN)) continue;
    retenus.push(t);
    sortie.push(d);
  }
  return sortie;
}

/** L ecriture des valeurs. Vingt-quatre caracteres, tous discernables. */
export const IDEOGRAMMES: readonly string[] = ecritureEngendree(ideogramme);

/* Reservees a la garde : elle mesure ce que l ecran montrera. */
export const _pourLaGarde = { trace, ecart, COTE, ECART_MIN };
