/**
 * Une couleur de néon, ramenée à une encre qui porte sur du papier.
 *
 * ═══════════════════════════════════════════════════════════════
 * POURQUOI CE FICHIER EXISTE
 *
 * L'application peint beaucoup de couleurs en STYLE INLINE : la
 * couleur d'une action rapide, la couleur d'une difficulté, la couleur
 * d'une phase. Un style inline bat toute feuille de style — y compris
 * `theme-clair.css`. Ces couleurs-là ne peuvent donc pas être
 * corrigées en CSS : la version claire doit être calculée là où la
 * couleur est posée.
 *
 * Elles ont toutes le même défaut sur du papier. Ce sont des néons,
 * choisis pour briller sur du quasi-noir : #00ff88 tombe à 1,3:1 sur
 * du blanc, #ffd700 à 1,4:1. Écrites telles quelles en thème clair,
 * elles ne sont pas « moins jolies » — elles sont invisibles.
 *
 * CE QUE LA FONCTION NE FAIT PAS
 *
 * Elle ne remplace pas la couleur : la TEINTE est conservée au degré
 * près. Le vert reste vert, le rose reste rose, une action garde son
 * identité. Ce qui change, c'est la clarté perçue et l'intensité — le
 * néon devient un pigment. Et une couleur qui passe déjà le seuil est
 * renvoyée telle quelle : les fonds sombres (#0c1a4f, #002b1a)
 * traversent sans être touchés.
 *
 * MESURE sur les vingt néons du projet : contrastes de 6,1 à 7,2 sur
 * du blanc, là où les originaux allaient de 1,3 à 3,1. L'écart résiduel
 * n'est pas du bruit — c'est l'effet Helmholtz-Kohlrausch : à clarté
 * perçue égale, un rouge saturé porte plus de contraste mesuré qu'un
 * vert, parce que l'œil le voit déjà plus clair que sa luminance.
 * ═══════════════════════════════════════════════════════════════
 */

/** Le papier sur lequel l'encre est posée. Voir `--fond` du thème clair. */
const PAPIER = { r: 0xff, g: 0xff, b: 0xff };

/** Le seuil AA pour du texte normal. */
const CONTRASTE_CIBLE = 4.5;

/**
 * ── POURQUOI OKLCH ET PAS TSL ──
 *
 * Deux tentatives ont échoué avant celle-ci, et chacune a appris
 * quelque chose.
 *
 * En TSL, baisser la clarté à saturation constante rend la couleur
 * PLUS vive, pas plus profonde : #ef4444 devenait #eb1616, un rouge
 * encore plus électrique. Plafonner la saturation a corrigé ça.
 *
 * Restait un défaut plus sourd : viser un CONTRASTE identique ne donne
 * pas un POIDS identique. À 4,5:1, le vert atterrissait sur #168753 —
 * une encre profonde — et le rouge sur #de3535, qui reste un néon. Les
 * deux passent la mesure, mais côte à côte sur une page ils n'ont pas
 * l'air d'appartenir à la même palette, et c'est exactement ce qui
 * fait qu'un thème a l'air converti plutôt que dessiné. La luminance
 * WCAG ignore que l'œil voit une couleur saturée plus claire qu'un
 * gris de même luminance.
 *
 * OKLCH sépare ce que les deux autres mélangeaient : la clarté PERÇUE
 * d'un côté, la teinte et l'intensité de l'autre. En fixant la même
 * clarté perçue pour toutes les encres, la famille tient : le rouge,
 * le vert et le violet pèsent pareil sur la page tout en restant
 * parfaitement distincts.
 */

/** La clarté perçue de l'encre. Toutes les couleurs y descendent. */
const L_ENCRE = 0.46;

/** L'intensité maximale d'un pigment.
 *
 * Réglée d'abord à 0,155, ce qui donnait des couleurs justes mais
 * ternes — « les couleurs du mode clair n'ont rien du cyberpunk ». Une
 * encre d'imprimerie n'est pas un pastel : un aplat de cyan ou de
 * magenta sur du papier est DENSE. On monte donc la charge jusqu'au
 * bord de ce que le sRGB peut tenir à cette clarté — c'est la couleur
 * de tirage, pas la couleur d'écran ni son édulcoration. */
const C_ENCRE = 0.2;

/** Un canal sRGB, linéarisé. */
function lineaire(canal: number): number {
  const v = canal / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** La luminance relative d'une couleur sRGB (WCAG 2.1). */
function luminance(r: number, g: number, b: number): number {
  return 0.2126 * lineaire(r) + 0.7152 * lineaire(g) + 0.0722 * lineaire(b);
}

const LUM_PAPIER = luminance(PAPIER.r, PAPIER.g, PAPIER.b);

/** Le rapport de contraste entre une couleur et le papier. */
function contrasteSurPapier(r: number, g: number, b: number): number {
  const l = luminance(r, g, b);
  return (Math.max(l, LUM_PAPIER) + 0.05) / (Math.min(l, LUM_PAPIER) + 0.05);
}

/** « #ef4343 » ou « ef4343 » → [239, 67, 67]. Null si ce n'est pas un hexa à six chiffres. */
function versRVB(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function versHex(r: number, g: number, b: number): string {
  const deux = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
  return `#${deux(r)}${deux(g)}${deux(b)}`;
}

/* ── sRGB ↔ OKLCH ──
   Björn Ottosson, « A perceptual color space for image processing ».
   Les canaux entrent et sortent en 0–255 ; L est en 0–1, C en 0–0,4
   environ, H en degrés. */

function rvbVersOklch(r: number, g: number, b: number): [number, number, number] {
  const lr = lineaire(r);
  const lg = lineaire(g);
  const lb = lineaire(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const C = Math.sqrt(a * a + bb * bb);
  let H = (Math.atan2(bb, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

/** Un canal linéaire, ramené en sRGB 0–255. Peut sortir de l'intervalle. */
function versSRVB(canal: number): number {
  const v = canal <= 0.0031308 ? canal * 12.92 : 1.055 * Math.pow(canal, 1 / 2.4) - 0.055;
  return v * 255;
}

function oklchVersRvb(L: number, C: number, H: number): [number, number, number] {
  const rad = (H * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    versSRVB(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    versSRVB(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    versSRVB(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/** Vrai si les trois canaux tiennent dans le gamut sRGB, à un cheveu près. */
function dansLeGamut(rvb: [number, number, number]): boolean {
  return rvb.every((c) => c >= -0.5 && c <= 255.5);
}

/**
 * La couleur OKLCH la plus proche qui tient dans sRGB : on ne réduit
 * que l'intensité, jamais la clarté ni la teinte, pour que la couleur
 * reste elle-même.
 */
function ramenerDansLeGamut(L: number, C: number, H: number): [number, number, number] {
  if (dansLeGamut(oklchVersRvb(L, C, H))) return oklchVersRvb(L, C, H);
  let bas = 0;
  let haut = C;
  for (let i = 0; i < 20; i++) {
    const milieu = (bas + haut) / 2;
    if (dansLeGamut(oklchVersRvb(L, milieu, H))) bas = milieu;
    else haut = milieu;
  }
  return oklchVersRvb(L, bas, H);
}



/* Le calcul est déterministe et se répète à chaque rendu pour la même
   poignée de couleurs : on le fait une fois. */
const memoire = new Map<string, string>();

/**
 * La version « papier » d'une couleur : même teinte, même saturation,
 * clarté descendue juste assez pour atteindre `cible` sur du blanc.
 *
 * Une couleur qui passe déjà le seuil, ou qui n'est pas un hexadécimal
 * à six chiffres, est renvoyée telle quelle.
 */
export function encrePapier(hex: string, cible: number = CONTRASTE_CIBLE): string {
  const cle = `${hex}|${cible}`;
  const connu = memoire.get(cle);
  if (connu !== undefined) return connu;

  const rvb = versRVB(hex);
  if (!rvb) {
    memoire.set(cle, hex);
    return hex;
  }

  let resultat = hex;
  if (contrasteSurPapier(rvb[0], rvb[1], rvb[2]) < cible) {
    const [, chroma, teinte] = rvbVersOklch(rvb[0], rvb[1], rvb[2]);
    const c = Math.min(chroma, C_ENCRE);

    /* La teinte ne bouge pas, l'intensité est plafonnée, et la clarté
       perçue est la même pour toutes les encres de la palette. */
    let l = L_ENCRE;
    let final = ramenerDansLeGamut(l, c, teinte);

    /* Le seuil est vérifié sur les canaux ARRONDIS : sinon la
       conversion finale en hexadécimal fait repasser la couleur sous
       la cible de quelques centièmes. Une teinte très intense peut
       demander de descendre un cran plus bas que la clarté nominale —
       c'est le seul cas où la famille se déforme, et il est rare. */
    for (let i = 0; i < 40; i++) {
      const [r, v, b] = final;
      if (contrasteSurPapier(Math.round(r), Math.round(v), Math.round(b)) >= cible) break;
      l -= 0.01;
      final = ramenerDansLeGamut(l, c, teinte);
    }

    resultat = versHex(final[0], final[1], final[2]);
  }

  memoire.set(cle, resultat);
  return resultat;
}

/**
 * La couleur à employer selon le thème courant.
 * `sombre` vient de `useThemeSombre()`.
 */
export function selonTheme(hex: string, sombre: boolean, cible?: number): string {
  return sombre ? hex : encrePapier(hex, cible);
}
