#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  EXCLUS, DEBUT_HUMAIN, arbre, lignesDe, poidsDe, langageDe,
  commitsParFichier, derniereTouche, resumeGit, gitDisponible,
  grapheImports, marqueurs, visuels, polices, palette, tests,
} from "./tableau-de-bord/collecte.mjs";
import { rendre } from "./tableau-de-bord/rendu.mjs";

/* ═══════════════════════════════════════════════════════════════
   TABLEAU DE BORD DU PROJET — génération

     npm run tableau

   Écrit `docs/tableau-de-bord.html`, une page autonome qui s'ouvre au
   double-clic, et `docs/instantanes/<date>.json`, pour que la page
   suivante puisse dire ce qui a bougé depuis.

   ═══ DEUX SOURCES, ET UNE SEULE VÉRITÉ PAR DONNÉE ═══

   Le DÉPÔT dit ce qui EST : les versions, les fichiers, les lignes,
   l'historique, les visuels, la palette. Rien de tout cela ne se
   recopie à la main, donc rien ne peut diverger.

   Le MANIFESTE (`projet.manifeste.json`) dit ce que le dépôt ne peut
   pas savoir : à quoi sert ce projet, à qui il s'adresse, quel module
   est en pause plutôt qu'abandonné, sous quelle licence est une
   police, avec quel outil un visuel a été fait. Rien qui puisse être
   lu n'y figure.

   Ce qui n'est renseigné nulle part s'affiche « à compléter ». Jamais
   deviné, jamais rempli d'un contenu vraisemblable.
   ═══════════════════════════════════════════════════════════════ */

const RACINE = process.cwd();
const SORTIE = "docs/tableau-de-bord.html";
const INSTANTANES = "docs/instantanes";
const INSTANTANES_GARDES = 20;

const lire = (rel, defaut = null) => {
  try { return JSON.parse(fs.readFileSync(path.join(RACINE, rel), "utf8")); }
  catch { return defaut; }
};

/* ── Le manifeste ───────────────────────────────────────────── */

const manifeste = lire("projet.manifeste.json");
if (!manifeste) {
  console.error("projet.manifeste.json est introuvable ou illisible.");
  console.error("La page a besoin de ce que le dépôt ne peut pas savoir : arrêt.");
  process.exit(1);
}

const pkg = lire("package.json", {});
const fichiers = arbre();
const sources = fichiers.filter((f) => /\.(tsx?|jsx?|mts|mjs)$/.test(f));

/* ── Volumétrie ─────────────────────────────────────────────── */

const parLangage = new Map();
const parDossier = new Map();
let lignesTotal = 0;

for (const f of fichiers) {
  const n = lignesDe(f);
  const p = poidsDe(f);
  lignesTotal += n;

  const lang = langageDe(f);
  const l = parLangage.get(lang) ?? { langage: lang, fichiers: 0, lignes: 0, poids: 0 };
  l.fichiers++; l.lignes += n; l.poids += p;
  parLangage.set(lang, l);

  /* Deux niveaux : « src/components » plutôt que « src », parce que
     « src » ne dit rien qu'on ne sache déjà. */
  const parties = f.split("/");
  const dossier = parties.length > 2 ? parties.slice(0, 2).join("/") : (parties.length > 1 ? parties[0] : "(racine)");
  const d = parDossier.get(dossier) ?? { dossier, fichiers: 0, lignes: 0, poids: 0 };
  d.fichiers++; d.lignes += n; d.poids += p;
  parDossier.set(dossier, d);
}

/* ── Historique ─────────────────────────────────────────────── */

const avecGit = gitDisponible();
const commits = avecGit ? commitsParFichier() : { total: new Map(), recent: new Map() };
const touches = avecGit ? derniereTouche() : new Map();
const git = avecGit ? resumeGit() : null;

const detail = (f) => ({
  chemin: f,
  lignes: lignesDe(f),
  poids: poidsDe(f),
  langage: langageDe(f),
  commits: commits.total.get(f) ?? 0,
  commitsRecents: commits.recent.get(f) ?? 0,
  derniereTouche: touches.get(f) ?? null,
});

const tousDetails = fichiers.map(detail);
const codeSource = tousDetails.filter((d) => /^src\/|^supabase\/functions\//.test(d.chemin));

const plusGros = [...codeSource].sort((a, b) => b.lignes - a.lignes).slice(0, 15);

/* Un fichier gros ET souvent repris est le signal ; ni l'un ni l'autre
   pris seul ne l'est. On multiplie les deux RANGS plutôt que les
   valeurs brutes — sinon une seule dimension écrase l'autre — et on ne
   pose aucun seuil : c'est un classement, pas un verdict. */
const rang = (liste, cle) => {
  const tri = [...liste].sort((a, b) => b[cle] - a[cle]);
  return new Map(tri.map((d, i) => [d.chemin, i + 1]));
};
const rangLignes = rang(codeSource, "lignes");
const rangReprises = rang(codeSource, "commitsRecents");
const chauds = codeSource
  .filter((d) => d.commitsRecents > 0)
  .map((d) => ({ ...d, score: rangLignes.get(d.chemin) * rangReprises.get(d.chemin) }))
  .sort((a, b) => a.score - b.score)
  .slice(0, 10);

const pages = codeSource.filter((d) => /^src\/pages\//.test(d.chemin))
  .sort((a, b) => b.lignes - a.lignes);
const horsPages = codeSource.filter((d) => !/^src\/pages\//.test(d.chemin))
  .sort((a, b) => b.lignes - a.lignes).slice(0, 15);

const reprisRecemment = [...codeSource]
  .filter((d) => d.commitsRecents > 0)
  .sort((a, b) => b.commitsRecents - a.commitsRecents).slice(0, 15);

const dormants = [...codeSource]
  .filter((d) => d.derniereTouche)
  .sort((a, b) => a.derniereTouche.localeCompare(b.derniereTouche)).slice(0, 15);

/* ── Imports, orphelins, dépendances ────────────────────────── */

const { importePar, paquets } = grapheImports(fichiers);

/* Un point d'entrée n'est pas un orphelin : rien ne l'importe par
   construction. On les nomme au lieu de les compter comme des restes. */
const ENTREES = [
  /^src\/main\.tsx$/, /^src\/App\.tsx$/, /^src\/vite-env\.d\.ts$/,
  /^scripts\//, /^supabase\/functions\//, /\.config\.(ts|js)$/,
  /^src\/pages\//,          // montées par le routeur, pas importées
];
const orphelins = sources
  .filter((f) => (importePar.get(f)?.size ?? 0) === 0)
  .filter((f) => !ENTREES.some((m) => m.test(f)))
  .map(detail)
  .sort((a, b) => b.lignes - a.lignes);

const declarees = Object.keys(pkg.dependencies ?? {});
const declareesDev = Object.keys(pkg.devDependencies ?? {});
const importees = new Set(paquets.keys());

/* Certaines dépendances ne s'importent jamais depuis `src` : elles
   servent au build, à Tailwind ou à l'exécution. Les signaler comme
   « jamais importées » serait un faux positif, alors on les écarte
   nommément — et on dit lesquelles. */
const HORS_IMPORT = [
  "vite", "typescript", "tailwindcss", "autoprefixer", "postcss", "eslint",
  "@vitejs/plugin-react", "@vitejs/plugin-react-swc", "globals",
  "typescript-eslint", "@eslint/js", "eslint-plugin-react-hooks",
  "eslint-plugin-react-refresh", "tailwindcss-animate", "@tailwindcss/typography",
  "vite-plugin-pwa", "workbox-window", "lovable-tagger", "@types/node",
];
const jamaisImportees = [...declarees, ...declareesDev]
  .filter((d) => !importees.has(d) && !HORS_IMPORT.includes(d) && !d.startsWith("@types/"));

const absentesDuPackage = [...paquets.keys()]
  .filter((p) => !declarees.includes(p) && !declareesDev.includes(p))
  .filter((p) => !p.startsWith("node:") && !["react", "react-dom"].includes(p))
  .map((p) => ({ paquet: p, depuis: [...paquets.get(p)].slice(0, 4) }));

/* ── Modules ─────────────────────────────────────────────────────
   LE DÉPÔT LISTE, LE MANIFESTE QUALIFIE. Chaque page de `src/pages`
   est un module candidat ; le manifeste lui donne son nom lisible, son
   statut et les dossiers qui lui appartiennent en plus. Un module
   absent du manifeste apparaît quand même, en « à compléter » : il ne
   peut pas se cacher. */

const declaresParChemin = new Map(
  (manifeste.modules ?? []).map((m) => [m.page, m]),
);

const modules = pages.map((p) => {
  const d = declaresParChemin.get(p.chemin) ?? {};
  const dossiers = [p.chemin, ...(d.aussi ?? [])];
  const lignes = dossiers.reduce((s, dd) => s + (dd === p.chemin
    ? p.lignes
    : tousDetails.filter((x) => x.chemin.startsWith(dd + "/")).reduce((a, x) => a + x.lignes, 0)), 0);
  const derniere = dossiers
    .flatMap((dd) => tousDetails.filter((x) => x.chemin === dd || x.chemin.startsWith(dd + "/")))
    .map((x) => x.derniereTouche).filter(Boolean).sort().pop() ?? null;
  return {
    page: p.chemin,
    nom: d.nom ?? path.basename(p.chemin, path.extname(p.chemin)),
    statut: d.statut ?? null,
    note: d.note ?? null,
    aussi: d.aussi ?? [],
    lignes, derniereActivite: derniere,
    commitsRecents: p.commitsRecents,
  };
}).sort((a, b) => (b.derniereActivite ?? "").localeCompare(a.derniereActivite ?? ""));

/* ── Instantané ─────────────────────────────────────────────── */

const aujourdHui = new Date().toISOString().slice(0, 10);
const instantane = {
  date: aujourdHui,
  genere: new Date().toISOString(),
  fichiers: fichiers.length,
  lignes: lignesTotal,
  parDossier: [...parDossier.values()],
  parLangage: [...parLangage.values()],
  commits: git?.total ?? null,
  orphelins: orphelins.length,
  marqueurs: marqueurs(fichiers).length,
};

fs.mkdirSync(path.join(RACINE, INSTANTANES), { recursive: true });
fs.writeFileSync(
  path.join(RACINE, INSTANTANES, `${aujourdHui}.json`),
  JSON.stringify(instantane, null, 2) + "\n",
);

/* On garde les vingt derniers : l'évolution se lit sur quelques
   semaines, pas sur l'histoire entière, et un dépôt n'a pas à porter
   mille photos de lui-même. */
const anciens = fs.readdirSync(path.join(RACINE, INSTANTANES))
  .filter((f) => f.endsWith(".json")).sort();
for (const vieux of anciens.slice(0, Math.max(0, anciens.length - INSTANTANES_GARDES))) {
  fs.unlinkSync(path.join(RACINE, INSTANTANES, vieux));
}

const historique = fs.readdirSync(path.join(RACINE, INSTANTANES))
  .filter((f) => f.endsWith(".json")).sort()
  .map((f) => lire(`${INSTANTANES}/${f}`)).filter(Boolean);

/* ── Journal des décisions ───────────────────────────────────────
   `mem/` porte déjà des notes au bon format — un en-tête avec nom,
   description et type. On les lit plutôt que de demander de les
   recopier. Le manifeste peut en ajouter. */

const notesMem = arbre("mem").filter((f) => f.endsWith(".md")).map((f) => {
  const t = fs.readFileSync(path.join(RACINE, f), "utf8");
  const en = t.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const champ = (c) => (en?.[1].match(new RegExp(`^${c}:\\s*(.+)$`, "m"))?.[1] ?? "").trim();
  return {
    source: f,
    titre: champ("name") || path.basename(f, ".md"),
    contexte: champ("description"),
    type: champ("type"),
    date: touches.get(f)?.slice(0, 10) ?? null,
    alternative: null,
  };
});

const decisions = [...(manifeste.decisions ?? []), ...notesMem]
  .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

/* ── Assemblage ─────────────────────────────────────────────── */

const donnees = {
  genere: new Date().toISOString(),
  manifeste,
  exclus: EXCLUS,
  debutHumain: DEBUT_HUMAIN,
  paquet: {
    nom: pkg.name ?? null,
    version: pkg.version ?? null,
    scripts: pkg.scripts ?? {},
    dependances: Object.entries(pkg.dependencies ?? {}).map(([nom, v]) => ({ nom, version: v, type: "exécution" })),
    dev: Object.entries(pkg.devDependencies ?? {}).map(([nom, v]) => ({ nom, version: v, type: "développement" })),
  },
  volumetrie: {
    fichiers: fichiers.length,
    lignes: lignesTotal,
    parLangage: [...parLangage.values()].sort((a, b) => b.lignes - a.lignes),
    parDossier: [...parDossier.values()].sort((a, b) => b.lignes - a.lignes),
  },
  git,
  plusGros, chauds, pages, horsPages, reprisRecemment, dormants,
  orphelins,
  dependances: { jamaisImportees, absentesDuPackage, horsImport: HORS_IMPORT },
  marqueurs: marqueurs(fichiers),
  tests: tests(fichiers, pkg),
  visuels: visuels(fichiers, sources),
  polices: polices(fichiers),
  palette: palette(),
  modules,
  decisions,
  historique,
};

const html = rendre(donnees);
fs.mkdirSync(path.join(RACINE, "docs"), { recursive: true });
fs.writeFileSync(path.join(RACINE, SORTIE), html);

const aCompleter = [
  !manifeste.identite?.pitch && "le pitch",
  !manifeste.identite?.pourQui && "le public",
  !manifeste.identite?.intention && "l'intention",
  !manifeste.identite?.etat && "l'état d'avancement",
  modules.filter((m) => !m.statut).length && `${modules.filter((m) => !m.statut).length} statut(s) de module`,
  (manifeste.ressources ?? []).filter((r) => !/^service/i.test(r.nature ?? "") && !r.licence).length && "des licences",
  (manifeste.ressources ?? []).filter((r) => /^service/i.test(r.nature ?? "") && !r.cout).length && "des formules de service",
].filter(Boolean);

console.log(`Page écrite : ${SORTIE}`);
console.log(`  ${fichiers.length} fichiers, ${lignesTotal.toLocaleString("fr-FR")} lignes, ${git?.total ?? "?"} commits`);
console.log(`  instantané : ${INSTANTANES}/${aujourdHui}.json (${historique.length} conservés)`);
if (aCompleter.length) console.log(`  à compléter dans le manifeste : ${aCompleter.join(", ")}`);
