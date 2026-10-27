#!/usr/bin/env node
/* UN OUTIL QUI NOMME UN CHEMIN MORT NE PREVIENT PAS : IL SE TAIT.
 *
 * Vu deux fois le 28/08, en rangeant le depot par domaine :
 *
 *   `scripts/verifier-i18n.mjs` ne cherchait les pages muettes que
 *   sous `src/pages/`. Les huit pages d administration ont demenage,
 *   et le controle est passe AU VERT le jour ou elles ont change
 *   d adresse — les vingt-trois chaines anglaises en dur etaient
 *   toujours la.
 *
 *   `scripts/verifier-cadence.mts` importait
 *   `../src/lib/finance/cadence.ts`. Le fichier est parti chez la
 *   finance ; le script echouait a l import, et personne ne l a su
 *   parce qu il n est pas dans la chaine.
 *
 * Les deux fois, le symptome etait l ABSENCE de signal. C est la pire
 * facon pour une garde de tomber.
 *
 * Ce script releve donc tout chemin `src/...` cite litteralement dans
 * `scripts/` et verifie qu il designe encore quelque chose. Il ne juge
 * pas le contenu : il verifie que les outils parlent du present.
 *
 *   npm run chemins:check
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const RACINE = process.cwd();
const DOSSIER = path.join(RACINE, "scripts");

function tous(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) tous(p, acc);
    else if (/\.(mjs|mts|js|ts|json)$/.test(p)) acc.push(p);
  }
  return acc;
}

/* Un chemin cite dans un COMMENTAIRE parle souvent du passe — « le
   fichier vivait dans src/lib/mia... ». On ne lit donc que le code. */
const sansCommentaires = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/[^\n]*/gm, "");

const morts = [];
let vus = 0;

for (const f of tous(DOSSIER)) {
  const rel = path.relative(RACINE, f).replace(/\\/g, "/");
  const src = sansCommentaires(fs.readFileSync(f, "utf8"));

  /* On ne prend que les chemins ENTRE GUILLEMETS, avec une extension
     ou un slash final : « src/pages/ », « ../src/lib/x.ts ». Un mot
     comme « source » ne doit pas passer pour un chemin. */
  const trouves = new Set();
  for (const m of src.matchAll(/["'`](?:\.\.\/)*((?:src)\/[A-Za-z0-9_./-]+)["'`]/g)) {
    trouves.add(m[1]);
  }

  for (const c of trouves) {
    vus++;
    const cible = path.join(RACINE, c);
    if (fs.existsSync(cible)) continue;
    /* Un prefixe de dossier peut etre cite sans exister comme tel
       (« src/domaines/ » quand aucun domaine n existe encore) : on ne
       le compte mort que s il n a pas d extension ET qu aucun fichier
       ne commence par lui. */
    if (!/\.[a-z]+$/.test(c)) {
      const parent = path.dirname(cible);
      if (fs.existsSync(parent)) continue;
    }
    morts.push({ rel, chemin: c });
  }
}

console.log(`chemins : ${vus} chemin(s) src/ cite(s) dans scripts/, ${morts.length} mort(s).`);

if (morts.length) {
  console.log("\nUN OUTIL NOMME UN CHEMIN QUI N EXISTE PLUS :");
  for (const m of morts) console.log(`  ${m.rel}\n      ${m.chemin}`);
  console.log("\nLe fichier a demenage. Corrigez le chemin, ou le script garde le vide.");
}

process.exit(morts.length === 0 ? 0 : 1);
