import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

/* ═══════════════════════════════════════════════════════════════
   LA COLLECTE

   Tout ce que cette page affiche vient d'ici, et tout ce qui vient
   d'ici est LU dans le dépôt. Aucun chiffre n'est estimé, aucun seuil
   n'est inventé : quand un classement existe, il est présenté comme un
   classement, pas comme un verdict.

   ═══ CE QUI EST EXCLU DE L'ANALYSE, ET POURQUOI ═══

   La liste vit dans EXCLUS, une seule fois, et elle est réaffichée
   dans la page : un décompte dont on ignore le périmètre ne veut rien
   dire. Trois familles :

     · ce que git ignore déjà — node_modules, dist, les journaux ;
     · ce qui est GÉNÉRÉ — types.ts vient de Supabase, le service
       worker de Workbox. Les compter revient à mesurer le travail
       d'un outil, et types.ts (5 722 lignes) écraserait à lui seul
       tout classement par taille ;
     · ce qui n'est pas du code du produit — les compétences installées
       sous .claude et .agents, les instantanés de ce tableau lui-même.
   ═══════════════════════════════════════════════════════════════ */

export const EXCLUS = {
  dossiers: [
    "node_modules", "dist", "dist-ssr", ".git", ".vite",
    ".claude", ".agents",   // compétences installées, pas le produit
    "docs/instantanes",     // les instantanés de ce tableau
    "public/sounds",        // binaires audio, comptés comme ressources
  ],
  fichiers: [
    "src/integrations/supabase/types.ts", // généré par Supabase
    "public/sw.js",                        // généré par Workbox
    "package-lock.json", "deno.lock",
    "tsconfig.app.tsbuildinfo", "tsconfig.node.tsbuildinfo",
  ],
  motifs: [/\.tsbuildinfo$/, /\.log$/, /\.local$/],
};

/* La sortie de Lovable. Avant cette date, 2 702 commits d'un robot
   d'export ; après, le travail à la main. « Combien de commits ont
   touché ce fichier » n'a pas le même sens des deux côtés, alors on
   compte les deux et on dit lequel on regarde. */
export const DEBUT_HUMAIN = "2026-08-16";

const RACINE = process.cwd();

const estExclu = (rel) => {
  const p = rel.replace(/\\/g, "/");
  if (EXCLUS.fichiers.includes(p)) return true;
  if (EXCLUS.motifs.some((m) => m.test(p))) return true;
  return EXCLUS.dossiers.some((d) => p === d || p.startsWith(d + "/"));
};

/* CE QUE GIT IGNORE N'EST PAS DANS LE DÉPÔT, DONC PAS DANS LE COMPTE.
   EXCLUS n'énumère que ce que git ne sait pas écarter tout seul. Le
   reste, on le demande à git : recopier `.gitignore` dans une liste en
   dur, c'est se condamner à la voir diverger. `migrer-images.mjs`, un
   script de migration lancé une fois et ignoré depuis, était compté
   comme du code orphelin du produit — il n'est pas versionné du tout. */
const ignoresParGit = (chemins) => {
  if (!chemins.length) return new Set();
  try {
    const sortie = execFileSync("git", ["check-ignore", "--stdin", "-z"], {
      cwd: RACINE, encoding: "utf8", input: chemins.join("\0"),
      maxBuffer: 64 * 1024 * 1024,
    });
    return new Set(sortie.split("\0").filter(Boolean));
  } catch (e) {
    /* Sortie 1 = « rien n'est ignoré », ce n'est pas une panne. Toute
       autre sortie (pas de dépôt, pas de git) : on ne filtre rien. */
    if (e.status === 1) return new Set(String(e.stdout ?? "").split("\0").filter(Boolean));
    return new Set();
  }
};

/** Parcours du dépôt, exclusions appliquées. */
export function arbre(depuis = ".") {
  const out = [];
  const marcher = (dir) => {
    let entrees;
    try { entrees = fs.readdirSync(path.join(RACINE, dir), { withFileTypes: true }); }
    catch { return; }
    for (const e of entrees) {
      const rel = dir === "." ? e.name : `${dir}/${e.name}`;
      if (estExclu(rel)) continue;
      if (e.isDirectory()) marcher(rel);
      else out.push(rel);
    }
  };
  marcher(depuis);

  const ignores = ignoresParGit(out);
  return ignores.size ? out.filter((f) => !ignores.has(f)) : out;
}

const CODE = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts", ".css", ".sql", ".json", ".md", ".html"]);

export function lignesDe(rel) {
  try {
    const t = fs.readFileSync(path.join(RACINE, rel), "utf8");
    return t === "" ? 0 : t.split("\n").length;
  } catch { return 0; }
}

export function poidsDe(rel) {
  try { return fs.statSync(path.join(RACINE, rel)).size; } catch { return 0; }
}

/** Langage lisible depuis l'extension. */
export function langageDe(rel) {
  const e = path.extname(rel).toLowerCase();
  return {
    ".tsx": "TypeScript (JSX)", ".ts": "TypeScript", ".mts": "TypeScript",
    ".js": "JavaScript", ".mjs": "JavaScript", ".jsx": "JavaScript (JSX)",
    ".css": "CSS", ".sql": "SQL", ".json": "JSON", ".md": "Markdown",
    ".html": "HTML", ".svg": "SVG",
  }[e] ?? (e ? e.slice(1).toUpperCase() : "sans extension");
}

/* ── Git ────────────────────────────────────────────────────────
   Un seul appel par question. `git log --name-only` sur trois mille
   commits reste instantané ; l'appeler par fichier ne le serait pas. */

function git(args) {
  try {
    return execFileSync("git", args, { cwd: RACINE, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch { return ""; }
}

export function gitDisponible() {
  return git(["rev-parse", "--is-inside-work-tree"]).trim() === "true";
}

/** Nombre de commits par fichier, sur toute l'histoire et depuis la reprise à la main. */
export function commitsParFichier() {
  const compter = (args) => {
    const out = git(["log", "--pretty=format:", "--name-only", ...args]);
    const m = new Map();
    for (const l of out.split("\n")) {
      const f = l.trim();
      if (!f || estExclu(f)) continue;
      m.set(f, (m.get(f) ?? 0) + 1);
    }
    return m;
  };
  return { total: compter([]), recent: compter([`--since=${DEBUT_HUMAIN}`]) };
}

/** Date du dernier commit qui a touché chaque fichier. */
export function derniereTouche() {
  const out = git(["log", "--pretty=format:@@%aI", "--name-only"]);
  const m = new Map();
  let date = null;
  for (const l of out.split("\n")) {
    if (l.startsWith("@@")) { date = l.slice(2); continue; }
    const f = l.trim();
    if (!f || !date || m.has(f) || estExclu(f)) continue;
    m.set(f, date);
  }
  return m;
}

export function resumeGit() {
  const total = parseInt(git(["rev-list", "--count", "HEAD"]).trim() || "0", 10);
  const humains = parseInt(git(["rev-list", "--count", `--since=${DEBUT_HUMAIN}`, "HEAD"]).trim() || "0", 10);
  const premier = git(["log", "--reverse", "--format=%aI", "--max-count=1"]).trim();
  const dernier = git(["log", "-1", "--format=%aI"]).trim();
  const auteurs = git(["log", "--format=%an"]).split("\n").filter(Boolean)
    .reduce((a, n) => (a[n] = (a[n] ?? 0) + 1, a), {});
  return {
    total, humains, premier, dernier,
    branche: git(["rev-parse", "--abbrev-ref", "HEAD"]).trim(),
    auteurs: Object.entries(auteurs).sort((a, b) => b[1] - a[1]).map(([nom, n]) => ({ nom, n })),
  };
}

/* ── Le graphe des imports ──────────────────────────────────────
   Assez fin pour répondre « qui importe ce fichier », assez grossier
   pour ne pas prétendre comprendre TypeScript : on lit les chemins
   littéraux des `import` et des `import()`. Un chemin calculé à
   l'exécution échappe donc à ce comptage, et la page le dit. */

const IMPORT = /(?:from\s+|import\s*\(\s*)["']([^"']+)["']/g;

export function grapheImports(fichiers) {
  const sources = fichiers.filter((f) => /\.(tsx?|jsx?|mts|mjs)$/.test(f));
  const existe = new Set(fichiers);
  const importePar = new Map(sources.map((f) => [f, new Set()]));
  const paquets = new Map();

  const resoudre = (depuis, spec) => {
    let base;
    if (spec.startsWith("@/")) base = "src/" + spec.slice(2);
    else if (spec.startsWith(".")) base = path.posix.normalize(path.posix.join(path.posix.dirname(depuis), spec));
    else return null;
    const essais = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"];
    for (const suffixe of essais) {
      const c = base + suffixe;
      if (existe.has(c)) return c;
    }
    return null;
  };

  for (const f of sources) {
    let texte;
    try { texte = fs.readFileSync(path.join(RACINE, f), "utf8"); } catch { continue; }
    for (const m of texte.matchAll(IMPORT)) {
      const spec = m[1];
      const cible = resoudre(f, spec);
      if (cible) { importePar.get(cible)?.add(f); continue; }
      if (spec.startsWith(".") || spec.startsWith("@/")) continue; // relatif non résolu
      // Paquet : « @scope/nom » ou « nom », sous-chemins retirés.
      const nom = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
      if (!paquets.has(nom)) paquets.set(nom, new Set());
      paquets.get(nom).add(f);
    }
  }

  return { importePar, paquets };
}

/* ── Marqueurs laissés dans le code ─────────────────────────────
   On ne compte QUE le code du produit : un « TODO » dans une
   migration décrit une décision, pas une dette oubliée. */

const MARQUEURS = [
  { cle: "TODO", motif: /\bTODO\b/ },
  { cle: "FIXME", motif: /\bFIXME\b/ },
  { cle: "HACK", motif: /\bHACK\b/ },
  { cle: "console.log", motif: /console\.log\s*\(/ },
  { cle: "eslint-disable", motif: /eslint-disable/ },
  { cle: "@ts-ignore", motif: /@ts-(ignore|expect-error)/ },
];

export function marqueurs(fichiers) {
  const trouves = [];
  for (const f of fichiers) {
    if (!/^src\/|^supabase\/functions\//.test(f)) continue;
    if (!/\.(tsx?|jsx?|mts|mjs)$/.test(f)) continue;
    let lignes;
    try { lignes = fs.readFileSync(path.join(RACINE, f), "utf8").split("\n"); } catch { continue; }
    lignes.forEach((l, i) => {
      for (const m of MARQUEURS) {
        if (m.motif.test(l)) trouves.push({ cle: m.cle, fichier: f, ligne: i + 1, extrait: l.trim().slice(0, 120) });
      }
    });
  }
  return trouves;
}

/* ── Les visuels ────────────────────────────────────────────────
   Dimensions lues dans les en-têtes, sans dépendance : quatre formats
   suffisent à couvrir ce dépôt, et un format inconnu rend « — »
   plutôt qu'un chiffre inventé. */

function dimensions(abs, ext) {
  try {
    const b = fs.readFileSync(abs);
    if (ext === ".png" && b.length > 24 && b.readUInt32BE(12) === 0x49484452) {
      return { l: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    }
    if (ext === ".webp" && b.length > 30 && b.toString("ascii", 0, 4) === "RIFF") {
      const type = b.toString("ascii", 12, 16);
      if (type === "VP8X") return { l: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
      if (type === "VP8 ") return { l: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      if (type === "VP8L") {
        const n = b.readUInt32LE(21);
        return { l: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 };
      }
    }
    if (ext === ".svg") {
      const t = b.toString("utf8", 0, 2000);
      const vb = t.match(/viewBox\s*=\s*["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/);
      if (vb) return { l: Math.round(+vb[1]), h: Math.round(+vb[2]) };
      const w = t.match(/\bwidth\s*=\s*["']([\d.]+)/);
      const h = t.match(/\bheight\s*=\s*["']([\d.]+)/);
      if (w && h) return { l: Math.round(+w[1]), h: Math.round(+h[1]) };
    }
    if (ext === ".jpg" || ext === ".jpeg") {
      let i = 2;
      while (i < b.length - 9) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          return { h: b.readUInt16BE(i + 5), l: b.readUInt16BE(i + 7) };
        }
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
  } catch { /* format non reconnu */ }
  return null;
}

const IMAGE = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".avif", ".ico"]);

export function visuels(fichiers, sources) {
  /* « Où c'est utilisé » se cherche par le nom du fichier dans le code :
     une adresse construite à l'exécution échappe à cette recherche, et
     la page le précise. */
  const textes = new Map();
  for (const f of sources) {
    try { textes.set(f, fs.readFileSync(path.join(RACINE, f), "utf8")); } catch { /* illisible */ }
  }

  return fichiers
    .filter((f) => f.startsWith("public/") && IMAGE.has(path.extname(f).toLowerCase()))
    .map((f) => {
      const ext = path.extname(f).toLowerCase();
      const nom = path.basename(f);
      const utilise = [];
      for (const [src, texte] of textes) {
        if (texte.includes(nom)) utilise.push(src);
      }
      return {
        chemin: f, nom, ext: ext.slice(1),
        poids: poidsDe(f),
        dim: dimensions(path.join(RACINE, f), ext),
        utilise,
      };
    })
    .sort((a, b) => b.poids - a.poids);
}

export function polices(fichiers) {
  return fichiers
    .filter((f) => /\.(woff2?|ttf|otf)$/i.test(f))
    .map((f) => {
      const nom = path.basename(f).replace(/\.(woff2?|ttf|otf)$/i, "");
      const graisse = nom.match(/-(\d{3})$/);
      return {
        chemin: f,
        famille: nom.replace(/-\d{3}$/, "").replace(/-/g, " "),
        graisse: graisse ? +graisse[1] : null,
        poids: poidsDe(f),
      };
    })
    .sort((a, b) => a.famille.localeCompare(b.famille) || (a.graisse ?? 0) - (b.graisse ?? 0));
}

/* ── La palette ─────────────────────────────────────────────────
   Lue dans les jetons, pas recopiée. On ne garde que ceux qui portent
   une couleur exploitable, et on convertit le format HSL sans unités
   employé par le projet en quelque chose qu'un navigateur affiche. */

export function palette(fichier = "src/styles/design-tokens.css") {
  let texte;
  try { texte = fs.readFileSync(path.join(RACINE, fichier), "utf8"); } catch { return []; }

  const blocs = [];
  const clair = texte.indexOf(".light");
  const zones = clair > 0
    ? [{ theme: "sombre", t: texte.slice(0, clair) }, { theme: "clair", t: texte.slice(clair) }]
    : [{ theme: "sombre", t: texte }];

  for (const { theme, t } of zones) {
    for (const m of t.matchAll(/--(ds-[a-z0-9-]+)\s*:\s*([^;]+);(?:\s*\/\*([^*]*)\*\/)?/g)) {
      const nom = m[1];
      const valeur = m[2].trim();
      const note = (m[3] ?? "").trim();
      const hsl = valeur.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
      if (!hsl) continue;
      blocs.push({
        theme, nom, valeur,
        css: `hsl(${hsl[1]} ${hsl[2]}% ${hsl[3]}%)`,
        hex: hslVersHex(+hsl[1], +hsl[2], +hsl[3]),
        note,
      });
    }
  }
  return blocs;
}

function hslVersHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const d = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${d(f(0))}${d(f(8))}${d(f(4))}`.toUpperCase();
}

/* ── Les tests ──────────────────────────────────────────────────
   On cherche l'outil ET les fichiers. Sans outil, la page écrit « pas
   de tests configurés » : un zéro décoratif laisserait croire qu'on
   mesure quelque chose. */

export function tests(fichiers, pkg) {
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const outils = ["vitest", "jest", "@playwright/test", "cypress", "@testing-library/react"]
    .filter((o) => o in deps);
  const fichiersTest = fichiers.filter((f) => /\.(test|spec)\.[jt]sx?$/.test(f));
  const config = fichiers.filter((f) => /^(vitest|jest|playwright|cypress)\.config\./.test(path.basename(f)));
  return { outils, fichiers: fichiersTest, config, configure: outils.length > 0 || config.length > 0 };
}

export { RACINE, estExclu };
