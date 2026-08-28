#!/usr/bin/env node
/* UN FICHIER NE PEUT PLUS GROSSIR.
 *
 * Aucun fichier neuf ne depasse 400 lignes. Les 55 qui les depassent
 * deja sont inscrits dans `taille-plafonds.json` avec leur taille du
 * jour, et cette taille est un PLAFOND : le fichier peut maigrir, jamais
 * grossir. C est un cliquet, pas une liste d exceptions — une liste
 * d exceptions se contente d exister, un cliquet descend.
 *
 * POURQUOI 400 ET PAS UN AUTRE NOMBRE. Ce n est pas une regle de style :
 * c est le seuil au-dela duquel, dans ce depot, un fichier a cesse de se
 * lire d une traite. `pages/Wishlist.tsx` fait 1 081 lignes ; y trouver
 * la ligne qui compte demande de la chercher, et c est exactement le
 * temps qu on a passe pendant l audit du 28/08.
 *
 * CE QUE LE SEUIL NE MESURE PAS : la complexite. Un fichier de 380
 * lignes peut etre pire qu un de 420. Le nombre de lignes n est pas la
 * qualite, c est juste la seule grandeur qu on puisse compter sans se
 * tromper — et elle suffit a empecher la derive.
 *
 *   npm run taille:check       verifie
 *   npm run taille:abaisser    reecrit les plafonds apres un decoupage
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const SEUIL = 400;
const PLAFONDS = path.resolve(process.cwd(), "scripts/taille-plafonds.json");
const abaisser = process.argv.includes("--abaisser");

/* CE QU ON NE COMPTE PAS, ET POURQUOI.
   `socle/supabase/types.ts` est genere par Supabase : le decouper
   serait defait a la prochaine generation. Les `_shared` des fonctions
   Edge sont couverts par `npm run edge:check`. */
const IGNORE = [/^src\/socle\/supabase\//];

const RACINES = ["src", "supabase/functions"];

function sources(dossier, acc = []) {
  if (!fs.existsSync(dossier)) return acc;
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    const p = path.join(dossier, e.name);
    if (e.isDirectory()) {
      if (e.name !== "node_modules") sources(p, acc);
    } else if (/\.tsx?$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const tailles = new Map();
for (const racine of RACINES) {
  for (const f of sources(racine)) {
    const rel = path.relative(process.cwd(), f).replace(/\\/g, "/");
    if (IGNORE.some((m) => m.test(rel))) continue;
    /* On compte les lignes, pas les retours a la ligne : un fichier sans
       saut final compterait une ligne de moins que ce que montre un
       editeur, et le plafond deviendrait faux d une unite. */
    const n = fs.readFileSync(f, "utf8").split(/\r\n|\r|\n/).length;
    tailles.set(rel, n);
  }
}

const plafonds = fs.existsSync(PLAFONDS)
  ? JSON.parse(fs.readFileSync(PLAFONDS, "utf8"))
  : {};

if (abaisser) {
  const neufs = {};
  for (const [rel, n] of [...tailles].sort()) if (n > SEUIL) neufs[rel] = n;
  const partis = Object.keys(plafonds).filter((k) => !(k in neufs));
  const descendus = Object.keys(neufs).filter((k) => k in plafonds && neufs[k] < plafonds[k]);
  fs.writeFileSync(PLAFONDS, JSON.stringify(neufs, null, 2) + "\n", "utf8");
  console.log(`plafonds reecrits : ${Object.keys(neufs).length} fichier(s) au-dessus de ${SEUIL}.`);
  for (const p of partis) console.log(`  passe sous le seuil : ${p}  (etait ${plafonds[p]})`);
  for (const d of descendus) console.log(`  abaisse : ${d}  ${plafonds[d]} → ${neufs[d]}`);
  process.exit(0);
}

const neufsTropGros = [];
const grossis = [];
const aAbaisser = [];
const perimes = [];

for (const [rel, n] of tailles) {
  const plafond = plafonds[rel];
  if (plafond === undefined) {
    if (n > SEUIL) neufsTropGros.push({ rel, n });
  } else if (n > plafond) {
    grossis.push({ rel, n, plafond });
  } else if (n < plafond) {
    aAbaisser.push({ rel, n, plafond });
  }
}

/* Un plafond qui ne designe plus rien — fichier supprime, deplace, ou
   redescendu sous le seuil — doit disparaitre. Sans cela la liste
   grossit en silence pendant que le depot maigrit. */
for (const rel of Object.keys(plafonds)) {
  if (!tailles.has(rel)) perimes.push({ rel, raison: "fichier absent ou renomme" });
  else if (tailles.get(rel) <= SEUIL) perimes.push({ rel, raison: `descendu a ${tailles.get(rel)}` });
}

const surveilles = Object.keys(plafonds).length;
const total = [...tailles.values()].reduce((s, n) => s + n, 0);
console.log(
  `taille : ${tailles.size} fichier(s), ${total.toLocaleString("fr-FR")} lignes. ` +
  `${surveilles} au-dessus de ${SEUIL}, sous plafond.`,
);

if (neufsTropGros.length) {
  console.log(`\n${neufsTropGros.length} FICHIER(S) NEUF(S) AU-DESSUS DE ${SEUIL} LIGNES :`);
  for (const { rel, n } of neufsTropGros) console.log(`  ${String(n).padStart(5)}  ${rel}`);
  console.log("\nDecoupez-le, ou — si c est delibere — lancez `npm run taille:abaisser`");
  console.log("pour l inscrire, en sachant qu il ne pourra plus jamais grossir.");
}

if (grossis.length) {
  console.log(`\n${grossis.length} FICHIER(S) ONT GROSSI AU-DELA DE LEUR PLAFOND :`);
  for (const { rel, n, plafond } of grossis)
    console.log(`  ${rel}\n      ${plafond} → ${n}   (+${n - plafond})`);
  console.log("\nCe fichier etait deja trop gros. Sortez-en autant que vous y ajoutez.");
}

if (perimes.length) {
  console.log(`\n${perimes.length} PLAFOND(S) QUI NE SERVENT PLUS :`);
  for (const { rel, raison } of perimes) console.log(`  ${rel}   (${raison})`);
  console.log("\n`npm run taille:abaisser` nettoie la liste.");
}

if (aAbaisser.length) {
  console.log(`\n${aAbaisser.length} fichier(s) ont maigri — leur plafond peut descendre :`);
  for (const { rel, n, plafond } of aAbaisser.slice(0, 10))
    console.log(`  ${rel}   ${plafond} → ${n}`);
  if (aAbaisser.length > 10) console.log(`  … et ${aAbaisser.length - 10} autres`);
  console.log("`npm run taille:abaisser` les enregistre. (Ceci n est pas une erreur.)");
}

const casse = neufsTropGros.length + grossis.length + perimes.length;
if (casse === 0) console.log("\naucun depassement.");
process.exit(casse === 0 ? 0 : 1);
