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
  /* LE SOCLE REJOUE LA MEME ECHELLE, avec les memes rangs : ce n est
     pas une couche de plus, c est l ancienne infrastructure rangee
     sous un seul toit. `supabase/` et `i18n/` sont inertes, `outils/`
     est de la logique pure, `ui/` et `ds/` presentent, `contextes/`
     fournit, `hooks/` compose. */
  [/^socle\/supabase\//,      0, "supabase"],
  [/^socle\/i18n\//,          0, "i18n"],
  [/^socle\/outils\//,        1, "outils du socle"],
  /* `(\/|$)` et non `\/` : les domaines importent la BARRIQUE,
     `@/socle/ds` sans barre finale. Sans cette alternative le chemin
     tombait dans la regle par defaut au rang 6, et trois composants
     qui importent le systeme de design passaient pour des inversions.
     Meme piege que `types(\.|$)` sur les domaines. */
  [/^socle\/ui(\/|$)/,        2, "ui"],
  [/^socle\/ds(\/|$)/,        2, "ds"],
  [/^socle\/contextes\//,     3, "contextes"],
  [/^socle\/hooks\//,         4, "hooks du socle"],

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

  /* `lib/todo/natures.ts` allait chercher `TodoTaskType` dans son hook.
     En rangeant les taches (28/08), les NEUF types du domaine sont
     descendus d un coup dans `domaines/taches/types.ts` — quatrieme
     fois que le motif se presente, donc on l a traite en entier plutot
     que de deplacer les deux types genants. `useTodoList` les
     reexporte. */

  /* LES TROIS TOLERANCES DES OBJECTIFS SONT MORTES ENSEMBLE (28/08).
     `brigade`, `superGoals` et `useGoals` importaient tous un type
     declare ailleurs — `Goal` dans son hook, `SuperGoalRule` dans un
     composant. Les deux sont descendus dans
     `domaines/objectifs/types.ts`, et les hooks les reexportent.

     HUITIEME FOIS LE MOTIF, ET LE PLUS COUTEUX : ce n etait pas une
     couche interne qui remontait, c etaient CINQ DOMAINES qui
     dependaient d un hook React pour connaitre la forme d un objectif —
     la finance pour compter les pieces, les souhaits pour la
     synchronisation, les succes pour l experience, le social pour
     choisir un objectif a partager, le profil pour la carte
     d identite. */

  ["hooks/useAnalytics.ts",  "etape 3 — importe PeriodSelector pour son type de periode"],
  ["hooks/useAnalyticsState.ts", "etape 3 — idem"],
  /* `hooks/useCalendarEvents.ts` importait `components/calendar/temps`.
     Les deux sont entres dans `domaines/agenda` en le rangeant (28/08) :
     le hook chez lui, `temps.ts` dans `logique/`. Ce n etait pas une
     erreur de conception, seulement deux fichiers du meme module ranges
     dans deux couches differentes. */
  ["socle/hooks/useParticleEffect.tsx", "etape 3 — importe components/ParticleEffect, qui n est pas encore range"],
  ["socle/ui/button.tsx",  "etape 3 — SoundContext : arbitrage a rendre, pas un simple deplacement"],
  ["socle/ui/dialog.tsx",  "etape 3 — idem"],
  ["socle/ui/switch.tsx",  "etape 3 — idem"],
  ["socle/ui/tabs.tsx",    "etape 3 — idem"],
  /* `components/ds/DSBackground.tsx` n est plus une inversion : ses deux
     fonds, `CyberBackground` et `AuraBackground`, l ont rejoint dans
     `ds/` en rangeant la finance (28/08). Il etait leur SEUL lecteur —
     l un vivait a la racine des composants, l autre sous
     `finance/aura/`, et aucun des deux n avait de raison d y etre.

     `types/finance.ts` non plus : l interface `FinanceCategory` etait
     declaree au milieu des donnees de `financeCategories.ts`, et le
     fichier de types allait l y chercher par un import inline. Elle vit
     desormais dans `domaines/finance/types.ts`. */

  /*  a cesse d etre une
     inversion en rangeant les objectifs et le socle : il prenait les
     types Goal et CostItem dans leurs hooks, il les prend maintenant
     par la porte des objectifs — et une porte n est pas une couche.
     C etait ecrit comme une echeance : « se resoudra quand objectifs
     et souhaits seront ranges ». C est arrive. */
  /* `components/ds/DSPageHeader.tsx` a ete supprime le 28/08 : il
     n etait rendu que par `ModuleHeader`, lui-meme @deprecated et rendu
     nulle part. L inversion `ds → composants` qu il portait n a pas ete
     deplacee, elle a disparu avec le code. */
  /* `components/focus/FocusToolbar.tsx` allait chercher `ObjetClause`
     dans `pages/Focus` : la derniere inversion `composants → pages` du
     depot. Le type est descendu dans `domaines/focus/types.ts` en
     rangeant le domaine (28/08), et la page le reexporte. */
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

  /* Dans quel domaine suis-je ? Rien, si je n en suis pas. */
  const monDomaine = rel.startsWith("domaines/") ? rel.split("/")[1] : null;

  for (const cible of cibles) {
    /* LA PORTE D UN AUTRE DOMAINE N EST PAS UNE COUCHE, C EST UNE
       FRONTIERE — et ce n est pas ce script qui en juge.
       `domaines/agenda/hooks/useCalendarEvents.ts` importe
       `@/domaines/taches` : vu comme un rang, c est un hook (4) qui
       appelle un domaine (5), donc une inversion. Vu comme ce que
       c est, c est une dependance externe, au meme titre qu une
       bibliotheque. `npm run domaines:check` verifie deja qu on passe
       par la porte et pas par la fenetre ; deux gardes, deux
       questions, et aucune des deux ne repond a la place de l autre. */
    const porteAutre = cible.match(/^domaines\/([^/]+)(?:\/index(?:\.tsx?)?)?$/);
    if (porteAutre && porteAutre[1] !== monDomaine) continue;

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
