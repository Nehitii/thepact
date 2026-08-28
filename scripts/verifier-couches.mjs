#!/usr/bin/env node
/* UNE COUCHE BASSE NE DOIT PAS APPELER UNE COUCHE HAUTE.
 *
 * L application est faite de couches empilees : les types et les feuilles
 * de style ne dependent de rien ; la logique pure (`lib/`) depend d eux ;
 * les hooks dependent de la logique ; les composants dependent des hooks ;
 * les pages dependent des composants. Chaque fleche descend.
 *
 * Quand une fleche remonte, deux choses cassent en meme temps :
 *
 *   - ON NE PEUT PLUS LIRE UN FICHIER SEUL. `lib/miaReflexes.ts` importe
 *     `hooks/useEtatDuJour` : pour comprendre une fonction pure, il faut
 *     ouvrir un hook React, donc un contexte, donc un fournisseur. La
 *     logique cesse d etre testable sans monter la moitie de l application.
 *
 *   - LE DECOUPAGE DU BUNDLE SE DEFAIT. Un `lib/` qui pointe vers `pages/`
 *     traine les pages dans le morceau commun. C est ce qui gonflait le
 *     chemin critique avant la passe du 27/08.
 *
 * CE QUE CE SCRIPT NE FAIT PAS : juger. Il ne dit pas qu un import est
 * laid, il dit qu il remonte. Les exceptions ci-dessous sont datees et
 * chacune porte la raison pour laquelle elle est encore la.
 *
 *   npm run couches:check
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const RACINE = path.resolve(process.cwd(), "src");

/* LE RANG DECIDE DU SENS AUTORISE : on ne peut importer que vers un rang
   INFERIEUR OU EGAL au sien.

   Une feuille de style et une image sont au rang 0, comme un type : ce
   sont des ressources inertes. Une premiere version de ce script les
   comptait au rang le plus haut parce qu elles vivent a la racine de
   `src/` — elle signalait 57 fausses inversions, dont chaque
   `import "@/styles/focus.css"` d une page. Le rang suit la nature du
   fichier, pas son adresse.

   ET `lib/` EST SEUL A SON RANG, EN DESSOUS DES COMPOSANTS shadcn.
   La deuxieme version les mettait ensemble — les deux etant « du socle ».
   Un essai l a prise en defaut : on a ajoute
   `import { Button } from "@/components/ui/button"` dans `lib/currency.ts`
   et la garde a dit oui. Or de la logique pure qui importe un composant
   React cesse d etre testable sans DOM, et c est exactement ce qu on
   veut interdire. Meme rang ne veut pas dire meme nature. */
const RANGS = [
  [/^styles\//,               0, "styles"],
  [/^assets\//,               0, "assets"],
  [/\.css$/,                  0, "css"],
  [/^integrations\//,         0, "integrations"],
  [/^types\//,                0, "types"],
  [/^content\//,              0, "content"],
  [/^i18n\//,                 0, "i18n"],
  [/^lib\//,                  1, "lib"],
  [/^components\/ui\//,       2, "ui"],
  [/^components\/ds\//,       2, "ds"],
  [/^contexts\//,             3, "contextes"],
  [/^hooks\//,                4, "hooks"],

  /* UN DOMAINE REJOUE L ECHELLE CHEZ LUI. Ranger par domaine ne doit
     pas revenir a mettre tout au meme rang : `logique/` reste de la
     logique pure, et n a pas plus le droit d appeler un composant
     parce qu il est voisin. L index est au sommet du domaine — c est
     lui qui assemble, donc lui seul peut tout voir. */
  /* Un fichier de types d un domaine est inerte, comme `types/` a la
     racine : rang 0. Sans cette ligne il tombait dans la regle
     generique `domaines/` au rang 5, et le hook du journal important
     ses propres types passait pour une inversion.

     `(\.|$)` et non `\.` : ce classement s applique aussi bien au
     FICHIER `types.ts` qu au CHEMIN D IMPORT `@/domaines/journal/types`,
     qui lui n a pas d extension. La premiere version n attrapait que le
     premier des deux, et l inversion restait. */
  [/^domaines\/[^/]+\/types(\.|$)/, 0, "types de domaine"],

  [/^domaines\/[^/]+\/logique\//,    1, "logique de domaine"],
  [/^domaines\/[^/]+\/hooks\//,      4, "hooks de domaine"],
  [/^domaines\/[^/]+\/composants\//, 5, "composants de domaine"],
  [/^domaines\/[^/]+\/pages\//,      6, "pages de domaine"],
  [/^domaines\/[^/]+\/index\./,      6, "porte de domaine"],
  [/^domaines\//,                    5, "domaines"],

  [/^components\//,           5, "composants"],
  [/^pages\//,                6, "pages"],
  [/^app\//,                  7, "app"],
];

/* Ces trois-la vivent a la racine de `src/` et pilotent l application
   entiere : ils ont le droit de tout importer. Ils sont au meme rang
   que `app/`, et non en dessous — une premiere version les mettait a 6
   alors que `app/` est a 7, et `App.tsx` important son propre registre
   de routes passait pour une inversion. */
const SOMMET = new Set(["App.tsx", "main.tsx", "App.css"]);

function classer(rel) {
  if (SOMMET.has(rel)) return { rang: 7, nom: "app" };
  for (const [motif, rang, nom] of RANGS) if (motif.test(rel)) return { rang, nom };
  return { rang: 6, nom: "racine" };
}

/* CE QUI EST ENCORE TOLERE, ET JUSQU A QUAND.
 *
 * Une exception se note par le fichier qui remonte. Elle disparait quand
 * l etape correspondante du plan de masse est faite ; ce script ne
 * connait pas le plan, mais la ligne ci-dessous dit ce qu on attend.
 *
 * Toute exception qui ne sert plus fait echouer le script : une garde
 * qui traine des exceptions perimees ne garde plus rien. */
const TOLERE = new Map([
  /* LES DEUX PREFETCH ONT REJOINT `app/` (etape 2, domaine 2). Ils ne
     sont plus des inversions du tout : `app/` est la racine de
     composition, elle a le droit de connaitre les pages et les hooks.
     Vingt-deux inversions ont disparu par ce seul deplacement, sans
     qu une ligne de logique change — c est ce que le plan de masse
     annoncait. */

  ["lib/brigade.ts",         "etape 3 — importe hooks/useGoals pour un type"],

  /* M.I.A. A DEMENAGE (etape 2, 28/08). Les sept tolerances `lib/mia*`
     ont disparu avec les fichiers. Quatre reviennent sous leur nouveau
     chemin : la logique appelle encore un hook React, et c est un vrai
     defaut de conception, pas un effet du rangement.

     Les six autres sont mortes pour de bon — elles ne portaient que
     `import type { ExpressionMia } from ".../VisageMia"`. Le type est
     descendu dans `logique/visages.ts`, qui parle deja de visages. */
  ["domaines/mia/logique/gestes.ts",        "etape 3 — appelle useEtatDuJour ; doit le recevoir en argument"],
  ["domaines/mia/logique/humeur.ts",        "etape 3 — idem"],
  ["domaines/mia/logique/reflexes.ts",      "etape 3 — idem"],
  ["domaines/mia/logique/reflexes.test.ts", "etape 3 — suit reflexes.ts"],

  ["lib/superGoals.ts",      "etape 3 — importe components/goals/super pour un type"],
  ["lib/todo/natures.ts",    "etape 3 — importe hooks/useTodoList pour un type"],
  ["hooks/useAnalytics.ts",  "etape 3 — importe PeriodSelector pour son type de periode"],
  ["hooks/useAnalyticsState.ts", "etape 3 — idem"],
  ["hooks/useCalendarEvents.ts", "etape 3 — importe components/calendar/temps"],
  ["hooks/useGoals.ts",      "etape 3 — importe components/goals/super/types"],
  ["hooks/useParticleEffect.tsx", "etape 3 — importe components/ParticleEffect"],
  ["components/ui/button.tsx",  "etape 3 — SoundContext : arbitrage a rendre, pas un simple deplacement"],
  ["components/ui/dialog.tsx",  "etape 3 — idem"],
  ["components/ui/switch.tsx",  "etape 3 — idem"],
  ["components/ui/tabs.tsx",    "etape 3 — idem"],
  ["components/ds/DSBackground.tsx", "etape 3 — importe CyberBackground et AuraBackground"],
  /* `components/ds/DSPageHeader.tsx` a ete supprime le 28/08 : il
     n etait rendu que par `ModuleHeader`, lui-meme @deprecated et rendu
     nulle part. L inversion `ds → composants` qu il portait n a pas ete
     deplacee, elle a disparu avec le code. */
  ["components/focus/FocusToolbar.tsx", "etape 3 — importe pages/Focus pour un type"],
  ["types/finance.ts",       "etape 3 — importe lib/financeCategories"],
]);

function sources(dossier, acc = []) {
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    const p = path.join(dossier, e.name);
    if (e.isDirectory()) {
      if (e.name !== "node_modules") sources(p, acc);
    } else if (/\.tsx?$/.test(e.name)) acc.push(p);
  }
  return acc;
}

/* TROIS PASSES, PAS UNE ALTERNATIVE.
 *
 * Une seule expression avec des alternatives laissait la branche
 * « import … from » avaler les imports dynamiques : `import("./X")` etait
 * lu comme un import statique de `./X`, et l inverse. Trois passes
 * separees ne peuvent pas se voler leurs correspondances. */
const MOTIFS = [
  /import\s[^;]{0,400}?from\s*["'](@\/[^"']+)["']/g,
  /import\s*\(\s*["'](@\/[^"']+)["']\s*\)/g,
  /import\s*["'](@\/[^"']+)["']/g,
];

const inversions = [];
const exceptionsUtilisees = new Set();

for (const f of sources(RACINE)) {
  const rel = path.relative(RACINE, f).replace(/\\/g, "/");
  const de = classer(rel);
  const source = fs.readFileSync(f, "utf8");

  const cibles = new Set();
  for (const m of MOTIFS) for (const c of source.matchAll(m)) cibles.add(c[1].slice(2));

  for (const cible of cibles) {
    const vers = classer(cible);
    if (vers.rang <= de.rang) continue;
    if (TOLERE.has(rel)) { exceptionsUtilisees.add(rel); continue; }
    inversions.push({ rel, cible, de: de.nom, vers: vers.nom });
  }
}

const perimees = [...TOLERE.keys()].filter((k) => !exceptionsUtilisees.has(k));

console.log(`couches : ${inversions.length} inversion(s) hors tolerance, ` +
            `${exceptionsUtilisees.size} fichier(s) encore toleres.`);

if (inversions.length > 0) {
  console.log("\nUNE COUCHE BASSE APPELLE UNE COUCHE HAUTE :");
  for (const i of inversions) {
    console.log(`  ${i.rel}`);
    console.log(`      (${i.de}) ⟶ (${i.vers})  ${i.cible}`);
  }
  console.log("\nDeplacez le fichier, ou faites-lui recevoir en argument ce qu il va chercher.");
  console.log("Si l inversion est assumee, ajoutez-la a TOLERE avec sa raison et son echeance.");
}

if (perimees.length > 0) {
  console.log(`\n${perimees.length} TOLERANCE(S) QUI NE SERVENT PLUS — a retirer de TOLERE :`);
  for (const p of perimees) console.log(`  ${p}   « ${TOLERE.get(p)} »`);
}

process.exit(inversions.length === 0 && perimees.length === 0 ? 0 : 1);
