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
 * Il ne lit que les cles litterales — t("a.b"). Les cles construites
 * (t("prefixe." + variable)) lui echappent par nature ; c est une raison
 * de plus de les eviter.
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

const presente = (arbre, cle) =>
  SUFFIXES.some((s) => typeof feuille(arbre, cle + s) === "string");

const traductions = Object.fromEntries(
  LANGUES.map((l) => [l, JSON.parse(fs.readFileSync(path.join(RACINE, "i18n/locales", l + ".json"), "utf8"))]),
);

const origine = new Map();
const cles = new Set();
for (const f of fichiersSources(RACINE)) {
  const source = fs.readFileSync(f, "utf8");
  for (const m of source.matchAll(/\bt\(\s*"([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)"/g)) {
    cles.add(m[1]);
    if (!origine.has(m[1])) origine.set(m[1], path.relative(process.cwd(), f).replace(/\\/g, "/"));
  }
}

const manquantes = [];
for (const cle of [...cles].sort()) {
  const absentes = LANGUES.filter((l) => !presente(traductions[l], cle));
  if (absentes.length > 0) manquantes.push({ cle, absentes, ou: origine.get(cle) });
}

/* Les deux langues doivent aussi rester en phase entre elles. */
const aplatir = (arbre, prefixe = "", acc = new Set()) => {
  for (const [k, v] of Object.entries(arbre)) {
    if (typeof v === "string") acc.add(prefixe + k);
    else if (v && typeof v === "object") aplatir(v, prefixe + k + ".", acc);
  }
  return acc;
};
const [a, b] = LANGUES.map((l) => aplatir(traductions[l]));
const seulementA = [...a].filter((k) => !b.has(k));
const seulementB = [...b].filter((k) => !a.has(k));

console.log(`cles litterales utilisees : ${cles.size}`);
console.log(`${LANGUES[0]} : ${a.size} traductions    ${LANGUES[1]} : ${b.size}`);

if (seulementA.length || seulementB.length) {
  console.log(`\nles deux langues divergent :`);
  for (const k of seulementA.slice(0, 20)) console.log(`  seulement en ${LANGUES[0]} : ${k}`);
  for (const k of seulementB.slice(0, 20)) console.log(`  seulement en ${LANGUES[1]} : ${k}`);
}

if (manquantes.length === 0 && !seulementA.length && !seulementB.length) {
  console.log("\naucune cle manquante.");
  process.exit(0);
}

if (manquantes.length > 0) {
  console.log(`\n${manquantes.length} cle(s) manquante(s) :`);
  for (const { cle, absentes, ou } of manquantes) {
    console.log(`  ${cle}   [${absentes.join(", ")}]   ${ou}`);
  }
}
process.exit(1);
