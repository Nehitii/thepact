#!/usr/bin/env node
/* UNE FEUILLE QUE PERSONNE N IMPORTE NE CASSE RIEN — ELLE DISPARAIT.
 *
 * C est le defaut le plus silencieux du lot. Un fichier TypeScript
 * qu on cesse d importer fait echouer le typecheck, ou au pire le
 * build. Une feuille de style qu on cesse d importer ne fait rien
 * echouer du tout : elle sort du bundle, l ecran perd ses regles, et
 * les six autres gardes restent vertes.
 *
 * C EST ARRIVE DEUX FOIS.
 *
 *   - `boutique.css`, en rangeant la boutique : orpheline pendant
 *     toute une chaine verte, reperee a l oeil.
 *   - `revue.css`, le 29/08 : on l a fait descendre de main.tsx vers
 *     le domaine de la revue en retirant l import global, sans en
 *     poser un dans le modal. Typecheck, six gardes, 81 tests, tout
 *     passe. C est le BUILD qui a parle — plus une seule regle `.rv-`
 *     dans dist/, cinquante selecteurs evapores.
 *
 * Deux fois le meme defaut, dont une apres l avoir deja vu : ce n est
 * plus une inattention, c est un angle mort de l outillage.
 *
 * CE QUE CE SCRIPT VERIFIE, DANS LES DEUX SENS :
 *   1. toute feuille de `src/` est atteignable depuis `main.tsx`, par
 *      une chaine d imports (TS ou @import CSS) ;
 *   2. tout chemin `.css` cite dans un import pointe vers un fichier
 *      qui existe.
 *
 * La deuxieme moitie double `chemins:check`, qui ne regarde que les
 * chemins cites dans `scripts/` — pas ceux que le code s adresse a
 * lui-meme.
 *
 *   npm run orphelines:check
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const RACINE = path.resolve(process.cwd(), "src");
const rel = (p) => path.relative(RACINE, p).split(path.sep).join("/");

function tous(dossier, acc = []) {
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    const p = path.join(dossier, e.name);
    if (e.isDirectory()) tous(p, acc);
    else acc.push(p);
  }
  return acc;
}

const fichiers = tous(RACINE);
const feuilles = new Set(fichiers.filter((f) => f.endsWith(".css")).map(rel));

/* Les imports de style, quel que soit leur porteur :
     import "@/domaines/revue/revue.css";   (TS/TSX)
     @import "./autre.css";                 (CSS)
   On ne resout que ce qui vise `src/` : une feuille de node_modules
   n est pas notre affaire. */
const CITATION = /(?:import\s+|@import\s+(?:url\()?)["']([^"']+\.css)["']/g;
const citees = new Map(); // feuille visee -> [fichiers qui la citent]
const mortes = [];        // citations qui ne menent nulle part

for (const f of fichiers) {
  if (!/\.(tsx?|css)$/.test(f)) continue;
  const source = fs.readFileSync(f, "utf8");
  const depuis = rel(f);
  for (const m of source.matchAll(CITATION)) {
    const brut = m[1];
    let vise;
    if (brut.startsWith("@/")) vise = brut.slice(2);
    else if (brut.startsWith(".")) vise = rel(path.resolve(path.dirname(f), brut));
    else continue; /* un paquet, pas une feuille a nous */
    if (!citees.has(vise)) citees.set(vise, []);
    citees.get(vise).push(depuis);
    if (!feuilles.has(vise)) mortes.push({ depuis, vise, brut });
  }
}

const orphelines = [...feuilles].filter((f) => !citees.has(f)).sort();

console.log(
  `orphelines : ${feuilles.size} feuille(s), ${citees.size} citee(s), ` +
  `${orphelines.length} orpheline(s), ${mortes.length} citation(s) morte(s).`,
);

let faute = false;

if (orphelines.length) {
  faute = true;
  console.log("\nFEUILLE(S) QUE PERSONNE N IMPORTE — elles ne sortiront pas dans dist/ :");
  for (const f of orphelines) console.log(`  ${f}`);
  console.log(
    "\nImportez-la depuis le fichier qui s en sert, ou supprimez-la.\n" +
    "Une feuille orpheline ne fait echouer aucun test : elle manque, c est tout.",
  );
}

if (mortes.length) {
  faute = true;
  console.log("\nIMPORT(S) DE STYLE QUI NE MENENT NULLE PART :");
  for (const m of mortes) console.log(`  ${m.depuis}\n      ⟶  ${m.brut}`);
}

if (!faute) console.log("chaque feuille a un lecteur.");
process.exit(faute ? 1 : 0);
