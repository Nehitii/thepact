#!/usr/bin/env node
/* LES CLES DE TRADUCTION EXISTENT-ELLES VRAIMENT ?
 *
 * Presque tous les appels de l application s ecrivent
 * t("une.cle", "An English fallback"). Le repli est commode, mais il
 * rend une cle manquante INVISIBLE : le jour ou elle disparait, ou n a
 * jamais ete ecrite, l anglais s affiche en francais sans que rien ne le
 * signale. Et quand il n y a pas de repli, i18next « humanise » le
 * chemin — c est ainsi qu une barre d outils s est appelee « Focus
 * Toolbar audio » pendant plusieurs jours.
 *
 * Ce script transforme ce risque latent en verification mecanique :
 *   npm run i18n:check
 *
 * ═══ IL NE LISAIT QUE LES CLES LITTERALES, ET IL EN MANQUAIT 230 ═══
 *
 * Releve du 31 aout 2026 : a cote des cles ecrites en toutes lettres,
 * le depot en construit DEUX AUTRES FACONS, invisibles a une lecture
 * litterale.
 *
 *   RANGEES COMME DONNEE — 146 cles distinctes, dans un champ nomme
 *   `cle`, `labelKey` ou `key`, lues au rendu par `t(item.cle)`. La
 *   palette de commandes en portait TRENTE-DEUX QUI N EXISTAIENT DANS
 *   AUCUNE DES DEUX LANGUES : chacune retombait sur son repli
 *   francais, si bien que la palette entiere restait en francais pour
 *   un lecteur anglais, sans que rien ne le signale. C est exactement
 *   le risque que decrit le paragraphe ci-dessus, realise.
 *
 *   CONSTRUITES PAR GABARIT — 44 prefixes distincts, de la forme
 *   t(`goals.difficulties.${p.value}`) ou t("todo.priorities." + p).
 *   On ne peut pas savoir par machine quelles valeurs prendra la
 *   variable ; on peut en revanche exiger que le PREFIXE existe dans
 *   les deux langues et y porte EXACTEMENT les memes enfants. Une
 *   rarete ajoutee d un seul cote afficherait sa propre clef a
 *   l ecran, et la chaine resterait verte.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const RACINE = path.resolve(process.cwd(), "src");
const LANGUES = ["fr", "en"];

/* i18next resout une cle plurielle par des suffixes : une cle appelee
   avec { count } vit sous cle_one / cle_other, jamais sous cle. */
const SUFFIXES = ["", "_zero", "_one", "_two", "_few", "_many", "_other"];

function fichiersSources(dossier, acc = []) {
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    const p = path.join(dossier, e.name);
    if (e.isDirectory()) {
      if (e.name !== "i18n" && e.name !== "node_modules") fichiersSources(p, acc);
    } else if (/\.tsx?$/.test(e.name)) {
      acc.push(p);
    }
  }
  return acc;
}

const feuille = (arbre, chemin) =>
  chemin.split(".").reduce((n, p) => (n && typeof n === "object" ? n[p] : undefined), arbre);

/* Une valeur peut etre un tableau — common.daysShort en est un, lu avec
   returnObjects. Le refuser signalait une cle presente comme manquante. */
const estValeur = (v) =>
  typeof v === "string" || (Array.isArray(v) && v.every((x) => typeof x === "string"));

const presente = (arbre, cle) =>
  SUFFIXES.some((s) => estValeur(feuille(arbre, cle + s)));

const traductions = Object.fromEntries(
  LANGUES.map((l) => [l, JSON.parse(fs.readFileSync(path.join(RACINE, "socle/i18n/locales", l + ".json"), "utf8"))]),
);

const origine = new Map();
const cles = new Set();
/* Les prefixes des cles construites, et le fichier qui les construit. */
const prefixes = new Map();

/* Une cle rangee comme donnee est une cle comme une autre : le champ
   dit qu il en porte une, la valeur est un chemin pointe. C est ainsi
   que la palette de commandes a pu vivre avec trente-deux cles
   inexistantes. */
const CHAMP_CLEF = /\b(?:cle|labelKey|key|i18nKey|cleI18n)\s*:\s*"([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)"/g;
const GABARIT = /\bt\(\s*`([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)\.\$\{/g;
const CONCAT = /\bt\(\s*"([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)\."\s*\+/g;

for (const f of fichiersSources(RACINE)) {
  const source = fs.readFileSync(f, "utf8");
  const court = path.relative(process.cwd(), f).replace(/\\/g, "/");
  const noter = (cle) => {
    cles.add(cle);
    if (!origine.has(cle)) origine.set(cle, court);
  };
  for (const m of source.matchAll(/\bt\(\s*"([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)"/g)) noter(m[1]);
  for (const m of source.matchAll(CHAMP_CLEF)) noter(m[1]);
  for (const re of [GABARIT, CONCAT])
    for (const m of source.matchAll(re)) if (!prefixes.has(m[1])) prefixes.set(m[1], court);
}

/* Un prefixe construit doit exister DES DEUX COTES, et y porter les
   memes enfants : c est tout ce qu on peut verifier sans connaitre la
   valeur de la variable, et c est deja ce qui manquait. */
const prefixesFautifs = [];
for (const [p, ou] of prefixes) {
  const noeuds = LANGUES.map((l) => feuille(traductions[l], p));
  const absent = LANGUES.filter((_, i) => !noeuds[i] || typeof noeuds[i] !== "object" || Array.isArray(noeuds[i]));
  if (absent.length) { prefixesFautifs.push({ p, ou, quoi: "absent ou sans enfants en " + absent.join(", ") }); continue; }
  const [ens1, ens2] = noeuds.map((n) => new Set(Object.keys(n)));
  const seul1 = [...ens1].filter((k) => !ens2.has(k));
  const seul2 = [...ens2].filter((k) => !ens1.has(k));
  if (seul1.length || seul2.length)
    prefixesFautifs.push({ p, ou, quoi: "enfants divergents — " + LANGUES[0] + " seul : ["
      + seul1.join(", ") + "]  " + LANGUES[1] + " seul : [" + seul2.join(", ") + "]" });
}

/* Une page qui n appelle JAMAIS t() etait invisible pour ce
   verificateur : il ne controle que les cles qu on lui donne. « The
   Call » a ainsi vecu avec vingt-trois chaines anglaises en dur sans
   qu aucun controle ne bronche. On signale desormais les pages muettes. */
/* LE DETECTEUR SUIVAIT `src/pages/`, ET LE RANGEMENT PAR DOMAINE LUI A
   FAIT PERDRE SES PAGES. Vu le 28/08 en deplacant l administration :
   ses huit pages etaient les huit muettes signalees depuis des
   semaines, et le controle est passe au vert du jour ou elles ont
   change d adresse. Une garde qui suit un CHEMIN cesse de garder des
   qu on demenage ; celle-ci suit desormais les deux formes. */
const estUnePage = (chemin) =>
  chemin.startsWith("src/pages/") ||
  /^src\/domaines\/[^/]+\/pages\//.test(chemin);

const muettes = [];
for (const f of fichiersSources(RACINE)) {
  const chemin = path.relative(process.cwd(), f).split(path.sep).join("/");
  if (!estUnePage(chemin)) continue;
  const source = fs.readFileSync(f, "utf8");
  if (source.includes("useTranslation") || source.includes("<Trans")) continue;
  // Une page sans texte visible n a rien a traduire.
  const textes = source.match(new RegExp(">[^<>{}]*[A-Za-z]{4,}[^<>{}]*<", "g")) || [];
  if (textes.length >= 2) muettes.push({ chemin, textes: textes.length });
}

const manquantes = [];
for (const cle of [...cles].sort()) {
  const absentes = LANGUES.filter((l) => !presente(traductions[l], cle));
  if (absentes.length > 0) manquantes.push({ cle, absentes, ou: origine.get(cle) });
}

/* Les deux langues doivent aussi rester en phase entre elles. */
const aplatir = (arbre, prefixe = "", acc = new Set()) => {
  for (const [k, v] of Object.entries(arbre)) {
    if (estValeur(v)) acc.add(prefixe + k);
    else if (v && typeof v === "object") aplatir(v, prefixe + k + ".", acc);
  }
  return acc;
};
const [a, b] = LANGUES.map((l) => aplatir(traductions[l]));
const seulementA = [...a].filter((k) => !b.has(k));
const seulementB = [...b].filter((k) => !a.has(k));

console.log(`cles utilisees : ${cles.size} (litterales et rangees comme donnee)`);
console.log(`prefixes construits : ${prefixes.size}`);
if (muettes.length > 0) {
  console.log(`
${muettes.length} page(s) sans aucune traduction :`);
  for (const m of muettes) console.log(`  ${m.chemin}   (~${m.textes} textes en dur)`);
}
console.log(`${LANGUES[0]} : ${a.size} traductions    ${LANGUES[1]} : ${b.size}`);

if (seulementA.length || seulementB.length) {
  console.log(`\nles deux langues divergent :`);
  for (const k of seulementA.slice(0, 20)) console.log(`  seulement en ${LANGUES[0]} : ${k}`);
  for (const k of seulementB.slice(0, 20)) console.log(`  seulement en ${LANGUES[1]} : ${k}`);
}

if (manquantes.length === 0 && !seulementA.length && !seulementB.length && !prefixesFautifs.length) {
  console.log("\naucune cle manquante, aucun prefixe construit en defaut.");
  process.exit(0);
}

if (manquantes.length > 0) {
  console.log(`\n${manquantes.length} cle(s) manquante(s) :`);
  for (const { cle, absentes, ou } of manquantes) {
    console.log(`  ${cle}   [${absentes.join(", ")}]   ${ou}`);
  }
}

if (prefixesFautifs.length > 0) {
  console.log(`\n${prefixesFautifs.length} prefixe(s) construit(s) en defaut :`);
  for (const { p, quoi, ou } of prefixesFautifs) console.log(`  ${p}   ${quoi}   ${ou}`);
  console.log(`
  Une cle construite ne se lit pas en toutes lettres : on ne peut donc
  verifier que le prefixe. Qu il manque d un cote, ou qu il n y porte
  pas les memes enfants, et l ecran affichera le chemin brut a la
  premiere valeur non traduite.`);
}
process.exit(1);
