/* L EMPREINTE D UN ECRAN, PRISE DANS LE NAVIGATEUR.
 *
 * Ce fichier ne s execute pas sous Node : il se colle dans la console
 * de la page ouverte, qui porte la session connectee. Il rend un objet
 * JSON que `scripts/empreinte.mjs` enregistre ou compare.
 *
 * QUATRE LECONS SONT ENCODEES ICI. Chacune vient d une comparaison qui
 * m a menti, et aucune ne se voit en relisant le code :
 *
 * 1. ON MESURE #root, PAS LE DOCUMENT. Une comparaison a signale un
 *    ecart qui etait un `<span>` pose directement sur `<body>`, hors de
 *    l application. Une regle qui inclut le decor mesure le decor.
 *
 * 2. ON ATTEND LE REPOS, PAS UN DELAI. Le nombre de points d un
 *    graphique valait 182 a 2,2 s apres le clic et 194 a 3,5 s. Un delai
 *    fixe fabrique donc des ecarts qui n existent pas. On releve
 *    jusqu a obtenir deux signatures identiques d affilee.
 *
 * 3. L ETIQUETTE VIENT DU DOM, PAS DE LA BOUCLE. La page restaure la
 *    derniere vue consultee : deux releves ont ete ranges sous le nom de
 *    l onglet que je croyais avoir clique. `aria-selected` ne se trompe
 *    pas.
 *
 * 4. ON VERIFIE OU L ON EST APRES CHAQUE CLIC. Un clic mal cible a
 *    envoye la capture sur /shop et sur /goals sans que rien ne le dise ;
 *    les relevés suivants decrivaient une autre page.
 */
window.empreinte = async function empreinte({
  route,
  onglets = null,      // selecteur des onglets de vue, ou null
  boutons = [],        // libelles exacts a parcourir dans chaque vue
  reposMax = 12,       // relevés au plus avant d abandonner
  pas = 400,           // millisecondes entre deux relevés
  masquer = [],        // motifs de ce qui bouge tout seul — voir plus bas
}) {
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  const racine = () => document.getElementById("root");
  const journal = [];

  /* La signature d un ecran : ce qu il AFFICHE, et de quoi c est fait.
     La liste complete des nombres est la partie qui porte la preuve —
     le reste sert a situer un ecart, pas a le detecter. */
  /* CE QUI BOUGE TOUT SEUL.
   *
   * Une page qui affiche l heure differe d elle-meme d une minute sur
   * l autre : la premiere comparaison sur /calendar a signale
   * « 17:14 → 18:33 », et c etait l horloge. Sans de quoi le nommer,
   * la regle devient inutilisable sur tout ecran qui en porte une.
   *
   * Masquer est dangereux — ca peut cacher un vrai changement. D ou
   * deux regles : on ne masque QUE ce que l appelant nomme, et le
   * masque est INSCRIT dans l empreinte, donc visible a la relecture.
   * Un masque silencieux serait pire que pas de regle du tout. */
  const masques = masquer.map((m) => (m instanceof RegExp ? m : new RegExp(m, "g")));
  const masquerLe = (s) => masques.reduce((t, m) => t.replace(m, "▒"), s);

  function signature() {
    const r = racine();
    if (!r) throw new Error("pas de #root");
    const n = (s) => r.querySelectorAll(s).length;
    const texte = masquerLe(r.innerText);
    return {
      masques: masques.map(String),
      texte,
      nombres: (texte.match(/-?\d[\d   .,]*/g) || []).map((s) => s.trim()).filter(Boolean),
      titres: [...r.querySelectorAll("h1,h2,h3,h4")].map((h) => h.textContent.trim()),
      svg: n("svg"), paths: n("svg path"), rects: n("svg rect"),
      points: n(".recharts-dot,.recharts-bar-rectangle,.recharts-sector"),
      courbes: n(".recharts-curve"),
      boutons: n("button"), champs: n("input,textarea,select"),
    };
  }

  /* LE REPOS. Deux signatures identiques d affilee, ou l on renonce en
     le disant. Renoncer en silence rendrait une empreinte instable
     indiscernable d une empreinte stable. */
  async function auRepos(quoi) {
    let precedente = null;
    for (let i = 0; i < reposMax; i++) {
      await attendre(pas);
      const s = signature();
      const cle = JSON.stringify(s);
      if (precedente === cle) return s;
      precedente = cle;
    }
    journal.push(`${quoi} : JAMAIS AU REPOS apres ${reposMax * pas} ms`);
    return { ...signature(), instable: true };
  }

  async function allerA(chemin) {
    if (location.pathname !== chemin) {
      history.pushState({}, "", chemin);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
    await auRepos(chemin);
    if (location.pathname !== chemin) throw new Error(`attendu ${chemin}, obtenu ${location.pathname}`);
  }

  /* Le nom de la vue active se lit sur l onglet, jamais sur la boucle. */
  const nomActif = () => {
    if (!onglets) return "";
    const a = [...document.querySelectorAll(onglets)].find((b) => b.getAttribute("aria-selected") === "true");
    return a ? (a.textContent || "").trim().split(/(?=[A-ZÀ-Ý])/)[0] : "?";
  };
  const parLibelle = (t) => [...document.querySelectorAll("button")].filter((b) => (b.textContent || "").trim() === t);

  await allerA(route);
  const vues = {};

  async function releverLesBoutons(prefixe) {
    if (!boutons.length) { vues[prefixe || nomActif() || "-"] = await auRepos(prefixe); return; }
    for (const t of boutons) {
      const cands = parLibelle(t);
      if (cands.length !== 1) { journal.push(`« ${t} » : ${cands.length} bouton(s), passe`); continue; }
      cands[0].click();
      const s = await auRepos(`${prefixe}/${t}`);
      if (location.pathname !== route) throw new Error(`« ${t} » a quitte ${route} pour ${location.pathname}`);
      vues[`${nomActif() || prefixe || "-"}/${t}`] = s;
    }
  }

  if (onglets) {
    const noms = [...document.querySelectorAll(onglets)].map((b) => (b.textContent || "").trim());
    for (const nom of noms) {
      const b = [...document.querySelectorAll(onglets)].find((x) => (x.textContent || "").trim() === nom);
      if (!b) { journal.push(`onglet « ${nom.slice(0, 20)} » disparu`); continue; }
      b.click();
      await auRepos(nom);
      if (location.pathname !== route) throw new Error(`l onglet a quitte ${route} pour ${location.pathname}`);
      await releverLesBoutons(nomActif());
    }
  } else {
    await releverLesBoutons("");
  }

  return { route, prises: Object.keys(vues).length, journal, vues };
};

/* POSER ET COMPARER SANS SORTIR LES DONNEES DE LA PAGE.
 *
 * Une empreinte de six vues pese vingt-cinq kilo-octets. La faire
 * traverser deux fois par fichier coute plus cher que le travail
 * lui-meme — et sert a quoi ? A relire des listes de nombres.
 *
 * La comparaison se fait donc ICI, ou les donnees sont deja, et seul le
 * verdict sort. `scripts/empreinte.mjs` reste pour ce qui doit vivre sur
 * le disque : une reference qu on garde d une session a l autre.
 */
window.poserEmpreinte = async function poserEmpreinte(nom, options) {
  const e = await window.empreinte(options);
  sessionStorage.setItem("empreinte:" + nom, JSON.stringify(e));
  return { pose: nom, route: e.route, prises: e.prises, journal: e.journal,
           instables: Object.entries(e.vues).filter(([, s]) => s.instable).map(([k]) => k),
           vues: Object.fromEntries(Object.entries(e.vues).map(([k, s]) => [k, s.nombres.length + " nombres"])) };
};

window.comparerEmpreinte = async function comparerEmpreinte(nom, options) {
  const brut = sessionStorage.getItem("empreinte:" + nom);
  if (!brut) return { erreur: `aucune empreinte « ${nom} » posee` };
  const avant = JSON.parse(brut);
  const apres = await window.empreinte(options ?? { route: avant.route });
  const rapport = { nom, route: avant.route, journal: apres.journal, ecarts: {} };

  for (const k of Object.keys(avant.vues)) if (!(k in apres.vues)) rapport.ecarts[k] = "VUE DISPARUE";
  for (const k of Object.keys(apres.vues)) if (!(k in avant.vues)) rapport.ecarts[k] = "vue apparue";

  for (const [cle, a] of Object.entries(avant.vues)) {
    const b = apres.vues[cle];
    if (!b) continue;
    const dits = [];
    /* Comparer deux releves masques differemment ne compare rien. */
    if (String(a.masques ?? []) !== String(b.masques ?? []))
      dits.push(`MASQUES DIFFERENTS : « ${a.masques ?? []} » puis « ${b.masques ?? []} » — cette comparaison ne vaut rien`);
    if (JSON.stringify(a.nombres) !== JSON.stringify(b.nombres)) {
      const n = Math.max(a.nombres.length, b.nombres.length), ch = [];
      for (let i = 0; i < n && ch.length < 6; i++)
        if (a.nombres[i] !== b.nombres[i]) ch.push(`#${i} « ${a.nombres[i] ?? "—"} » → « ${b.nombres[i] ?? "—"} »`);
      dits.push(`NOMBRES ${a.nombres.length} → ${b.nombres.length} : ${ch.join(", ")}`);
    }
    const A = a.texte.split("\n"), B = b.texte.split("\n");
    const partis = A.filter((l) => !B.includes(l)), venus = B.filter((l) => !A.includes(l));
    if (partis.length) dits.push(`disparues (${partis.length}) : ${partis.slice(0, 4).join(" | ")}`);
    if (venus.length) dits.push(`apparues (${venus.length}) : ${venus.slice(0, 4).join(" | ")}`);
    const geo = ["svg", "paths", "rects", "points", "courbes", "boutons", "champs"]
      .filter((c) => a[c] !== b[c]).map((c) => `${c} ${a[c]} → ${b[c]}`);
    if (geo.length) dits.push(`geometrie : ${geo.join(", ")}`);
    if (b.instable) dits.push("JAMAIS AU REPOS — ce releve ne prouve rien");
    if (dits.length) rapport.ecarts[cle] = dits;
  }

  const n = Object.keys(rapport.ecarts).length;
  rapport.verdict = n ? `${n} vue(s) ont change` : `${Object.keys(avant.vues).length} vue(s) identiques — texte, nombres et geometrie`;
  return rapport;
};

/* Pour verser une empreinte sur le disque quand elle doit survivre a la
   session : `copy(JSON.stringify(dumpEmpreinte(nom)))` dans la console,
   puis `node scripts/empreinte.mjs poser <nom> <fichier>`. */
window.dumpEmpreinte = (nom) => JSON.parse(sessionStorage.getItem("empreinte:" + nom) || "null");
