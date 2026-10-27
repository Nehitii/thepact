#!/usr/bin/env node
/* UN DOMAINE N ENTRE PAS CHEZ UN AUTRE PAR LA FENETRE.
 *
 * Une fois le depot range par domaine — `domaines/guildes/`,
 * `domaines/finance/`, … — le rangement ne tient que si les domaines ont
 * une PORTE. Sans porte, `guildes/composants/RailGuilde.tsx` finit par
 * importer `finance/hooks/useFinance.ts`, et six mois plus tard on ne
 * peut plus toucher a la finance sans casser les guildes. Le dossier
 * aurait l air range et ne le serait pas.
 *
 * LA REGLE, EN UNE PHRASE : depuis un autre domaine, on n importe qu un
 * chemin de la forme `@/domaines/<nom>` ou `@/domaines/<nom>/index`.
 * Tout ce qu un domaine veut offrir, il le reexporte depuis son index ;
 * tout le reste lui appartient et personne d autre n a a le connaitre.
 *
 * DEUXIEME REGLE : `socle/` ne connait aucun domaine. Le socle est ce
 * qui sert a tous ; s il en nomme un, il n est plus le socle.
 *
 * CE SCRIPT NE GARDE RIEN TANT QUE `src/domaines/` N EXISTE PAS. Il le
 * dit et sort en succes — mais il a ete eprouve avant d etre pose, sur
 * un decor fabrique expres (voir `--racine`), parce qu une garde qu on
 * n a jamais vue refuser ne prouve rien.
 *
 *   npm run domaines:check
 *   node scripts/verifier-domaines.mjs --racine chemin/vers/un/decor
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const iRacine = process.argv.indexOf("--racine");
const RACINE = path.resolve(
  process.cwd(),
  iRacine > -1 ? process.argv[iRacine + 1] : "src",
);
const DOMAINES = path.join(RACINE, "domaines");

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

if (!fs.existsSync(DOMAINES)) {
  console.log(
    "domaines : `src/domaines/` n existe pas encore — rien a garder.\n" +
    "           (etape 2 du plan de masse ; la garde est deja ecrite et eprouvee.)",
  );
  process.exit(0);
}

const noms = fs
  .readdirSync(DOMAINES, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

/* Statique et dynamique sont releves SEPAREMENT : la seule derogation
   de ce script depend de la difference entre les deux. */
const STATIQUES = [
  /import\s[^;]{0,400}?from\s*["'](@\/[^"']+)["']/g,
  /import\s*["'](@\/[^"']+)["']/g,
];
const DYNAMIQUE = /import\s*\(\s*["'](@\/[^"']+)["']\s*\)/g;

/* CE QUI EST ENCORE TOLERE, ET POURQUOI.
 *
 * Meme discipline que la garde des couches : chaque entree porte sa
 * raison, et une tolerance qui ne sert plus FAIT ECHOUER le script. On
 * note la paire « qui » → « quoi », pas seulement le fichier : une
 * effraction se juge sur sa destination. */
const TOLERE = new Map([
  /* LA DERNIERE TOLERANCE EST TOMBEE (etape 4, 29/08). L apercu d avis
     de l administration importait `domaines/social/inbox.css` : entree
     par la fenetre, toleree parce que l apercu reecrit a la main le
     balisage de AvisCarte pour rester fidele.

     La mesure a donne la coupe : neuf des trente-cinq classes `.bx-*`
     sont ecrites par les DEUX domaines, aucune n est propre a
     l administration, vingt-six restent au social. Les neuf sont
     montees dans `socle/ds/avis.css`, que les deux importent. Deux
     blocs `@media` ont ete decoupes plutot que dupliques.

     CE QUI N EST PAS RESOLU, ET QU IL FAUT DIRE : les deux BALISAGES
     peuvent encore diverger. Seul le style est commun. La vraie sortie
     serait un composant de presentation pur — sans hook ni requete —
     que les deux rendraient ; c est un arbitrage de conception, pas de
     rangement. L autre sortie, rendre AvisCarte tel quel, reste
     ecartee : il appelle useAuth, useNavigate, useQueryClient et le RPC
     `claim_notification_reward`, donc un apercu aurait un bouton
     « reclamer » actif sur un identifiant fictif. */
]);

const effractions = [];
const socleIndiscret = [];
const tolereesVues = new Set();

for (const f of sources(RACINE)) {
  const rel = path.relative(RACINE, f).replace(/\\/g, "/");
  const source = fs.readFileSync(f, "utf8");

  const cibles = new Map(); // chemin → "statique" | "differe"
  for (const c of source.matchAll(DYNAMIQUE)) cibles.set(c[1].slice(2), "differe");
  for (const m of STATIQUES) for (const c of source.matchAll(m)) cibles.set(c[1].slice(2), "statique");

  const chezMoi = rel.startsWith("domaines/") ? rel.split("/")[1] : null;
  /* LE ROUTAGE CONNAIT LES PAGES, ET C EST SA FONCTION.
     `app/prefetchRoutes.ts` tient le registre des routes : il doit
     pouvoir nommer `domaines/x/pages/Y`. Le faire passer par la porte
     ramenerait toutes les pages dans le paquet de demarrage.
     La derogation est donc etroite, et double : seul `app/`, et
     seulement en import DIFFERE — un import statique d une page depuis
     `app/` defairait le decoupage de toute facon. */
  const jeSuisLeRoutage = rel.startsWith("app/") || rel === "App.tsx";

  for (const [cible, mode] of cibles) {
    if (!cible.startsWith("domaines/")) continue;
    const [, vise, ...reste] = cible.split("/");
    if (!noms.includes(vise)) continue;

    if (rel.startsWith("socle/")) {
      socleIndiscret.push({ rel, cible });
      continue;
    }
    if (vise === chezMoi) continue;

    if (jeSuisLeRoutage && mode === "differe" && reste[0] === "pages") continue;

    /* La porte, et rien d autre : `domaines/x` ou `domaines/x/index`. */
    const parLaPorte = reste.length === 0 || (reste.length === 1 && /^index(\.tsx?)?$/.test(reste[0]));
    if (parLaPorte) continue;

    const cle = `${rel}|${cible}`;
    if (TOLERE.has(cle)) { tolereesVues.add(cle); continue; }
    effractions.push({ rel, cible, vise, chezMoi, mode });
  }
}

const perimees = [...TOLERE.keys()].filter((k) => !tolereesVues.has(k));

console.log(
  `domaines : ${noms.length} domaine(s) — ${noms.join(", ")}. ` +
  `${effractions.length} effraction(s), ${socleIndiscret.length} fuite(s) du socle, ` +
  `${tolereesVues.size} toleree(s).`,
);

if (perimees.length) {
  console.log(`\n${perimees.length} TOLERANCE(S) QUI NE SERVENT PLUS — a retirer de TOLERE :`);
  for (const p of perimees) console.log(`  ${p.replace("|", "\n      ⟶ ")}`);
}

if (effractions.length) {
  console.log("\nUN DOMAINE IMPORTE L INTERIEUR D UN AUTRE :");
  for (const e of effractions) {
    console.log(`  ${e.rel}`);
    console.log(`      ${e.chezMoi ? `(${e.chezMoi})` : "(hors domaine)"} ⟶ ${e.cible}`);
    console.log(`      passez par @/domaines/${e.vise}, et reexportez-y ce qui doit sortir.`);
  }
}

if (socleIndiscret.length) {
  console.log("\nLE SOCLE NOMME UN DOMAINE — il cesse alors d etre le socle :");
  for (const s of socleIndiscret) console.log(`  ${s.rel}  ⟶  ${s.cible}`);
}

process.exit(effractions.length + socleIndiscret.length + perimees.length === 0 ? 0 : 1);
