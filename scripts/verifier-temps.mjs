#!/usr/bin/env node
/* UN JOUR CIVIL NE SE LIT PAS EN UTC, ET IL NE SE FORMATE QU UNE FOIS.
 *
 * Cette garde ferme une classe de panne qui a ete corrigee QUATRE fois
 * dans ce depot, chaque fois separement, chaque fois apres coup :
 *
 *   la bande des series de l analytique — le jour courant disparaissait
 *     tant qu il n etait pas midi ;
 *   les gestes de M.I.A. — « reporte a demain » posait la date d UTC ;
 *   la journee de connexion — la serie basculait a 2 h du matin, et le
 *     succes de minuit etait ingagnable ;
 *   la minuterie de focus — une seance close a 1 h 30 comptait pour la
 *     veille.
 *
 * Quatre corrections, quatre endroits, et la cause etait unique :
 * `d.toISOString().slice(0, 10)` rend le jour d UTC, pas celui du
 * lecteur. Entre minuit et deux heures du matin a Paris, il rend la
 * veille.
 *
 * ET LE MEME FORMATAGE VIVAIT EN HUIT EXEMPLAIRES. Le jour civil
 * — `getFullYear()`, `getMonth() + 1`, `getDate()`, `padStart` — etait
 * reecrit a la main dans huit fichiers de six domaines ; le mois civil
 * dans quatre, dont deux fois mot pour mot dans le meme domaine. C est
 * ce qui explique qu on ait pu corriger la faute quatre fois sans
 * jamais la faire disparaitre.
 *
 * CE QUE CETTE GARDE VERIFIE :
 *
 *   (a) AUCUNE EXTRACTION DE JOUR DEPUIS UTC dans `src/`, sauf les
 *       exceptions nommees ci-dessous, chacune avec sa raison ;
 *   (b) AUCUN FORMATAGE CONCURRENT du jour ou du mois civil hors de
 *       `src/socle/outils/jour.ts`.
 *
 * CE QU ELLE NE VERIFIE PAS. Les fonctions edge (`supabase/functions`)
 * tournent sur l horloge du serveur, pour tous les membres a la fois :
 * un « jour local » n y veut rien dire tant que le fuseau de chacun
 * n est pas connu. C est une decision de conception, pas un oubli, et
 * elle sort du cadre de cette garde.
 *
 *   npm run temps:check
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const RACINE = "src";
const MAISON = "src/socle/outils/jour.ts";

/* Les exceptions, chacune avec ce qui la justifie. Une exception sans
   raison ecrite n en est pas une. */
const TOLEREES = new Map([
  ["src/domaines/succes/logique/connexion.ts",
    "jourUTC est garde exprès, pour mesurer l horloge d avant contre celle qu on vit."],
  ["src/domaines/succes/hooks/useDailyQuests.ts",
    "Le jour d UTC est celui des declencheurs de progression cote base : le passer en local ici, seul, desynchroniserait les quatre."],
  ["src/domaines/mia/hooks/useEtatDuJour.ts",
    "Meme raison : la requete sur daily_quests.date doit parler la meme langue que la base."],
  ["src/domaines/focus/logique/cadran.ts",
    "VW-0908-03 n est pas une date mais une cote de registre : le mois et le jour y sont des chiffres graves, pas une clef."],
]);

const JOUR_UTC = /\.toISOString\(\)\s*\.\s*(?:slice\(\s*0\s*,\s*10\s*\)|split\(\s*["']T["']\s*\)\s*\[\s*0\s*\]|substring\(\s*0\s*,\s*10\s*\))/;
/* Un NUMERO de mois n est pas un formatage — `serie.ts` en compare un
   a une colonne. On n accuse que la mise en forme sur deux chiffres,
   celle qui fabrique une clef de date a la main. */
const FORMAT_MAISON = /getMonth\(\)\s*\+\s*1[^;]*padStart|padStart\([^;]*getMonth\(\)\s*\+\s*1/;

const fichiers = [];
const parcourir = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name).split(path.sep).join("/");
    if (e.isDirectory()) { parcourir(p); continue; }
    if (/\.(ts|tsx)$/.test(p) && !p.includes(".test.")) fichiers.push(p);
  }
};
parcourir(RACINE);

const fautes = [];
for (const f of fichiers) {
  if (f === MAISON) continue;
  const lignes = fs.readFileSync(f, "utf8").split("\n");
  const tolere = TOLEREES.get(f);
  lignes.forEach((l, i) => {
    if (/^\s*(\*|\/\/|\/\*)/.test(l)) return;          /* la prose ne calcule pas */
    if (JOUR_UTC.test(l) && !tolere)
      fautes.push({ f, n: i + 1, quoi: "jour lu en UTC", l: l.trim(), remede: "jourLocal(d)" });
    if (FORMAT_MAISON.test(l) && !tolere)
      fautes.push({ f, n: i + 1, quoi: "formatage concurrent", l: l.trim(), remede: "jourLocal(d) ou moisLocal(d)" });
  });
}

/* Une tolerance qui ne sert plus est une tolerance qui ment : on la
   signale pour qu elle disparaisse avec ce qu elle couvrait. */
const inutiles = [...TOLEREES.keys()].filter((f) => {
  if (!fs.existsSync(f)) return true;
  return !fs.readFileSync(f, "utf8").split("\n")
    .some((l) => !/^\s*(\*|\/\/|\/\*)/.test(l) && (JOUR_UTC.test(l) || FORMAT_MAISON.test(l)));
});

for (const f of fautes) {
  console.log(f.f + ":" + f.n + "  " + f.quoi);
  console.log("    " + f.l.slice(0, 110));
  console.log("    → " + f.remede + ", depuis « @/socle/outils/jour »");
}
for (const f of inutiles) console.log("TOLERANCE INUTILE : " + f + " n a plus de jour lu en UTC.");

const total = fautes.length + inutiles.length;
if (total === 0) {
  console.log("temps : " + fichiers.length + " fichiers, 0 jour lu en UTC hors des "
    + TOLEREES.size + " exceptions nommees, 0 formatage concurrent.");
  process.exit(0);
}
console.log("\n" + total + " probleme(s). Le jour civil se lit et s ecrit dans src/socle/outils/jour.ts,");
console.log("et nulle part ailleurs. Voir l en-tete de ce script pour les quatre pannes qui l ont impose.");
process.exit(1);
