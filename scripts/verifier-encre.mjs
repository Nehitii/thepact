#!/usr/bin/env node
/* UNE ENCRE DOIT SE LIRE SUR SON FOND, DANS LES DEUX THEMES.
 *
 * Cette garde ferme la troisieme classe de panne du plan : une couleur
 * de texte posee sur un fond contre lequel personne ne l a mesuree.
 * Elle a coute quatre corrections separees a ce depot — le theme clair
 * mesure contre un blanc qui n existe pas, l accent epique sous le
 * seuil, deux etiquettes de sante en encre sombre sur fond sombre, et
 * une bascule de souhaits blanche sur blanc.
 *
 * ═══ CE QU ON A ESSAYE, ET POURQUOI ON NE L A PAS GARDE ═══
 *
 * Le reflexe est de lire toutes les REGLES et de croiser chaque
 * `color` avec le `background` de la meme regle. On l a fait : 506
 * regles portent les deux, 324 couples se resolvent, et 24 tombaient
 * sous 4,5.
 *
 * VINGT-TROIS SUR VINGT-QUATRE ETAIENT FAUX. Une regex ne reconstitue
 * pas la cascade : elle ignore la specificite, l ordre, et la portee
 * des jetons. Elle accusait `.wl-tri[aria-pressed="true"]` d etre
 * blanc sur blanc alors qu une surcharge de nuit, plus specifique, le
 * corrige quinze lignes plus haut ; elle melait les valeurs claires et
 * sombres d une meme teinte de rarete et inventait huit violets
 * illisibles qui n existent dans aucun theme.
 *
 * UNE GARDE QUI ACCUSE DU CODE JUSTE EST PIRE QUE PAS DE GARDE : on
 * apprend a passer outre, et le jour ou elle a raison, personne ne
 * regarde. On ne garde donc que ce qui se prouve SANS cascade.
 *
 * ═══ CE QU ELLE VERIFIE ═══
 *
 * LES BLOCS DE JETONS. Quand une feuille declare d un coup une famille
 * de couleurs — `--wl-encre`, `--wl-encre-2`, `--wl-plaque`,
 * `--wl-creux` — les valeurs sont litterales, dans le meme bloc, sous
 * la meme portee et le meme theme. Aucune cascade n intervient : le
 * croisement encre x fond y est EXACT. Douze blocs, quatre-vingt-quinze
 * couples.
 *
 * LE SEUIL EST 3,0, ET C EST DELIBERE. En dessous, aucune taille de
 * texte ne sauve la lecture : c est un echec a tous les niveaux des
 * regles d accessibilite. Entre 3,0 et 4,5, la reponse depend de la
 * taille et de la graisse, que le bloc de jetons ne connait pas — ces
 * couples sont RAPPORTES, pas refuses. Les neuf rencontres aujourd hui
 * sont tous des encres TIERCES — legende, metadonnee, ligne secondaire
 * — faites pour s effacer ; ils tiennent en six lignes de tolerance,
 * chacune avec son rapport releve, pour qu une degradation se voie.
 *
 *   npm run encre:check
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const RACINE = "src";
const PLANCHER = 3.0;      /* en dessous : illisible a toute taille */
const VISEE = 4.5;         /* le seuil du texte courant */

/* Les couples deja mesures et acceptes : une encre tierce est faite
   pour s effacer — legende, metadonnee, ligne secondaire. Chacun porte
   son rapport releve, pour qu une degradation se voie. */
const TOLERES = new Map([
  ["--wl-encre-3 sur --wl-dette-creux", "encre tierce sur le creux d une dette — 3,32"],
  ["--wl-encre-2 sur --wl-dette-creux", "encre secondaire sur le meme creux — 4,10"],
  ["--hlt-encre-3 sur --hlt-plaque", "encre tierce de la sante — 3,73"],
  ["--hlt-encre-3 sur --hlt-creux", "encre tierce de la sante — 3,84 a 4,10"],
  ["--hlt-encre-3 sur --hlt-fond", "encre tierce de la sante — 3,91 a 4,32"],
  ["--co-texte-3 sur --co-fond-creux", "texte tertiaire de la communaute — 4,21"],
]);

const feuilles = [];
const parcourir = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name).split(path.sep).join("/");
    if (e.isDirectory()) { parcourir(p); continue; }
    if (p.endsWith(".css")) feuilles.push(p);
  }
};
parcourir(RACINE);

const REGLE = /([^{}]+)\{([^{}]*)\}/g;
const ENCRE = /-(encre|texte|text|ink|fg)(-\d)?$/;
const FOND = /-(sol|plaque|creux|fond|bg|surface|papier)(-\d)?$/;

const rvb = (v) => {
  v = v.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return [1, 2, 3].map((i) => parseInt(v[i] + v[i], 16));
  return null;
};
/* WCAG 2.1, luminance relative et rapport de contraste. */
const canal = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const luminance = ([r, g, b]) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
const contraste = (a, b) => {
  const [haut, bas] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (haut + 0.05) / (bas + 0.05);
};

let blocs = 0, couples = 0;
const illisibles = [], sousLaVisee = [];
/* Ce qu on a reellement rencontre sous la visee : c est ce qui justifie
   une tolerance, et rien d autre. */
const rencontres = new Set();
for (const f of feuilles) {
  const src = fs.readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of src.matchAll(REGLE)) {
    const sel = m[1].trim().replace(/\s+/g, " ");
    if (sel.startsWith("@")) continue;
    const jetons = [...m[2].matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*(?:;|$)/g)]
      .map((d) => [d[1], rvb(d[2])]).filter(([, v]) => v);
    const encres = jetons.filter(([n]) => ENCRE.test(n));
    const fonds = jetons.filter(([n]) => FOND.test(n));
    if (!encres.length || !fonds.length) continue;
    blocs++;
    for (const [ne, ve] of encres)
      for (const [nf, vf] of fonds) {
        couples++;
        const r = contraste(ve, vf);
        if (r >= VISEE) continue;
        const cle = ne + " sur " + nf;
        rencontres.add(cle);
        const fiche = { f, sel, cle, r };
        if (r < PLANCHER) illisibles.push(fiche);
        else if (!TOLERES.has(cle)) sousLaVisee.push(fiche);
      }
  }
}

/* Une tolerance qui ne sert plus est une tolerance qui ment : si le
   couple ne tombe plus sous la visee, la ligne doit disparaitre. */
const inutiles = [...TOLERES.keys()].filter((c) => !rencontres.has(c));

console.log("encre : " + blocs + " blocs de jetons, " + couples + " couples encre/fond croises.");
console.log("        " + TOLERES.size + " couple(s) tolere(s), chacun avec sa raison ecrite.");
if (sousLaVisee.length) {
  console.log("\n" + sousLaVisee.length + " couple(s) entre " + PLANCHER.toFixed(1) + " et "
    + VISEE.toFixed(1) + " — lisibles en gros, pas en texte courant :");
  for (const x of sousLaVisee.sort((a, b) => a.r - b.r))
    console.log("  " + x.r.toFixed(2) + "  " + x.cle + "   « " + x.sel.slice(0, 34) + " »  " + x.f);
}
for (const c of inutiles) console.log("TOLERANCE INUTILE : « " + c + " » ne correspond a plus aucun jeton.");

if (illisibles.length === 0 && inutiles.length === 0) {
  console.log("\naucune encre sous " + PLANCHER.toFixed(1) + " sur son propre fond.");
  process.exit(0);
}
if (illisibles.length) {
  console.log("\n" + illisibles.length + " ENCRE(S) SOUS " + PLANCHER.toFixed(1)
    + " — illisible a toute taille de texte :");
  for (const x of illisibles.sort((a, b) => a.r - b.r))
    console.log("  " + x.r.toFixed(2) + "  " + x.cle + "   « " + x.sel.slice(0, 34) + " »  " + x.f);
}
process.exit(1);
