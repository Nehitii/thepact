/* Découpe des deux planches de M.I.A en dix-huit vignettes.
 *
 * Pas de sharp ni de canvas dans ce dépôt : pngjs suffit.
 *
 * ON NE RECADRE PAS DANS LA PLANCHE, ON COMPOSE SUR DU VIDE.
 * Premier essai : je prenais la boîte commune directement dans la
 * planche, centrée sur le sujet. Mais cette boîte (437 px) est plus
 * haute que les cases de la première planche (431), et le cadrage
 * mordait donc sur la case du dessous — un bout de halo apparaissait au
 * bas de « joie ». On extrait maintenant le sujet dans son propre
 * tampon, puis on le pose sur un carré transparent : rien d'extérieur
 * ne peut plus entrer.
 *
 * LE PRÉMULTIPLIÉ N'EST PAS UN DÉTAIL. Moyenner des couleurs sans tenir
 * compte de leur opacité fait remonter la couleur des pixels
 * transparents et cerne chaque sprite d'un liseré. On multiplie par
 * l'alpha avant de moyenner, on redivise après.
 
 * ─── LA GRILLE N EST PAS LA LIMITE DU PERSONNAGE ───
 *
 * Decouper sur les lignes de la grille rogne les figures qui debordent
 * de leur case. Constate sur « genee » : son halo commence a la ligne
 * 673 de la planche alors que la ligne de grille tombe a 683 — DIX
 * RANGEES DU SOMMET DE L ANNEAU etaient perdues, et la coupe se voyait
 * comme un plat sur l arc.
 *
 * Le symptome se lit dans le profil des premieres rangees encrees. Un
 * apex naturel commence etroit et s elargit — « neutre » fait
 * 23, 34, 43, 50, 56. Un sommet tranche commence LARGE puis se
 * retrecit : la version rognee faisait 40, 35, 28, 26, 24.
 *
 * La vraie frontiere entre deux cases n est pas la ligne de grille mais
 * la rangee ou l encre FRANCHE s arrete. Ici : « contente » finit a 672,
 * « genee » commence a 675, la grille tranchait a 683. Les deux figures
 * se touchent meme en alpha faible, donc aucune bande entierement vide
 * ne les separe — chercher les rangees sans encre franche, pas les
 * rangees sans encre du tout.
 *
 * ─── REMPLACER UNE SEULE VIGNETTE ───
 *
 * LES DIX-HUIT PARTAGENT UNE ECHELLE, calculee ici sur la plus grande
 * boite des dix-huit. Redecouper une seule case depuis une planche
 * re-rendue dans un autre format demande donc de retrouver cette
 * echelle. Deux reperes ont ete essayes et rejetes :
 *
 * L ANNEAU. Il paraissait rigide — 145, 146 et 148 px sur trois
 * vignettes. Mais une planche re-rendue le dessine plus grand par
 * rapport a la tete : cale dessus, le visage tombait a 94 px de haut
 * contre 129 pour les autres.
 *
 * LA BOITE DE PEAU. Le detecteur la sous-estime sur un rendu dont
 * l eclairage differe, et l echelle deduite depassait de vingt pour
 * cent — la tete devenait visiblement trop grosse.
 *
 * L ECART ENTRE LES YEUX TIENT. Les iris sont deux taches ambrees de
 * part et d autre du nez, a la meme place quelle que soit l expression.
 * Mesure : 43,8 px sur « calme » et 43,9 sur « severe » — un dixieme de
 * pixel d ecart. C est ce qui a permis de replacer « genee » au
 * millimetre quand sa planche a ete refaite pour lui rendre son coude.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire("file:///C:/Dev/Vowpact/");
const { PNG } = require("pngjs");

const BUREAU = "C:/Users/geoff/Desktop";
const SORTIE = "C:/Dev/Vowpact/public/mia";
const COTE = 256;
const SEUIL_ALPHA = 8;

const PLANCHES = [
  {
    fichier: "0a031f07-4784-4168-94cd-894c41f6a284.png",
    slots: ["calme", "neutre", "joie", "reflexion", "surprise", "contente", "complice", "lasse", "genee"],
  },
  {
    fichier: "1066b3cc-1a55-4196-b8a0-cf086029e5c1.png",
    slots: ["contrariee", "severe", "colere", "abattue", "peine", "soupir", "triste-sourire", "menacante", "eteinte"],
  },
];

/* LA GRILLE NE COUPE PAS NET, ET LE SEUIL NE SUFFIT PAS.

   Les cases font 431 px de haut, mais le halo de la rangée suivante
   déborde de quelques pixels au-dessus de la ligne : une écharde jaune
   se retrouvait au bas de « joie ». Un seuil d'encre par ligne ne
   l'attrape pas — l'arc du halo est large, il passe les 2 %.

   La bonne question n'est pas « cette ligne est-elle assez encrée » mais
   « ce pixel touche-t-il le sujet ». On étiquette donc les composantes
   connexes du masque d'opacité et on ne garde que la plus grande : le
   personnage est d'un seul tenant, une écharde ne l'est jamais. */
function masqueDuSujet(png, x0, y0, w, h) {
  const opaque = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = ((y0 + y) * png.width + (x0 + x)) * 4;
      if (png.data[i + 3] > SEUIL_ALPHA) opaque[y * w + x] = 1;
    }
  }

  const etiquette = new Int32Array(w * h).fill(-1);
  const file = new Int32Array(w * h);
  let meilleure = -1;
  let meilleureTaille = 0;

  for (let depart = 0; depart < opaque.length; depart++) {
    if (!opaque[depart] || etiquette[depart] !== -1) continue;
    let tete = 0;
    let queue = 0;
    file[queue++] = depart;
    etiquette[depart] = depart;
    let taille = 0;
    while (tete < queue) {
      const p = file[tete++];
      taille++;
      const px = p % w;
      const py = (p / w) | 0;
      /* quatre voisins : la diagonale relierait des parties que l'œil
         voit séparées */
      if (px > 0 && opaque[p - 1] && etiquette[p - 1] === -1) { etiquette[p - 1] = depart; file[queue++] = p - 1; }
      if (px < w - 1 && opaque[p + 1] && etiquette[p + 1] === -1) { etiquette[p + 1] = depart; file[queue++] = p + 1; }
      if (py > 0 && opaque[p - w] && etiquette[p - w] === -1) { etiquette[p - w] = depart; file[queue++] = p - w; }
      if (py < h - 1 && opaque[p + w] && etiquette[p + w] === -1) { etiquette[p + w] = depart; file[queue++] = p + w; }
    }
    if (taille > meilleureTaille) { meilleureTaille = taille; meilleure = depart; }
  }

  /* GARDER SEULEMENT LA PLUS GRANDE EMPORTE AUSSI LES ACCENTS.
     Les « !! » de la joie, l etoile du clin d oeil, les gouttes de la
     gene sont des composantes separees, et elles portent l emotion. On
     ne rejette donc QUE ce qui trahit un debordement de grille : une
     composante qui touche le bord de la case et qui pese moins d un
     dixieme du sujet. Un accent flotte au milieu, jamais sur l arete. */
  const rejetees = new Set();
  const tailles = new Map();
  const touche = new Set();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const e = etiquette[y * w + x];
      if (e < 0) continue;
      tailles.set(e, (tailles.get(e) ?? 0) + 1);
      if (y === 0 || y === h - 1 || x === 0 || x === w - 1) touche.add(e);
    }
  }
  for (const [e, n] of tailles) {
    if (e === meilleure) continue;
    if (touche.has(e) && n < meilleureTaille * 0.1) rejetees.add(e);
  }
  return { etiquette, principale: meilleure, taille: meilleureTaille, rejetees };
}

function boiteUtile(png, x0, y0, w, h) {
  const { etiquette, principale, rejetees } = masqueDuSujet(png, x0, y0, w, h);
  if (principale < 0) return null;
  let gauche = w, droite = -1, haut = h, bas = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const e = etiquette[y * w + x];
      if (e < 0 || rejetees.has(e)) continue;
      if (x < gauche) gauche = x;
      if (x > droite) droite = x;
      if (y < haut) haut = y;
      if (y > bas) bas = y;
    }
  }
  if (droite < 0) return null;
  return { x: x0 + gauche, y: y0 + haut, w: droite - gauche + 1, h: bas - haut + 1, etiquette, rejetees, cx: x0, cy: y0, cw: w };
}

/** Moyenne d'aire sur un tampon RGBA, en prémultiplié. */
function reduire(src, sw, sh, cible) {
  const out = new PNG({ width: cible, height: cible });
  for (let y = 0; y < cible; y++) {
    const y0 = Math.floor((y * sh) / cible);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * sh) / cible));
    for (let x = 0; x < cible; x++) {
      const x0 = Math.floor((x * sw) / cible);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * sw) / cible));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1 && yy < sh; yy++) {
        for (let xx = x0; xx < x1 && xx < sw; xx++) {
          const i = (yy * sw + xx) * 4;
          const al = src[i + 3] / 255;
          r += src[i] * al;
          g += src[i + 1] * al;
          b += src[i + 2] * al;
          a += src[i + 3];
          n++;
        }
      }
      const j = (y * cible + x) * 4;
      if (!n) { out.data[j] = out.data[j + 1] = out.data[j + 2] = out.data[j + 3] = 0; continue; }
      const am = a / n;
      const inv = am > 0 ? 255 / am : 0;
      out.data[j] = Math.min(255, Math.round((r / n) * inv));
      out.data[j + 1] = Math.min(255, Math.round((g / n) * inv));
      out.data[j + 2] = Math.min(255, Math.round((b / n) * inv));
      out.data[j + 3] = Math.round(am);
    }
  }
  return out;
}

fs.mkdirSync(SORTIE, { recursive: true });

const releve = [];
for (const planche of PLANCHES) {
  const png = PNG.sync.read(fs.readFileSync(path.join(BUREAU, planche.fichier)));
  const cw = png.width / 3, ch = png.height / 3;
  for (let i = 0; i < 9; i++) {
    const col = i % 3, lig = Math.floor(i / 3);
    const x0 = Math.round(col * cw), y0 = Math.round(lig * ch);
    const w = Math.round((col + 1) * cw) - x0, h = Math.round((lig + 1) * ch) - y0;
    const boite = boiteUtile(png, x0, y0, w, h);
    if (!boite) { console.error("case vide : " + planche.slots[i]); process.exit(1); }
    releve.push({ png, slot: planche.slots[i], boite });
  }
}

/* Une échelle commune pour les dix-huit : sinon la tête changerait de
   taille d'une expression à l'autre. */
const cote = Math.max(...releve.map((r) => Math.max(r.boite.w, r.boite.h)));
const marge = Math.round(cote * 0.04);
const total = cote + marge * 2;
console.log(`boîte commune : ${cote} px, canevas ${total} px`);

for (const { png, slot, boite } of releve) {
  /* Le canevas est vide : on n'y pose QUE le sujet extrait. */
  const canevas = new Uint8Array(total * total * 4);
  const dx = Math.round((total - boite.w) / 2);
  const dy = marge; /* alignement par le haut : les têtes y sont toutes */
  for (let y = 0; y < boite.h; y++) {
    for (let x = 0; x < boite.w; x++) {
      /* Hors de la composante principale, on ne recopie rien : c'est là
         que l'écharde disparaît. */
      const ex = boite.x - boite.cx + x;
      const ey = boite.y - boite.cy + y;
      const et = boite.etiquette[ey * boite.cw + ex];
      if (et < 0 || boite.rejetees.has(et)) continue;
      const s = ((boite.y + y) * png.width + (boite.x + x)) * 4;
      const d = ((dy + y) * total + (dx + x)) * 4;
      canevas[d] = png.data[s];
      canevas[d + 1] = png.data[s + 1];
      canevas[d + 2] = png.data[s + 2];
      canevas[d + 3] = png.data[s + 3];
    }
  }
  const vignette = reduire(canevas, total, total, COTE);
  const chemin = path.join(SORTIE, `mia-${slot}.png`);
  fs.writeFileSync(chemin, PNG.sync.write(vignette));
  console.log(`mia-${slot}.png  ${boite.w}×${boite.h} → ${COTE}²  ${Math.round(fs.statSync(chemin).size / 1024)} ko`);
}

console.log("dix-huit vignettes écrites");
