import { useState } from "react";
import { Search, Plus, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import "@/styles/apercu-journal.css";

/* MAQUETTE JETABLE — six themes pour le journal.
   Le meme contenu, rendu six fois, avec la vraie typographie et des
   filtres qui fonctionnent. */

type V = "A" | "B" | "C" | "D" | "E" | "F";

interface Entree {
  ref: string; titre: string; date: string; heure: string;
  humeur: string; teinte: string; mots: number; tags: string[];
  epingle?: boolean; valence: number; texte: string[];
}

const HUMEURS = [
  { id: "flow", nom: "Flux", teinte: "#22D3EE", n: 12 },
  { id: "tension", nom: "Tension", teinte: "#FF375F", n: 5 },
  { id: "static", nom: "Statique", teinte: "#8A97A6", n: 3 },
  { id: "signal", nom: "Signal", teinte: "#FCEE0A", n: 7 },
  { id: "void", nom: "Vide", teinte: "#8B5CF6", n: 2 },
  { id: "surge", nom: "Poussee", teinte: "#30D158", n: 6 },
];

const ENTREES: Entree[] = [
  {
    ref: "4A21", titre: "La revue trimestrielle, enfin close", date: "2026.08.20", heure: "14:32",
    humeur: "surge", teinte: "#30D158", mots: 412, tags: ["travail", "bilan"], epingle: true, valence: 8,
    texte: [
      "Trois semaines a repousser ce document, et il a fallu quarante minutes. Ce n est pas le travail qui pesait, c est l idee du travail — la difference que je mets six mois a reapprendre chaque annee.",
      "Ce qui a debloque : ecrire la conclusion en premier. Le reste s est range tout seul derriere.",
    ],
  },
  {
    ref: "77E0", titre: "Nuit courte, tete claire", date: "2026.08.19", heure: "07:14",
    humeur: "flow", teinte: "#22D3EE", mots: 268, tags: ["sante"], valence: 6,
    texte: [
      "Cinq heures et demie, et pourtant la matinee la plus nette du mois. Je note pour ne pas en tirer de regle : c est une exception, pas une methode.",
    ],
  },
  {
    ref: "31D4", titre: "Ce que le silence de M. voulait dire", date: "2026.08.17", heure: "22:48",
    humeur: "tension", teinte: "#FF375F", mots: 631, tags: ["relations"], valence: 3,
    texte: [
      "J ai passe la soiree a construire six versions de la meme phrase. Aucune ne tenait le lendemain matin, ce qui devrait m apprendre quelque chose sur les phrases construites le soir.",
    ],
  },
  {
    ref: "9C02", titre: "Kine — quatrieme seance", date: "2026.08.15", heure: "18:05",
    humeur: "signal", teinte: "#FCEE0A", mots: 154, tags: ["sante", "suivi"], valence: 7,
    texte: ["L epaule tient. Trois series au lieu de deux, et pas de douleur le soir. Le protocole marche, il faut juste le faire."],
  },
  {
    ref: "5A8C", titre: "Rien a signaler, et c est le sujet", date: "2026.08.12", heure: "21:30",
    humeur: "static", teinte: "#8A97A6", mots: 96, tags: [], valence: 5,
    texte: ["Journee sans relief. Je l ecris quand meme, parce que les jours sans relief disparaissent, et qu ils sont la plupart."],
  },
  {
    ref: "0F3A", titre: "L idee du samedi matin", date: "2026.08.08", heure: "09:52",
    humeur: "surge", teinte: "#30D158", mots: 337, tags: ["projet"], valence: 9,
    texte: ["Une idee qui tient debout apres trois cafes : rare. Je la pose ici avant de la juger, parce que je sais que je la jugerai mal."],
  },
];

const MOIS = [
  { nom: "MAR", n: 4 }, { nom: "AVR", n: 9 }, { nom: "MAI", n: 6 },
  { nom: "JUIN", n: 12 }, { nom: "JUIL", n: 8 }, { nom: "AOUT", n: 6 },
];

const st = (teinte: string) => ({ ["--teinte" as string]: teinte } as React.CSSProperties);

/* ── A ─ RELAIS ─────────────────────────────────────────────── */
function Relais() {
  const [humeur, setHumeur] = useState<string | null>(null);
  const entrees = humeur ? ENTREES.filter((e) => e.humeur === humeur) : ENTREES;
  return (
    <div className="relais">
      <div className="relais-index">
        <p className="relais-sig"><b>LOG.01</b> — Index</p>
        <button className="relais-cat" aria-pressed={humeur === null} onClick={() => setHumeur(null)} style={st("#FCEE0A")}>
          <i /> Toutes <span>35</span>
        </button>
        <button className="relais-cat" aria-pressed={false} style={st("#FCEE0A")}>
          <i /> Epinglees <span>4</span>
        </button>
        <div className="relais-separateur" />
        {HUMEURS.map((h) => (
          <button
            key={h.id}
            className="relais-cat"
            aria-pressed={humeur === h.id}
            onClick={() => setHumeur(humeur === h.id ? null : h.id)}
            style={st(h.teinte)}
          >
            <i /> {h.nom} <span>{h.n}</span>
          </button>
        ))}
        <div className="relais-separateur" />
        <p className="relais-sig">Ce mois <b>6</b></p>
      </div>

      <div className="relais-corps">
        <div className="relais-barre">
          <div className="relais-recherche">
            <Search className="w-3.5 h-3.5" style={{ color: "#63717F" }} />
            <input placeholder="RECHERCHER DANS 35 ENTREES…" readOnly />
          </div>
          <button className="relais-action"><Plus className="w-3.5 h-3.5" />Nouvelle</button>
        </div>

        <div className="relais-flux">
          {entrees.map((e) => (
            <article key={e.ref} className="relais-fiche" style={st(e.teinte)}>
              <span className="relais-dos" />
              <div className="relais-fiche-corps">
                <p className="relais-meta">
                  <b>REF·{e.ref}</b><span className="sep">/</span>{e.date}<span className="sep">/</span>{e.heure}
                  <span className="sep">/</span><b>{HUMEURS.find((h) => h.id === e.humeur)?.nom}</b>
                  <span className="sep">/</span>{e.mots} mots
                  {e.epingle && <span className="epingle">◆ EPINGLEE</span>}
                </p>
                <h3 className="relais-titre">{e.titre}</h3>
                <p className="relais-texte">{e.texte[0]}</p>
                <div className="relais-pied">
                  {e.tags.map((t) => <span key={t} className="relais-tag">/{t}</span>)}
                  <span className="relais-jauge" title={`Valence ${e.valence}/10`}>
                    {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < e.valence ? "plein" : undefined} />)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── B ─ FLUX ───────────────────────────────────────────────── */
function Flux() {
  const [humeur, setHumeur] = useState<string | null>(null);
  const entrees = humeur ? ENTREES.filter((e) => e.humeur === humeur) : ENTREES;
  return (
    <div className="flux">
      <div className="flux-tete">
        <span><b>LOG.01</b> // JOURNAL</span>
        <div className="flux-invite">
          <span>&gt;_</span>
          <input placeholder="chercher, ou /humeur:flux, /epinglees" readOnly />
        </div>
        <button className="flux-ajouter"><Plus className="w-3.5 h-3.5" />Ecrire</button>
      </div>

      <div className="flux-metre">
        <button className="flux-cran" aria-pressed={humeur === null} onClick={() => setHumeur(null)} style={st("#00E5D0")}>
          <u>35</u>Tout
        </button>
        {HUMEURS.map((h) => (
          <button
            key={h.id}
            className="flux-cran"
            aria-pressed={humeur === h.id}
            onClick={() => setHumeur(humeur === h.id ? null : h.id)}
            style={st(h.teinte)}
          >
            <u>{h.n}</u>{h.nom}
          </button>
        ))}
      </div>

      <div className="flux-liste">
        {entrees.map((e) => (
          <article key={e.ref} className="flux-entree" style={st(e.teinte)}>
            <p className="flux-code">
              {e.date} · {e.heure}<span className="fil" /><b>{HUMEURS.find((h) => h.id === e.humeur)?.nom}</b>
              <span>·</span>{e.mots} mots{e.epingle && <><span>·</span><span style={{ color: "#FCEE0A" }}>epinglee</span></>}
            </p>
            <h3 className="flux-titre">{e.titre}</h3>
            {e.texte.map((p, i) => <p key={i} className="flux-texte">{p}</p>)}
            <div className="flux-outils">
              <button className="flux-outil">Modifier</button>
              <button className="flux-outil">Epingler</button>
              <button className="flux-outil">Supprimer</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ── C ─ GRILLE ─────────────────────────────────────────────── */
function Grille() {
  const [mois, setMois] = useState<string | null>("AOUT");
  return (
    <div className="grille">
      <div className="grille-tete">
        <h2 className="grille-titre">Journal<em>.</em></h2>
        <div className="grille-frise" role="group" aria-label="Frise des mois">
          {MOIS.map((m) => (
            <button
              key={m.nom}
              className="grille-mois"
              aria-pressed={mois === m.nom}
              onClick={() => setMois(mois === m.nom ? null : m.nom)}
            >
              <i style={{ height: `${8 + m.n * 2.6}px` }} />
              <span>{m.nom}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grille-mosaique">
        {ENTREES.map((e) => (
          <button key={e.ref} className={cn("grille-eclat", e.epingle && "est-epingle")} style={st(e.teinte)}>
            <p className="grille-eclat-code"><b>{e.date}</b> · {e.heure}</p>
            <h3>{e.titre}</h3>
            <p>{e.texte[0]}</p>
            <p className="grille-eclat-pied">
              <span className="point" />
              {HUMEURS.find((h) => h.id === e.humeur)?.nom} · {e.mots} mots
              {e.epingle && <span className="epingle">◆</span>}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── D ─ ARASAKA ────────────────────────────────────────────── */
function Arasaka() {
  const [humeur, setHumeur] = useState<string | null>(null);
  const entrees = humeur ? ENTREES.filter((e) => e.humeur === humeur) : ENTREES;
  return (
    <div className="arasaka">
      <div className="arasaka-marge">
        <span className="arasaka-kana">Journal — Archive</span>
        <span className="arasaka-sceau">秘</span>
        <span className="arasaka-kana">LOG.01</span>
      </div>

      <div className="arasaka-corps">
        <div className="arasaka-tete">
          <h2>Journal</h2>
          <span className="ref">Dossier <b>35 pieces</b> — mise a jour 2026.08.20</span>
          <div className="arasaka-outils">
            <label className="arasaka-champ">
              <Search className="w-3.5 h-3.5" style={{ color: "#7A7267" }} />
              <input placeholder="RECHERCHER…" readOnly />
            </label>
            <button className="arasaka-bouton"><Plus className="w-3.5 h-3.5" />Rediger</button>
          </div>
        </div>

        <div className="arasaka-filtres">
          <button className="arasaka-filtre" aria-pressed={humeur === null} onClick={() => setHumeur(null)}>
            Toutes <b>35</b>
          </button>
          <button className="arasaka-filtre" aria-pressed={false}>Epinglees <b>4</b></button>
          {HUMEURS.map((h) => (
            <button
              key={h.id}
              className="arasaka-filtre"
              aria-pressed={humeur === h.id}
              onClick={() => setHumeur(humeur === h.id ? null : h.id)}
            >
              {h.nom} <b>{h.n}</b>
            </button>
          ))}
        </div>

        <div className="arasaka-doc">
          {entrees.map((e) => (
            <article key={e.ref} className="arasaka-entree">
              <div className="arasaka-entete">
                <div className="arasaka-cote">
                  <b>{e.date}</b>
                  {e.heure}
                  <br />REF·{e.ref}
                  <br />{e.mots} mots
                </div>
                <div>
                  <span className={cn("arasaka-bande", e.epingle && "est-rouge")}>
                    {HUMEURS.find((h) => h.id === e.humeur)?.nom}{e.epingle ? " — epinglee" : ""}
                  </span>
                  <h3>{e.titre}</h3>
                  <p>{e.texte[0]}</p>
                  <div className="arasaka-pied">
                    {e.tags.map((t) => <span key={t} className="arasaka-etiquette">/{t}</span>)}
                    <span className="arasaka-mesure">
                      Valence
                      <i><u style={{ width: `${e.valence * 10}%` }} /></i>
                      {e.valence}/10
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── E ─ BRAINDANCE ─────────────────────────────────────────── */
function Braindance() {
  const [i, setI] = useState(0);
  const e = ENTREES[i];
  const pistes = [
    { nom: "Humeur", couleur: "#FF2E5B", valeurs: ENTREES.map((x) => (x.humeur === "tension" ? 9 : x.humeur === "surge" ? 8 : 5)) },
    { nom: "Energie", couleur: "#35E6FF", valeurs: ENTREES.map((x) => Math.max(2, Math.round(x.mots / 70))) },
    { nom: "Valence", couleur: "#FFB020", valeurs: ENTREES.map((x) => x.valence) },
  ];
  return (
    <div className="bd" style={st(e.teinte)}>
      <div className="bd-piste">
        <span className="bd-piste-titre">Jours</span>
        {ENTREES.map((x, k) => (
          <button
            key={x.ref}
            className="bd-jour"
            aria-pressed={k === i}
            onClick={() => setI(k)}
            style={st(x.teinte)}
            title={x.titre}
          >
            <i /><span>{x.date.slice(5)}</span>
          </button>
        ))}
      </div>

      <div className="bd-scene">
        <div className="bd-barre">
          <b>● REC</b>
          <span>Relecture — {e.date} · {e.heure}</span>
          <span className="fil" />
          <button className="bd-bouton"><Plus className="w-3.5 h-3.5" />Enregistrer une entree</button>
        </div>

        <div className="bd-lecture">
          <h3>{e.titre}</h3>
          <p className="horo">
            <b>{HUMEURS.find((h) => h.id === e.humeur)?.nom}</b> · {e.mots} mots · valence {e.valence}/10
            {e.tags.length > 0 && <> · {e.tags.map((t) => `/${t}`).join(" ")}</>}
          </p>
          {e.texte.map((p, k) => <p key={k}>{p}</p>)}
        </div>

        <div className="bd-pistes">
          {pistes.map((p) => (
            <div key={p.nom} className="bd-rail" style={{ ["--piste" as string]: p.couleur } as React.CSSProperties}>
              <span className="bd-rail-nom">{p.nom}</span>
              <span className="bd-onde">
                {p.valeurs.map((v, k) => (
                  <i key={k} className={k === i ? "est-actif" : undefined} style={{ height: `${8 + v * 2}px` }} />
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── F ─ ATLAS ──────────────────────────────────────────────── */
// Une entree tous les ~11 jours, pour une carte credible.
const CARTE = Array.from({ length: 182 }, (_, k) => (k % 11 === 3 ? ENTREES[(k / 11 | 0) % ENTREES.length] : null));

function Atlas() {
  const [sel, setSel] = useState(3);
  const e = CARTE[sel] ?? ENTREES[0];
  return (
    <div className="atlas" style={st(e.teinte)}>
      <div className="atlas-carte">
        <div className="atlas-tete">
          <span><b>LOG.01</b> — Six derniers mois</span>
          <span className="fil" />
          <span>35 entrees · 12 400 mots</span>
          <button className="atlas-bouton"><Plus className="w-3.5 h-3.5" />Ecrire</button>
        </div>

        <div className="atlas-grille" role="group" aria-label="Carte des jours">
          {CARTE.map((x, k) => (
            <button
              key={k}
              className="atlas-cellule"
              aria-pressed={sel === k}
              aria-label={x ? `${x.date} — ${x.titre}` : "Aucune entree"}
              onClick={() => x && setSel(k)}
              style={{ ["--c" as string]: x ? x.teinte : "#101821" } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="atlas-legende">
          <span>Humeur :</span>
          {HUMEURS.map((h) => (
            <span key={h.id}><i style={{ background: h.teinte }} />{h.nom}</span>
          ))}
        </div>
      </div>

      <div className="atlas-lecteur">
        <p className="atlas-lecteur-code"><b>REF·{e.ref}</b> · {e.date} · {e.heure}</p>
        <h3>{e.titre}</h3>
        {e.texte.map((p, k) => <p key={k}>{p}</p>)}
        <div className="atlas-lecteur-pied">
          {e.tags.map((t) => <span key={t} className="atlas-etiquette">/{t}</span>)}
          <span style={{ marginLeft: "auto" }}>{e.mots} mots · valence {e.valence}/10</span>
        </div>
      </div>
    </div>
  );
}

const NOMS: Record<V, string> = {
  A: "Relais", B: "Flux", C: "Grille", D: "Arasaka", E: "Braindance", F: "Atlas",
};

const NOTES: Record<V, React.ReactNode> = {
  A: <>La <b>fiche d archive</b>. Un index a gauche, toujours visible : humeurs, epinglees, compte de chacune — on ne cherche jamais ou cliquer. A droite, des dossiers a coin coupe, un dos colore par l humeur, et une ligne de metadonnees codee : <b>REF·4A21 / 2026.08.20 / 14:32 / POUSSEE / 412 mots</b>. Le jaune ne sert qu a l action. C est la direction la plus <b>operationnelle</b> : dense, scannable, faite pour un journal qui grossit.</>,
  B: <>Le <b>terminal de conscience</b>. Pas de cartes du tout : des transmissions separees par un filet, a soixante-huit caracteres de large — la largeur ou l on lit vraiment. La barre du haut est une invite qui comprend <b>/humeur:flux</b> et <b>/epinglees</b>, et le metre d humeurs sert de filtre et de statistique en meme temps. Les actions n apparaissent qu au survol. C est la direction <b>lecture</b> : celle ou l on ecrit long et ou l on se relit.</>,
  D: <>Le <b>dossier corporate</b>, et le seul theme clair du lot. Papier casse, encre noire, un seul rouge — celui du sceau. Pas un neon. Chaque entree est une <b>piece de dossier</b> : cote a gauche (date, reference, nombre de mots), bande d humeur estampee, titre condense, texte a soixante-six caracteres. C est le cyberpunk d Arasaka plutot que celui de la rue : froid, administratif, d une lisibilite totale. Le pari est net — si vous le prenez, il faudra decider ce qu il devient en theme sombre.</>,
  E: <>La <b>piste de relecture</b>. Le journal devient un enregistrement qu on rembobine : les jours en colonne a gauche, l entree lue en grand, et surtout <b>trois pistes</b> sous le texte — humeur, energie, valence — ou chaque entree est une barre et celle qu on lit s allume. On voit sa courbe, on saute d un pic a l autre. C est la direction qui fait de la metadonnee autre chose qu une decoration.</>,
  F: <>La <b>carte des jours</b>. Ni liste ni cartes : six mois de cellules, une par jour, coloriees par l humeur — les vides comptent autant que les pleins. On clique un jour, on lit a droite. C est la direction <b>navigation</b> : celle ou l on retrouve « le truc ecrit vers la mi-juin » sans se rappeler un seul mot. Elle demande un lecteur a droite, et devient une frise verticale sur telephone.</>,
  C: <>La <b>mosaique de memoire</b>. Une frise des mois en haut, dont la hauteur dit le nombre d entrees — on navigue dans le temps d un clic. En dessous, des eclats en grille, laves du degrade de leur humeur, coin biseaute. On retrouve une entree <b>a l oeil</b> plutot qu au mot. C est la direction <b>parcours</b> : la plus belle a regarder, la moins dense a lire.</>,
};

export default function ApercuJournal() {
  const [v, setV] = useState<V>("D");
  return (
    <div className="apj min-h-screen p-6" style={{ background: "#03040A" }}>
      <div className="max-w-6xl mx-auto">
        <div className="apj-choix">
          {(["A", "B", "C", "D", "E", "F"] as V[]).map((x) => (
            <button key={x} className="apj-onglet" aria-pressed={v === x} onClick={() => setV(x)}>
              {x} — {NOMS[x]}
            </button>
          ))}
        </div>
        <p className="apj-note">{NOTES[v]}</p>
        {v === "A" && <Relais />}
        {v === "B" && <Flux />}
        {v === "C" && <Grille />}
        {v === "D" && <Arasaka />}
        {v === "E" && <Braindance />}
        {v === "F" && <Atlas />}
      </div>
    </div>
  );
}
