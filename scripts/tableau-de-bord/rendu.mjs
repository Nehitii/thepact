/* ═══════════════════════════════════════════════════════════════
   LE RENDU

   Une page qu'on ouvre au double-clic : tout est dedans, rien n'est
   téléchargé. Les polices font exception et c'est voulu — la section
   « direction artistique » doit montrer les caractères DANS leur
   police, pas décrire à quoi ils ressemblent. Elles sont chargées
   depuis `../public/fonts`, chemin qui vaut aussi bien depuis le
   disque que depuis un serveur.

   ═══ CE QUE CETTE PAGE N'EST PAS ═══

   Ni un tableau de bord de vanité, ni un rapport d'audit. Elle décrit,
   elle ne juge pas. Un gros fichier n'est pas un défaut ; un fichier
   sans test n'est pas une faute. Chaque nombre porte son mode de
   calcul, à déplier, parce qu'un chiffre dont on ignore la méthode
   n'informe pas — il impressionne.
   ═══════════════════════════════════════════════════════════════ */

const ech = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const nb = (n) => (n ?? 0).toLocaleString("fr-FR");

const octets = (o) => {
  if (o == null) return "—";
  if (o < 1024) return `${o} o`;
  if (o < 1024 * 1024) return `${(o / 1024).toFixed(1)} ko`;
  return `${(o / 1024 / 1024).toFixed(2)} Mo`;
};

const jour = (iso) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—");

const depuis = (iso) => {
  if (!iso) return "—";
  const j = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (j <= 0) return "aujourd'hui";
  if (j === 1) return "hier";
  if (j < 30) return `il y a ${j} j`;
  if (j < 365) return `il y a ${Math.round(j / 30)} mois`;
  return `il y a ${Math.floor(j / 365)} an${j >= 730 ? "s" : ""}`;
};

/** Une valeur absente s'affiche, elle ne se devine pas. */
const aCompleter = (v, quoi = "") =>
  v ? ech(v) : `<span class="vide" title="Rien n'est renseigné pour ${ech(quoi)} dans projet.manifeste.json">à compléter</span>`;

/** Le mode de calcul, replié : un chiffre sans sa méthode n'informe pas. */
const methode = (texte) =>
  `<details class="methode"><summary>Comment c'est calculé</summary><p>${texte}</p></details>`;

/* CHAQUE SECTION TIENT DANS UN ÉCRAN, LE DÉTAIL SE DÉPLIE.
   Sans cette règle la page fait vingt-cinq mille pixels de haut et ne
   se consulte plus — elle se subit. Le résumé annonce toujours COMBIEN
   il y a dedans : un repli dont on ignore le contenu n'invite pas à
   l'ouvrir. */
const plier = (resume, contenu, ouvert = false) =>
  `<details class="repli"${ouvert ? " open" : ""}><summary>${resume}</summary>${contenu}</details>`;

/** Les N premiers restent visibles, le reste se déplie. */
const tete = (liste, n, rendre, mot) => {
  const debut = liste.slice(0, n);
  const suite = liste.slice(n);
  return rendre(debut) + (suite.length
    ? plier(`Voir les ${suite.length} ${mot} restants`, rendre(suite))
    : "");
};

const SECTIONS = [
  ["identite", "Identité"],
  ["modules", "Modules"],
  ["da", "Direction artistique"],
  ["visuels", "Visuels"],
  ["ressources", "Ressources"],
  ["stack", "Stack"],
  ["sante", "Santé du code"],
  ["doc", "Documentation"],
  ["decisions", "Décisions"],
  ["suite", "Prochaines étapes"],
];

export function rendre(d) {
  const m = d.manifeste;

  /* Évolution depuis l'instantané précédent : la page dit ce qui a
     bougé, pas seulement ce qui est. */
  const precedent = d.historique.length > 1 ? d.historique[d.historique.length - 2] : null;
  const delta = (cle, actuel) => {
    if (!precedent || precedent[cle] == null) return "";
    const diff = actuel - precedent[cle];
    if (diff === 0) return `<span class="delta plat">= depuis le ${ech(precedent.date)}</span>`;
    return `<span class="delta ${diff > 0 ? "hausse" : "baisse"}">${diff > 0 ? "+" : ""}${nb(diff)} depuis le ${ech(precedent.date)}</span>`;
  };

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vowpact — tableau de bord du projet</title>
<style>
${styles(d)}
</style>
</head>
<body>

<a class="saut" href="#contenu">Aller au contenu</a>

<header class="tete">
  <div class="tete-in">
    <div class="marque">
      <span class="marque-point" aria-hidden="true"></span>
      <div>
        <h1>${aCompleter(m.identite?.nom, "le nom")}</h1>
        <p class="tete-sous">Tableau de bord du projet · généré le ${jour(d.genere)}</p>
      </div>
    </div>
    <div class="outils">
      <label class="chercher">
        <span class="sr">Rechercher dans la page</span>
        <input type="search" id="q" placeholder="Rechercher un fichier, un module, une dépendance…" autocomplete="off">
      </label>
      <div class="filtres" role="group" aria-label="Filtrer les modules par statut">
        ${["tous", "idée", "en cours", "livré", "en pause", "à compléter"].map((s, i) =>
          `<button type="button" class="filtre" data-statut="${ech(s)}"${i === 0 ? ' aria-pressed="true"' : ' aria-pressed="false"'}>${ech(s)}</button>`).join("")}
      </div>
    </div>
  </div>
</header>

<div class="page">
  <nav class="sommaire" aria-label="Sections">
    <ol>
      ${SECTIONS.map(([id, nom], i) => `<li><a href="#${id}"><span>${i + 1}</span>${ech(nom)}</a></li>`).join("")}
    </ol>
  </nav>

  <main id="contenu">

  ${sectionIdentite(d, m, aCompleter)}
  ${sectionModules(d)}
  ${sectionDA(d, m)}
  ${sectionVisuels(d, m)}
  ${sectionRessources(d, m)}
  ${sectionStack(d)}
  ${sectionSante(d, delta)}
  ${sectionDoc(d, m)}
  ${sectionDecisions(d)}
  ${sectionSuite(d, m)}

  </main>
</div>

<footer class="pied">
  <p>Page régénérée par <code>npm run tableau</code>. Le dépôt est la source de vérité ; ce que le dépôt ne peut pas savoir vit dans <code>projet.manifeste.json</code>.</p>
</footer>

<script>
${script()}
</script>
</body>
</html>`;
}

/* ── 1. Identité ────────────────────────────────────────────── */

function sectionIdentite(d, m) {
  return `
<section id="identite" class="sect">
  <h2><span class="num">1</span> Identité</h2>
  <p class="intro">Ce que fait ce projet, pour qui, et où il en est — en une phrase chacun.</p>

  <div class="grille-2">
    <article class="carte">
      <h3>Le projet en une phrase</h3>
      <p class="phrase">${aCompleter(m.identite?.pitch, "le pitch")}</p>
    </article>
    <article class="carte">
      <h3>À qui ça s'adresse</h3>
      <p class="phrase">${aCompleter(m.identite?.pourQui, "le public")}</p>
    </article>
    <article class="carte pleine">
      <h3>Intention</h3>
      <p>${aCompleter(m.identite?.intention, "l'intention")}</p>
    </article>
    <article class="carte pleine">
      <h3>Où ça en est</h3>
      <p class="phrase">${aCompleter(m.identite?.etat, "l'état d'avancement")}</p>
      <p class="note">Cette phrase est écrite à la main, dans le manifeste. Aucun pourcentage n'est calculé : il n'existe pas de mesure honnête de « combien il reste ».</p>
    </article>
  </div>

  <div class="mesures">
    ${mesure(nb(d.volumetrie.fichiers), "fichiers analysés")}
    ${mesure(nb(d.volumetrie.lignes), "lignes")}
    ${mesure(nb(d.git?.total), "commits")}
    ${mesure(d.git ? depuis(d.git.dernier) : "—", "dernier commit")}
  </div>
</section>`;
}

const mesure = (v, l, note = "") =>
  `<div class="mesure"><b>${v}</b><span>${ech(l)}</span>${note ? `<em>${ech(note)}</em>` : ""}</div>`;

/* ── 2. Modules ─────────────────────────────────────────────── */

function sectionModules(d) {
  const statut = (s) => s
    ? `<span class="etat" data-s="${ech(s)}">${ech(s)}</span>`
    : `<span class="etat" data-s="à compléter">à compléter</span>`;

  return `
<section id="modules" class="sect">
  <h2><span class="num">2</span> Modules fonctionnels</h2>
  <p class="intro">Un module par écran du produit. Le dépôt fournit la liste, la taille et la dernière activité ; le manifeste ajoute le nom lisible et le statut.</p>

  ${methode("Chaque fichier de <code>src/pages</code> est un module. Ses lignes additionnent la page et les dossiers déclarés en <code>aussi</code> dans le manifeste. La dernière activité est la date du commit le plus récent ayant touché l'un de ces fichiers. Un module absent du manifeste apparaît quand même, en « à compléter » : il ne peut pas se cacher.")}

  ${tete(d.modules, 12, (liste) => `<div class="liste">` + liste.map((mo) => `
    <div class="ligne compacte cherchable filtrable" data-statut="${ech(mo.statut ?? "à compléter")}" data-texte="${ech(mo.nom + " " + mo.page)}">
      <div class="ligne-corps">
        <p class="ligne-nom">${ech(mo.nom)} ${statut(mo.statut)}</p>
        <p class="ligne-meta">
          <code>${ech(mo.page)}</code>
          <span>${nb(mo.lignes)} lignes</span>
          <span>activité ${depuis(mo.derniereActivite)}</span>
          ${mo.commitsRecents ? `<span>${mo.commitsRecents} reprises récentes</span>` : ""}
        </p>
        ${mo.note ? `<p class="ligne-note">${ech(mo.note)}</p>` : ""}
      </div>
    </div>`).join("") + `</div>`, "écrans")}
</section>`;
}

/* ── 3. Direction artistique ────────────────────────────────── */

function sectionDA(d, m) {
  const parTheme = { sombre: [], clair: [] };
  for (const c of d.palette) (parTheme[c.theme] ?? parTheme.sombre).push(c);

  const pastilles = (liste) => liste.map((c) => `
    <div class="teinte cherchable" data-texte="${ech(c.nom + " " + c.hex)}">
      <span class="pastille" style="background:${ech(c.css)}" aria-hidden="true"></span>
      <code>--${ech(c.nom)}</code>
      <span class="hex">${ech(c.hex)}</span>
      ${c.note ? `<em>${ech(c.note.replace(/^—\\s*/, ""))}</em>` : ""}
    </div>`).join("");

  const familles = [...new Set(d.polices.map((p) => p.famille))];

  return `
<section id="da" class="sect">
  <h2><span class="num">3</span> Direction artistique</h2>
  <p class="intro">La palette et les caractères réellement employés, lus dans les fichiers — pas recopiés. Les échantillons ci-dessous sont rendus dans la vraie police.</p>

  <h3 class="sous">Palette — ${d.palette.length} jetons</h3>
  ${methode("Lus dans <code>src/styles/design-tokens.css</code>. Le projet écrit ses couleurs en teinte/saturation/luminosité sans unités ; elles sont converties ici pour l'affichage. Le miroir clair est celui déclaré sous <code>.light</code> dans le même fichier.")}
  <div class="bandes">
    ${["sombre", "clair"].map((th) => `
      <div class="bande">
        <p class="bande-nom">Thème ${th} — ${parTheme[th].length} jetons</p>
        <div class="bande-pastilles" aria-hidden="true">${parTheme[th].map((c) =>
          `<span class="pastille mini" style="background:${ech(c.css)}" title="--${ech(c.nom)} · ${ech(c.hex)}"></span>`).join("")}</div>
      </div>`).join("")}
  </div>
  ${plier("Voir les " + d.palette.length + " jetons, nom et valeur", `<div class="themes">
    <div><h4>Thème sombre</h4><div class="teintes">${pastilles(parTheme.sombre)}</div></div>
    <div><h4>Thème clair</h4><div class="teintes">${pastilles(parTheme.clair)}</div></div>
  </div>`)}

  <h3 class="sous">Caractères — ${familles.length} familles, ${d.polices.length} fichiers</h3>
  <div class="polices">
    ${familles.map((f) => {
      const graisses = d.polices.filter((p) => p.famille === f);
      const cle = f.replace(/[^a-z0-9]/gi, "-");
      return `
      <div class="police cherchable" data-texte="${ech(f)}">
        <p class="echantillon" style="font-family:'${ech(cle)}', system-ui">Vowpact — 0123456789</p>
        <p class="ligne-meta"><b>${ech(f)}</b>
          <span>${graisses.map((g) => g.graisse ?? "—").join(", ")}</span>
          <span>${octets(graisses.reduce((s, g) => s + g.poids, 0))}</span>
        </p>
      </div>`;
    }).join("")}
  </div>

  <h3 class="sous">Règles d'usage</h3>
  ${(m.da?.regles ?? []).length
    ? `<ul class="regles">${m.da.regles.map((r) => `<li>${ech(r)}</li>`).join("")}</ul>`
    : `<p>${aCompleter(null, "les règles d'usage")}</p>`}

  <h3 class="sous">Ce qu'il ne faut pas faire</h3>
  ${(m.da?.interdits ?? []).length
    ? `<ul class="regles interdits">${m.da.interdits.map((r) => `<li>${ech(r)}</li>`).join("")}</ul>`
    : `<p>${aCompleter(null, "les interdits")}</p>`}
</section>`;
}

/* ── 4. Visuels ─────────────────────────────────────────────── */

function sectionVisuels(d, m) {
  const notes = new Map((m.visuels ?? []).map((v) => [v.chemin, v]));
  return `
<section id="visuels" class="sect">
  <h2><span class="num">4</span> Bibliothèque de visuels</h2>
  <p class="intro">Les ${d.visuels.length} images réellement présentes dans <code>public/</code>. Miniature, poids, dimensions et emplois sont lus ; l'outil et le prompt viennent du manifeste.</p>

  ${methode("Les dimensions sont lues dans l'en-tête du fichier — PNG, WebP, JPEG et SVG. Un format non reconnu affiche « — » plutôt qu'un chiffre inventé. « Employé dans » cherche le NOM DU FICHIER dans le code source : une adresse construite à l'exécution échappe à cette recherche, et n'apparaît donc pas ici.")}

  ${tete(d.visuels, 12, (liste) => `<div class="galerie">` + liste.map((v) => {
      const n = notes.get(v.chemin) ?? {};
      return `
      <figure class="visuel cherchable" data-texte="${ech(v.nom + " " + v.chemin)}">
        <div class="vignette"><img src="../${ech(v.chemin)}" alt="Aperçu de ${ech(v.nom)}" loading="lazy"></div>
        <figcaption>
          <p class="ligne-nom">${ech(v.nom)}</p>
          <p class="ligne-meta">
            <span>${v.dim ? `${v.dim.l}×${v.dim.h}` : "—"}</span>
            <span>${octets(v.poids)}</span>
            <span>${ech(v.ext)}</span>
          </p>
          <p class="ligne-meta">${v.utilise.length
            ? `<span title="${ech(v.utilise.join(", "))}">employé dans ${v.utilise.length} fichier${v.utilise.length > 1 ? "s" : ""}</span>`
            : `<span class="vide">aucun emploi trouvé par nom</span>`}</p>
          <details class="methode">
            <summary>Origine</summary>
            <p><b>Outil :</b> ${aCompleter(n.outil, "l'outil de génération")}</p>
            <p><b>Prompt :</b> ${aCompleter(n.prompt, "le prompt d'origine")}</p>
          </details>
        </figcaption>
      </figure>`;
    }).join("") + `</div>`, "visuels")}
</section>`;
}

/* ── 5. Ressources externes ─────────────────────────────────── */

function sectionRessources(d, m) {
  const liste = m.ressources ?? [];
  const sansLicence = liste.filter((r) => !r.licence).length;
  return `
<section id="ressources" class="sect">
  <h2><span class="num">5</span> Ressources externes</h2>
  <p class="intro">Polices, icônes, services : ce qui vient d'ailleurs, sous quelle licence et à quel coût. Une licence non renseignée est signalée.</p>

  ${sansLicence ? `<p class="alerte">${sansLicence} ressource${sansLicence > 1 ? "s" : ""} sans licence renseignée. Tant que la case est vide, on ne sait pas si l'usage est permis.</p>` : ""}

  ${liste.length ? `
  <table class="tableau">
    <thead><tr><th>Ressource</th><th>Nature</th><th>Licence</th><th>Coût</th></tr></thead>
    <tbody>
      ${liste.map((r) => `
      <tr class="cherchable" data-texte="${ech(r.nom + " " + (r.nature ?? ""))}">
        <td>${r.url ? `<a href="${ech(r.url)}" rel="noreferrer">${ech(r.nom)}</a>` : ech(r.nom)}</td>
        <td>${ech(r.nature ?? "—")}</td>
        <td>${r.licence ? ech(r.licence) : `<span class="manque">non renseignée</span>`}</td>
        <td>${ech(r.cout ?? "—")}</td>
      </tr>`).join("")}
    </tbody>
  </table>` : `<p>${aCompleter(null, "les ressources externes")}</p>`}
</section>`;
}

/* ── 6. Stack ───────────────────────────────────────────────── */

function sectionStack(d) {
  const toutes = [...d.paquet.dependances, ...d.paquet.dev];
  return `
<section id="stack" class="sect">
  <h2><span class="num">6</span> Stack technique</h2>
  <p class="intro">Les versions viennent de <code>package.json</code>, telles qu'écrites. Aucune n'est recopiée à la main.</p>

  <div class="mesures">
    ${mesure(nb(d.paquet.dependances.length), "dépendances d'exécution")}
    ${mesure(nb(d.paquet.dev.length), "de développement")}
    ${mesure(nb(Object.keys(d.paquet.scripts).length), "scripts npm")}
  </div>

  <h3 class="sous">Scripts</h3>
  <table class="tableau">
    <thead><tr><th>Commande</th><th>Ce qu'elle lance</th></tr></thead>
    <tbody>${Object.entries(d.paquet.scripts).map(([k, v]) =>
      `<tr class="cherchable" data-texte="${ech(k + " " + v)}"><td><code>npm run ${ech(k)}</code></td><td><code>${ech(v)}</code></td></tr>`).join("")}</tbody>
  </table>

  <details class="repli">
    <summary>Les ${toutes.length} dépendances</summary>
    <table class="tableau">
      <thead><tr><th>Paquet</th><th>Version</th><th>Rôle</th></tr></thead>
      <tbody>${toutes.map((p) =>
        `<tr class="cherchable" data-texte="${ech(p.nom)}"><td><code>${ech(p.nom)}</code></td><td>${ech(p.version)}</td><td>${ech(p.type)}</td></tr>`).join("")}</tbody>
    </table>
  </details>
</section>`;
}

/* ── 7. Santé du code ───────────────────────────────────────── */

function sectionSante(d, delta) {
  const tableauFichiers = (liste, colonnes = ["lignes", "poids", "modifié", "commits"]) => `
  <table class="tableau serre">
    <thead><tr><th>Fichier</th>${colonnes.map((c) => `<th>${ech(c)}</th>`).join("")}</tr></thead>
    <tbody>
      ${liste.map((f) => `
      <tr class="cherchable" data-texte="${ech(f.chemin)}">
        <td><code>${ech(f.chemin)}</code></td>
        ${colonnes.includes("lignes") ? `<td class="n">${nb(f.lignes)}</td>` : ""}
        ${colonnes.includes("poids") ? `<td class="n">${octets(f.poids)}</td>` : ""}
        ${colonnes.includes("modifié") ? `<td>${depuis(f.derniereTouche)}</td>` : ""}
        ${colonnes.includes("commits") ? `<td class="n">${nb(f.commits)}<small> / ${nb(f.commitsRecents)} récents</small></td>` : ""}
      </tr>`).join("")}
    </tbody>
  </table>`;

  const maxDossier = Math.max(...d.volumetrie.parDossier.map((x) => x.lignes), 1);

  return `
<section id="sante" class="sect">
  <h2><span class="num">7</span> Santé du code</h2>
  <p class="intro">Tout est compté dans le dépôt, rien n'est estimé. Cette section décrit — elle ne juge pas : un gros fichier n'est pas un défaut, c'est un fait daté.</p>

  <details class="repli perimetre">
    <summary>Ce qui est exclu du comptage, et pourquoi</summary>
    <p>Trois familles sont écartées, sans quoi les chiffres mesureraient autre chose que le travail :</p>
    <ul>
      <li><b>Ignoré par git</b> — ${d.exclus.dossiers.slice(0, 4).map((x) => `<code>${ech(x)}</code>`).join(", ")}.</li>
      <li><b>Généré</b> — ${d.exclus.fichiers.filter((f) => /types|sw\\.js/.test(f)).map((x) => `<code>${ech(x)}</code>`).join(", ")}. Les compter reviendrait à mesurer le travail d'un outil ; <code>types.ts</code> écraserait à lui seul tout classement par taille.</li>
      <li><b>Hors produit</b> — <code>.claude</code> (compétences installées), <code>docs/instantanes</code> (les photos de cette page).</li>
    </ul>
  </details>

  <div class="mesures">
    ${mesure(nb(d.volumetrie.fichiers), "fichiers", "")}${delta("fichiers", d.volumetrie.fichiers)}
    ${mesure(nb(d.volumetrie.lignes), "lignes")}${delta("lignes", d.volumetrie.lignes)}
    ${mesure(nb(d.orphelins.length), "fichiers orphelins")}
    ${mesure(nb(d.marqueurs.length), "marqueurs")}
  </div>

  <h3 class="sous">Où le poids se concentre</h3>
  ${methode("Les lignes de chaque fichier, additionnées par dossier de deuxième niveau — <code>src/components</code> plutôt que <code>src</code>, qui ne dirait rien. Les barres sont proportionnelles au plus grand dossier.")}
  <div class="barres">
    ${d.volumetrie.parDossier.map((x) => `
    <div class="barre cherchable" data-texte="${ech(x.dossier)}">
      <span class="barre-nom"><code>${ech(x.dossier)}</code></span>
      <span class="barre-piste"><i style="width:${Math.max(1, Math.round((x.lignes / maxDossier) * 100))}%"></i></span>
      <span class="barre-val">${nb(x.lignes)}<small> lignes · ${nb(x.fichiers)} fich.</small></span>
    </div>`).join("")}
  </div>

  <h3 class="sous">Par langage</h3>
  ${plier(`Le détail des ${d.volumetrie.parLangage.length} langages`, `
  <table class="tableau">
    <thead><tr><th>Langage</th><th>Fichiers</th><th>Lignes</th><th>Poids</th></tr></thead>
    <tbody>${d.volumetrie.parLangage.map((l) =>
      `<tr class="cherchable" data-texte="${ech(l.langage)}"><td>${ech(l.langage)}</td><td class="n">${nb(l.fichiers)}</td><td class="n">${nb(l.lignes)}</td><td class="n">${octets(l.poids)}</td></tr>`).join("")}</tbody>
  </table>`)}

  <h3 class="sous">Gros et souvent repris</h3>
  <p class="note">Le vrai signal n'est ni la taille seule ni la fréquence seule, mais leur rencontre : un fichier volumineux qu'on rouvre sans cesse est celui qui coûte à chaque passage.</p>
  ${methode("On classe les fichiers par lignes d'un côté, par reprises récentes de l'autre, puis on multiplie les deux RANGS — pas les valeurs brutes, sinon une dimension écraserait l'autre. Les dix meilleurs scores sont ci-dessous. <b>Aucun seuil n'est posé</b> : c'est un classement, pas un verdict, et le onzième n'est pas innocent.")}
  ${tableauFichiers(d.chauds)}

  <h3 class="sous">Les classements</h3>
  ${methode("Comptage des lignes de <code>src</code> et <code>supabase/functions</code>, fichiers générés exclus. « Commits » donne l'historique complet puis, après la barre, les reprises depuis le ${ech(d.debutHumain)} — date où le travail est repassé à la main après l'export automatique.")}
  ${plier("Les quinze plus gros fichiers", tableauFichiers(d.plusGros))}
  ${plier("Les écrans, du plus gros au plus petit — " + d.pages.length + " écrans",
    `<p class="note">Séparés des fichiers utilitaires, pour voir d'un coup d'œil quel écran a grossi.</p>` + tableauFichiers(d.pages.slice(0, 15)))}
  ${plier("Les quinze fichiers hors écrans les plus gros", tableauFichiers(d.horsPages))}
  ${plier(`Repris depuis le ${ech(d.debutHumain)} — ${d.reprisRecemment.length} fichiers en tête`,
    tableauFichiers(d.reprisRecemment, ["lignes", "modifié", "commits"]))}
  ${plier("Les quinze fichiers non touchés depuis le plus longtemps",
    `<p class="note">L'ancienneté n'est pas un défaut : un fichier stable est un fichier qui marche. Elle signale seulement ce qu'on n'a pas relu depuis longtemps.</p>`
    + tableauFichiers(d.dormants, ["lignes", "modifié", "commits"]))}

  <h3 class="sous">Fichiers orphelins</h3>
  ${methode("Fichiers de code que <b>rien n'importe</b>. Le graphe est construit sur les chemins littéraux des <code>import</code> : un chemin calculé à l'exécution y échappe. Les points d'entrée sont écartés — <code>main.tsx</code>, <code>App.tsx</code>, les écrans montés par le routeur, les fonctions de bord et les scripts —, ils ne sont importés par personne <em>par construction</em>.")}
  ${d.orphelins.length
    ? plier(`Les ${d.orphelins.length} fichiers que rien n'importe`, tableauFichiers(d.orphelins, ["lignes", "modifié", "commits"]))
    : `<p class="ok">Aucun fichier orphelin détecté.</p>`}

  <h3 class="sous">Dépendances</h3>
  <div class="grille-2">
    <article class="carte">
      <h4>Déclarées, jamais importées — ${d.dependances.jamaisImportees.length}</h4>
      ${d.dependances.jamaisImportees.length
        ? `<ul class="puces">${d.dependances.jamaisImportees.map((x) => `<li class="cherchable" data-texte="${ech(x)}"><code>${ech(x)}</code></li>`).join("")}</ul>`
        : `<p class="ok">Aucune.</p>`}
      ${methode(`Les outils de construction sont écartés nommément — ils ne s'importent jamais depuis <code>src</code> et les compter serait un faux positif : ${d.dependances.horsImport.slice(0, 6).map((x) => `<code>${ech(x)}</code>`).join(", ")}, etc.`)}
    </article>
    <article class="carte">
      <h4>Importées, absentes du package — ${d.dependances.absentesDuPackage.length}</h4>
      ${d.dependances.absentesDuPackage.length
        ? `<ul class="puces">${d.dependances.absentesDuPackage.map((x) =>
            `<li class="cherchable" data-texte="${ech(x.paquet)}"><code>${ech(x.paquet)}</code> <small>${ech(x.depuis[0] ?? "")}</small></li>`).join("")}</ul>`
        : `<p class="ok">Aucune.</p>`}
    </article>
  </div>

  <h3 class="sous">Marqueurs laissés dans le code</h3>
  ${methode("Recherche de <code>TODO</code>, <code>FIXME</code>, <code>HACK</code>, <code>console.log</code>, <code>eslint-disable</code> et <code>@ts-ignore</code> dans <code>src</code> et <code>supabase/functions</code> uniquement. Les migrations sont écartées : un « TODO » y décrit une décision, pas une dette.")}
  ${d.marqueurs.length ? plier(`Les ${d.marqueurs.length} marqueurs, fichier et ligne`, `
  <table class="tableau serre">
    <thead><tr><th>Marqueur</th><th>Fichier</th><th>Ligne</th><th>Extrait</th></tr></thead>
    <tbody>${d.marqueurs.map((x) => `
      <tr class="cherchable" data-texte="${ech(x.cle + " " + x.fichier)}">
        <td><span class="etiquette">${ech(x.cle)}</span></td>
        <td><code>${ech(x.fichier)}</code></td>
        <td class="n">${x.ligne}</td>
        <td><code class="extrait">${ech(x.extrait)}</code></td>
      </tr>`).join("")}</tbody>
  </table>`) : `<p class="ok">Aucun marqueur.</p>`}

  <h3 class="sous">Tests</h3>
  ${d.tests.configure
    ? `<p>Outils détectés : ${d.tests.outils.map((o) => `<code>${ech(o)}</code>`).join(", ")} — ${d.tests.fichiers.length} fichier(s) de test.</p>`
    : `<p class="alerte">Pas de tests configurés. Aucun outil de test ne figure dans <code>package.json</code> et aucun fichier <code>.test.</code> ou <code>.spec.</code> n'existe dans le dépôt. Un taux de couverture serait ici un zéro décoratif : il n'est pas affiché.</p>`}

  ${d.historique.length > 1 ? `
  <h3 class="sous">Évolution</h3>
  ${methode("Chaque exécution de <code>npm run tableau</code> dépose un instantané daté dans <code>docs/instantanes</code>. Les vingt derniers sont conservés. Le tableau ci-dessous compare les relevés successifs.")}
  <table class="tableau">
    <thead><tr><th>Relevé</th><th>Fichiers</th><th>Lignes</th><th>Commits</th><th>Orphelins</th><th>Marqueurs</th></tr></thead>
    <tbody>${[...d.historique].reverse().map((h) => `
      <tr><td>${ech(h.date)}</td><td class="n">${nb(h.fichiers)}</td><td class="n">${nb(h.lignes)}</td><td class="n">${nb(h.commits)}</td><td class="n">${nb(h.orphelins)}</td><td class="n">${nb(h.marqueurs)}</td></tr>`).join("")}</tbody>
  </table>` : `
  <h3 class="sous">Évolution</h3>
  <p class="note">Un seul relevé pour l'instant. La comparaison apparaîtra à la prochaine exécution de <code>npm run tableau</code>.</p>`}
</section>`;
}

/* ── 8. Documentation ───────────────────────────────────────── */

function sectionDoc(d, m) {
  const ou = m.ouTrouverQuoi ?? [];
  return `
<section id="doc" class="sect">
  <h2><span class="num">8</span> Documentation technique</h2>
  <p class="intro">Par où entrer dans le code, et où trouver quoi.</p>

  <h3 class="sous">Architecture</h3>
  <p>${aCompleter(m.architecture, "le schéma d'architecture")}</p>

  <h3 class="sous">Points d'entrée</h3>
  <ul class="puces">
    <li><code>src/main.tsx</code> — montage de l'application</li>
    <li><code>src/App.tsx</code> — les ${d.modules.length} écrans et leurs routes</li>
    <li><code>src/components/layout/AppLayout.tsx</code> — la coque commune</li>
    <li><code>src/integrations/supabase/client.ts</code> — l'accès aux données</li>
    <li><code>supabase/migrations</code> — le modèle de données, migration par migration</li>
  </ul>

  <h3 class="sous">Où trouver quoi</h3>
  ${ou.length ? `
  <table class="tableau">
    <thead><tr><th>Je cherche…</th><th>C'est ici</th></tr></thead>
    <tbody>${ou.map((r) => `<tr class="cherchable" data-texte="${ech(r.quoi)}"><td>${ech(r.quoi)}</td><td><code>${ech(r.ou)}</code></td></tr>`).join("")}</tbody>
  </table>` : `<p>${aCompleter(null, "la table « où trouver quoi »")}</p>`}

  <h3 class="sous">Conventions</h3>
  ${(m.conventions ?? []).length
    ? `<ul class="regles">${m.conventions.map((c) => `<li>${ech(c)}</li>`).join("")}</ul>`
    : `<p>${aCompleter(null, "les conventions de code")}</p>`}
</section>`;
}

/* ── 9. Décisions ───────────────────────────────────────────── */

function sectionDecisions(d) {
  return `
<section id="decisions" class="sect">
  <h2><span class="num">9</span> Journal des décisions</h2>
  <p class="intro">Les choix structurants, datés, avec leur contexte et ce qui a été écarté. Les notes de <code>mem/</code> y entrent automatiquement.</p>

  ${d.decisions.length ? `
  <div class="liste">
    ${d.decisions.map((dec) => `
    <div class="ligne cherchable" data-texte="${ech(dec.titre + " " + (dec.contexte ?? ""))}">
      <div class="ligne-corps">
        <p class="ligne-nom">${ech(dec.titre)}</p>
        <p class="ligne-meta">
          <span>${dec.date ? jour(dec.date) : "date inconnue"}</span>
          ${dec.type ? `<span class="etiquette">${ech(dec.type)}</span>` : ""}
          ${dec.source ? `<code>${ech(dec.source)}</code>` : ""}
        </p>
        ${dec.contexte ? `<p class="ligne-note">${ech(dec.contexte)}</p>` : ""}
        ${dec.alternative ? `<p class="ligne-note"><b>Écarté :</b> ${ech(dec.alternative)}</p>` : ""}
      </div>
    </div>`).join("")}
  </div>` : `<p>${aCompleter(null, "le journal des décisions")}</p>`}
</section>`;
}

/* ── 10. Prochaines étapes ──────────────────────────────────── */

function sectionSuite(d, m) {
  const liste = (m.prochainesEtapes ?? []).slice(0, 5);
  return `
<section id="suite" class="sect">
  <h2><span class="num">10</span> Prochaines étapes</h2>
  <p class="intro">Cinq lignes au plus. Ce qui déborde n'a pas sa place ici.</p>
  ${liste.length
    ? `<ol class="etapes">${liste.map((e) => `<li>${ech(e)}</li>`).join("")}</ol>`
    : `<p>${aCompleter(null, "les prochaines étapes")}</p>`}
  ${(m.prochainesEtapes ?? []).length > 5
    ? `<p class="note">${m.prochainesEtapes.length - 5} entrée(s) de plus dans le manifeste ne sont pas affichées : la section s'arrête à cinq, volontairement.</p>` : ""}
</section>`;
}

/* ── Feuille de style ───────────────────────────────────────── */

function styles(d) {
  const faces = d.polices.map((p) => {
    const cle = p.famille.replace(/[^a-z0-9]/gi, "-");
    return `@font-face{font-family:'${cle}';src:url('../${p.chemin}') format('woff2');font-weight:${p.graisse ?? 400};font-display:swap}`;
  }).join("\n");

  return `${faces}

/* Un outil de travail se lit en plein jour et se relit le soir : les
   deux thèmes existent, et c'est la préférence du système qui tranche.
   Un seul accent, repris du signal de Vowpact, et jamais en aplat. */
:root{
  --fond:#FBFBF9; --plaque:#FFFFFF; --creux:#F4F4F1; --trait:#E2E2DC;
  /* --encre-3 vaut 4,46 sur le fond clair et 4,2 sur les creux :
     sous la barre des 4,5 exigee. Assombri jusqu a 5,0 et 4,7. */
  --encre:#14181B; --encre-2:#4A5257; --encre-3:#656D72;
  --accent:#00637A; --accent-doux:#E4F2F5;
  --alerte:#9A2617; --alerte-doux:#FBEAE7; --ok:#1F6B3F;
  --r:8px;
}
@media (prefers-color-scheme: dark){
  :root{
    --fond:#0E1116; --plaque:#151A21; --creux:#1B212A; --trait:#28303A;
    --encre:#EDF1F5; --encre-2:#AAB6C0; --encre-3:#7E8A95;
    --accent:#4FC3DC; --accent-doux:#14303A;
    --alerte:#FF8A7A; --alerte-doux:#37201C; --ok:#7ED9A0;
  }
}

*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:96px}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{
  margin:0;background:var(--fond);color:var(--encre);
  font:400 15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  -webkit-font-smoothing:antialiased;
}
code{font:500 12.5px/1.5 ui-monospace,"SF Mono",Menlo,Consolas,monospace;background:var(--creux);padding:1px 5px;border-radius:4px;word-break:break-all}
a{color:var(--accent)}
h1,h2,h3,h4{margin:0;line-height:1.25}

.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
/* Le lien d evitement prend la paire la plus contrastee des deux
   themes : blanc sur l accent clair du mode sombre tombait a 2,06. */
.saut{position:absolute;left:-9999px;top:0;background:var(--encre);color:var(--fond);padding:10px 16px;z-index:99;border-radius:0 0 var(--r) 0;font-weight:600}
.saut:focus{left:8px;top:8px}

/* ── En-tête ── */
.tete{position:sticky;top:0;z-index:20;background:var(--fond);border-bottom:1px solid var(--trait)}
.tete-in{max-width:1240px;margin:0 auto;padding:14px 24px;display:flex;gap:20px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.marque{display:flex;align-items:center;gap:12px}
.marque-point{width:10px;height:10px;border-radius:50%;background:var(--accent);flex-shrink:0}
.tete h1{font-size:19px;letter-spacing:-.01em}
.tete-sous{margin:2px 0 0;font-size:12.5px;color:var(--encre-3)}
.outils{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.chercher input{
  width:min(340px,60vw);padding:8px 12px;border:1px solid var(--trait);
  border-radius:var(--r);background:var(--plaque);color:var(--encre);font:inherit;font-size:14px;
}
.chercher input:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.filtres{display:flex;gap:4px;flex-wrap:wrap}
.filtre{
  padding:6px 11px;border:1px solid var(--trait);border-radius:999px;background:var(--plaque);
  color:var(--encre-2);font:inherit;font-size:12.5px;cursor:pointer;
}
.filtre[aria-pressed="true"]{background:var(--accent-doux);border-color:var(--accent);color:var(--accent)}
.filtre:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

/* ── Mise en page ── */
.page{max-width:1240px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:200px minmax(0,1fr);gap:36px;align-items:start}
.sommaire{position:sticky;top:84px;padding:24px 0}
.sommaire ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:1px}
.sommaire a{
  display:flex;gap:9px;align-items:baseline;padding:7px 10px;border-radius:6px;
  color:var(--encre-2);text-decoration:none;font-size:13.5px;
}
.sommaire a:hover{background:var(--creux);color:var(--encre)}
.sommaire a:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.sommaire span{color:var(--encre-3);font:500 11px ui-monospace,monospace;min-width:14px}
main{padding:24px 0 96px;min-width:0}

/* ── Sections ── */
.sect{padding:32px 0;border-top:1px solid var(--trait)}
.sect:first-child{border-top:0;padding-top:12px}
.sect h2{font-size:21px;letter-spacing:-.01em;display:flex;align-items:baseline;gap:11px}
.num{color:var(--accent);font:600 13px ui-monospace,monospace}
.intro{margin:8px 0 20px;color:var(--encre-2);max-width:70ch}
.sous{margin:30px 0 10px;font-size:14px;font-weight:650;letter-spacing:.01em}
.note{margin:8px 0;font-size:13.5px;color:var(--encre-3);max-width:72ch}

/* ── Cartes et mesures ── */
.grille-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}
.carte{border:1px solid var(--trait);border-radius:var(--r);background:var(--plaque);padding:16px}
.carte.pleine{grid-column:1/-1}
.carte h3,.carte h4{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--encre-3);margin-bottom:8px}
.carte p{margin:0}
.phrase{font-size:16.5px;line-height:1.45}
.mesures{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:18px 0}
.mesure{border:1px solid var(--trait);border-radius:var(--r);background:var(--plaque);padding:13px 15px}
.mesure b{display:block;font:650 24px/1.1 ui-monospace,monospace;font-variant-numeric:tabular-nums}
.mesure span{display:block;margin-top:3px;font-size:12px;color:var(--encre-3);text-transform:uppercase;letter-spacing:.06em}
.delta{display:inline-block;margin:-6px 0 12px;font:500 12px ui-monospace,monospace}
.delta.hausse{color:var(--accent)} .delta.baisse{color:var(--ok)} .delta.plat{color:var(--encre-3)}

/* ── Listes ── */
.liste{display:flex;flex-direction:column;gap:6px}
.ligne{border:1px solid var(--trait);border-radius:var(--r);background:var(--plaque);padding:11px 14px}
.ligne.compacte{padding:8px 12px}
.ligne.compacte .ligne-nom{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ligne-nom{margin:0;font-weight:600;font-size:14.5px}
.ligne-meta{margin:4px 0 0;display:flex;gap:9px;flex-wrap:wrap;align-items:center;font-size:12.5px;color:var(--encre-3)}
.ligne-note{margin:6px 0 0;font-size:13.5px;color:var(--encre-2)}
.puces{margin:6px 0;padding-left:18px;font-size:13.5px}
/* Un chemin de fichier est long : il se coupe plutôt que de pousser la
   page de côté. Le débordement horizontal venait de là. */
.puces li{margin:3px 0;overflow-wrap:anywhere}
.puces small{display:block;color:var(--encre-3);font-size:11.5px;overflow-wrap:anywhere}
.regles{margin:6px 0;padding-left:18px;max-width:78ch}
.regles li{margin:5px 0}
.interdits li::marker{color:var(--alerte)}
.etapes{margin:6px 0;padding-left:22px;max-width:78ch;font-size:15px}
.etapes li{margin:7px 0}

/* ── États ── */
.etat{padding:1px 8px;border-radius:999px;border:1px solid currentColor;font:600 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.04em}
.etat[data-s="livré"]{color:var(--ok)}
.etat[data-s="en cours"]{color:var(--accent)}
.etat[data-s="en pause"]{color:var(--encre-3)}
.etat[data-s="idée"]{color:var(--encre-3)}
.etat[data-s="à compléter"]{color:var(--alerte)}
.etiquette{padding:1px 7px;border-radius:4px;background:var(--creux);font:600 11px ui-monospace,monospace}
.vide,.manque{color:var(--alerte);font-style:italic}
.alerte{border:1px solid var(--alerte);background:var(--alerte-doux);color:var(--encre);padding:12px 15px;border-radius:var(--r);margin:12px 0;max-width:78ch}
.ok{color:var(--encre-3);font-size:13.5px}

/* ── Tableaux ── */
.tableau{width:100%;border-collapse:collapse;margin:10px 0;font-size:13.5px;display:block;overflow-x:auto}
.tableau thead th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--encre-3);padding:7px 10px;border-bottom:1px solid var(--trait);white-space:nowrap}
.tableau td{padding:7px 10px;border-bottom:1px solid var(--trait);vertical-align:top}
.tableau tbody tr:hover{background:var(--creux)}
.tableau .n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.tableau small{color:var(--encre-3)}
.serre td,.serre th{padding:5px 10px}
.extrait{max-width:44ch;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom}

/* ── Barres ── */
.barres{display:flex;flex-direction:column;gap:5px;margin:10px 0}
.barre{display:grid;grid-template-columns:minmax(120px,190px) 1fr minmax(120px,auto);gap:12px;align-items:center;font-size:13px}
.barre-piste{height:9px;border-radius:5px;background:var(--creux);overflow:hidden}
.barre-piste i{display:block;height:100%;background:var(--accent);border-radius:5px}
.barre-val{text-align:right;font-variant-numeric:tabular-nums;color:var(--encre-2)}
.barre-val small{color:var(--encre-3)}

/* ── Palette et polices ── */
.bandes{display:flex;flex-direction:column;gap:12px;margin:12px 0}
.bande-nom{margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:var(--encre-3)}
.bande-pastilles{display:flex;flex-wrap:wrap;gap:3px}
.pastille.mini{width:26px;height:26px;border-radius:4px}
.themes{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}
.themes h4{font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:var(--encre-3);margin-bottom:8px}
.teintes{display:flex;flex-direction:column;gap:3px}
.teinte{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:9px;align-items:center;font-size:12.5px;padding:2px 0}
.teinte em{grid-column:2/-1;color:var(--encre-3);font-size:12px;font-style:normal}
.pastille{width:22px;height:22px;border-radius:5px;border:1px solid var(--trait)}
.hex{font:500 12px ui-monospace,monospace;color:var(--encre-3)}
.polices{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.police{border:1px solid var(--trait);border-radius:var(--r);background:var(--plaque);padding:14px}
.echantillon{margin:0 0 8px;font-size:21px;line-height:1.3}

/* ── Galerie ── */
.galerie{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px}
.visuel{margin:0;border:1px solid var(--trait);border-radius:var(--r);background:var(--plaque);overflow:hidden}
.vignette{aspect-ratio:16/10;display:grid;place-items:center;background:var(--creux);padding:10px}
.vignette img{max-width:100%;max-height:100%;object-fit:contain}
.visuel figcaption{padding:10px 12px}

/* ── Replis ── */
.methode,.repli{margin:8px 0}
.methode summary,.repli summary{
  cursor:pointer;font-size:12.5px;color:var(--encre-3);
  padding:4px 0;list-style:none;display:inline-flex;gap:6px;align-items:center;
}
.methode summary::before,.repli summary::before{content:"▸";font-size:10px}
.methode[open] summary::before,.repli[open] summary::before{content:"▾"}
.methode summary:hover,.repli summary:hover{color:var(--encre)}
.methode summary:focus-visible,.repli summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.methode p{margin:6px 0 10px;padding-left:16px;border-left:2px solid var(--trait);font-size:13px;color:var(--encre-2);max-width:78ch}
.repli>*:not(summary){margin-top:8px}
.perimetre ul{font-size:13.5px;color:var(--encre-2);max-width:78ch}

.pied{border-top:1px solid var(--trait);padding:20px 24px;text-align:center}
.pied p{margin:0;font-size:12.5px;color:var(--encre-3)}

.masque{display:none !important}

/* ── Petits écrans ── */
@media (max-width:900px){
  .page{grid-template-columns:1fr;gap:0}
  .sommaire{position:static;padding:16px 0 0}
  .sommaire ol{flex-direction:row;flex-wrap:wrap;gap:4px}
  .sommaire a{border:1px solid var(--trait);border-radius:999px;padding:5px 11px;font-size:12.5px}
}

/* ── Impression ── */
@media print{
  .tete,.sommaire,.pied,.saut{display:none}
  .page{display:block;padding:0;max-width:none}
  body{background:#fff;color:#000;font-size:11pt}
  .sect{break-inside:avoid-page;padding:14pt 0}
  .methode[open],.repli[open]{break-inside:avoid}
  .methode:not([open]) summary,.repli:not([open]) summary{display:none}
  .carte,.mesure,.ligne,.visuel,.police{border-color:#bbb}
  a{color:#000;text-decoration:underline}
}`;
}

/* ── Comportement ─────────────────────────────────────────────
   Deux gestes, pas trois : chercher, et filtrer par statut. Rien
   n'anime, rien ne se déplace tout seul. */

function script() {
  return `
(function(){
  var q = document.getElementById('q');
  var filtres = Array.prototype.slice.call(document.querySelectorAll('.filtre'));
  var statutActif = 'tous';

  function normaliser(s){
    return (s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');
  }

  function appliquer(){
    var terme = normaliser(q.value.trim());
    document.querySelectorAll('.cherchable').forEach(function(el){
      var texte = normaliser(el.dataset.texte || el.textContent);
      var passeTexte = !terme || texte.indexOf(terme) !== -1;
      var passeStatut = statutActif === 'tous'
        || !el.classList.contains('filtrable')
        || el.dataset.statut === statutActif;
      el.classList.toggle('masque', !(passeTexte && passeStatut));
    });

    /* UN RÉSULTAT REPLIÉ N'EST PAS UN RÉSULTAT. Les sections gardent
       leurs longues listes derrière un dépliant ; pendant une recherche
       on ouvre ceux qui contiennent quelque chose, et on les referme
       quand la recherche se vide — sauf ceux que l'on avait ouverts
       soi-même, qui restent comme on les a laissés. */
    document.querySelectorAll('details.repli').forEach(function(det){
      if (!terme) {
        if (det.dataset.ouvertParRecherche) { det.open = false; delete det.dataset.ouvertParRecherche; }
        return;
      }
      var dedans = det.querySelectorAll('.cherchable:not(.masque)').length;
      if (dedans && !det.open) { det.open = true; det.dataset.ouvertParRecherche = '1'; }
      if (!dedans && det.dataset.ouvertParRecherche) { det.open = false; delete det.dataset.ouvertParRecherche; }
    });

    /* Une section vidée par la recherche se replie : garder des titres
       au-dessus de rien fait croire qu'on n'a pas trouvé. */
    document.querySelectorAll('.sect').forEach(function(sect){
      var total = sect.querySelectorAll('.cherchable').length;
      if (!total) return;
      var restants = sect.querySelectorAll('.cherchable:not(.masque)').length;
      sect.classList.toggle('masque', terme && restants === 0);
    });
  }

  q.addEventListener('input', appliquer);
  q.addEventListener('keydown', function(e){
    if (e.key === 'Escape') { q.value = ''; appliquer(); }
  });

  filtres.forEach(function(b){
    b.addEventListener('click', function(){
      statutActif = b.dataset.statut;
      filtres.forEach(function(o){ o.setAttribute('aria-pressed', String(o === b)); });
      appliquer();
    });
  });

  /* « / » met le curseur dans la recherche, comme partout ailleurs. */
  document.addEventListener('keydown', function(e){
    if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); }
  });
})();
`;
}
