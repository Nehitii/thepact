import fs from "node:fs";
import path from "node:path";

/* COMPARER DEUX EMPREINTES D ECRAN.
 *
 * L empreinte elle-meme se prend dans le navigateur — voir
 * `empreinte-navigateur.js`, qui porte les quatre pieges de la mesure.
 * Ce fichier-ci ne fait qu une chose, et refuse quand elle echoue :
 * dire si l ecran rend AUTRE CHOSE qu avant.
 *
 *   node scripts/empreinte.mjs poser <nom> <releve.json>
 *   node scripts/empreinte.mjs comparer <nom> <releve.json>
 *   node scripts/empreinte.mjs lister
 *
 * « poser » enregistre la reference AVANT la coupe. « comparer » la
 * confronte APRES, et sort en erreur au moindre ecart : c est une
 * garde, pas un rapport.
 *
 * TROIS MESURES, TROIS POIDS. La liste des nombres affiches est la
 * preuve — c est elle qui a tranche quand le compte de points variait
 * tout seul. Le texte situe l ecart. La geometrie ne fait que le
 * decrire, et ne suffit jamais a l affirmer seule.
 */
const DOSSIER = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "empreintes");
const [, , commande, nom, fichier] = process.argv;

const lire = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const chemin = (n) => path.join(DOSSIER, `${n}.json`);

function resume(e) {
  const v = Object.entries(e.vues ?? {});
  return `${v.length} vue(s) — ${v.map(([k, s]) => `${k} (${s.nombres.length} nombres)`).join(", ")}`;
}

if (commande === "lister") {
  if (!fs.existsSync(DOSSIER)) { console.log("aucune empreinte posee."); process.exit(0); }
  const f = fs.readdirSync(DOSSIER).filter((x) => x.endsWith(".json"));
  if (!f.length) { console.log("aucune empreinte posee."); process.exit(0); }
  for (const x of f) console.log(`  ${x.replace(/\.json$/, "").padEnd(28)} ${resume(lire(path.join(DOSSIER, x)))}`);
  process.exit(0);
}

if (!commande || !nom || !fichier) {
  console.error("usage : empreinte.mjs <poser|comparer> <nom> <releve.json>  |  empreinte.mjs lister");
  process.exit(2);
}

const releve = lire(fichier);
if (releve.journal?.length) for (const l of releve.journal) console.log(`  note du navigateur : ${l}`);
const instables = Object.entries(releve.vues ?? {}).filter(([, s]) => s.instable);
if (instables.length) {
  /* Une vue qui n a jamais cesse de bouger ne peut ni servir de
     reference ni etre comparee : la refuser vaut mieux qu enregistrer
     du bruit sous un nom rassurant. */
  console.error(`\nREFUSE : ${instables.length} vue(s) jamais au repos — ${instables.map(([k]) => k).join(", ")}`);
  process.exit(1);
}

if (commande === "poser") {
  fs.mkdirSync(DOSSIER, { recursive: true });
  fs.writeFileSync(chemin(nom), JSON.stringify(releve, null, 1), "utf8");
  console.log(`empreinte « ${nom} » posee sur ${releve.route} : ${resume(releve)}`);
  process.exit(0);
}

if (commande !== "comparer") { console.error(`commande inconnue : ${commande}`); process.exit(2); }
if (!fs.existsSync(chemin(nom))) { console.error(`aucune empreinte « ${nom} » posee.`); process.exit(1); }

const avant = lire(chemin(nom));
let ecarts = 0;

const manquantes = Object.keys(avant.vues).filter((k) => !(k in releve.vues));
const nouvelles = Object.keys(releve.vues).filter((k) => !(k in avant.vues));
for (const k of manquantes) { console.log(`  ${k} : VUE DISPARUE`); ecarts++; }
for (const k of nouvelles) { console.log(`  ${k} : vue apparue`); ecarts++; }

for (const [cle, a] of Object.entries(avant.vues)) {
  const b = releve.vues[cle];
  if (!b) continue;
  const dits = [];

  /* 1. LES NOMBRES — la preuve. */
  if (JSON.stringify(a.nombres) !== JSON.stringify(b.nombres)) {
    const n = Math.max(a.nombres.length, b.nombres.length);
    const changes = [];
    for (let i = 0; i < n && changes.length < 6; i++)
      if (a.nombres[i] !== b.nombres[i]) changes.push(`#${i} « ${a.nombres[i] ?? "—"} » → « ${b.nombres[i] ?? "—"} »`);
    dits.push(`NOMBRES ${a.nombres.length} → ${b.nombres.length} : ${changes.join(", ")}`);
  }

  /* 2. LE TEXTE — situe l ecart. */
  const A = a.texte.split("\n"), B = b.texte.split("\n");
  const partis = A.filter((l) => !B.includes(l)), venus = B.filter((l) => !A.includes(l));
  if (partis.length) dits.push(`lignes disparues : ${partis.slice(0, 5).map((l) => `« ${l} »`).join(", ")}${partis.length > 5 ? ` (+${partis.length - 5})` : ""}`);
  if (venus.length) dits.push(`lignes apparues : ${venus.slice(0, 5).map((l) => `« ${l} »`).join(", ")}${venus.length > 5 ? ` (+${venus.length - 5})` : ""}`);

  /* 3. LA GEOMETRIE — decrit, n affirme pas. */
  const geo = ["svg", "paths", "rects", "points", "courbes", "boutons", "champs"]
    .filter((c) => a[c] !== b[c]).map((c) => `${c} ${a[c]} → ${b[c]}`);
  if (geo.length) dits.push(`geometrie : ${geo.join(", ")}`);

  if (dits.length) { console.log(`\n  ${cle}`); for (const d of dits) console.log(`      ${d}`); ecarts++; }
}

if (ecarts) {
  console.error(`\nempreinte « ${nom} » : ${ecarts} vue(s) ont change. Si c est voulu, reposez-la.`);
  process.exit(1);
}
console.log(`empreinte « ${nom} » : ${Object.keys(avant.vues).length} vue(s) identiques — texte, nombres et geometrie.`);
