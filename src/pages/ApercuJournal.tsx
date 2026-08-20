import { useState } from "react";
import { Search, Plus, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import "@/styles/apercu-journal.css";

/* MAQUETTE JETABLE — trois themes pour le journal.
   Le meme contenu, rendu trois fois, avec la vraie typographie et les
   vraies interactions de filtre. */

type V = "A" | "B" | "C";

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

const NOTES: Record<V, React.ReactNode> = {
  A: <>La <b>fiche d archive</b>. Un index a gauche, toujours visible : humeurs, epinglees, compte de chacune — on ne cherche jamais ou cliquer. A droite, des dossiers a coin coupe, un dos colore par l humeur, et une ligne de metadonnees codee : <b>REF·4A21 / 2026.08.20 / 14:32 / POUSSEE / 412 mots</b>. Le jaune ne sert qu a l action. C est la direction la plus <b>operationnelle</b> : dense, scannable, faite pour un journal qui grossit.</>,
  B: <>Le <b>terminal de conscience</b>. Pas de cartes du tout : des transmissions separees par un filet, a soixante-huit caracteres de large — la largeur ou l on lit vraiment. La barre du haut est une invite qui comprend <b>/humeur:flux</b> et <b>/epinglees</b>, et le metre d humeurs sert de filtre et de statistique en meme temps. Les actions n apparaissent qu au survol. C est la direction <b>lecture</b> : celle ou l on ecrit long et ou l on se relit.</>,
  C: <>La <b>mosaique de memoire</b>. Une frise des mois en haut, dont la hauteur dit le nombre d entrees — on navigue dans le temps d un clic. En dessous, des eclats en grille, laves du degrade de leur humeur, coin biseaute. On retrouve une entree <b>a l oeil</b> plutot qu au mot. C est la direction <b>parcours</b> : la plus belle a regarder, la moins dense a lire.</>,
};

export default function ApercuJournal() {
  const [v, setV] = useState<V>("A");
  return (
    <div className="apj min-h-screen p-6" style={{ background: "#03040A" }}>
      <div className="max-w-6xl mx-auto">
        <div className="apj-choix">
          {(["A", "B", "C"] as V[]).map((x) => (
            <button key={x} className="apj-onglet" aria-pressed={v === x} onClick={() => setV(x)}>
              {x} — {x === "A" ? "Relais" : x === "B" ? "Flux" : "Grille"}
            </button>
          ))}
        </div>
        <p className="apj-note">{NOTES[v]}</p>
        {v === "A" && <Relais />}
        {v === "B" && <Flux />}
        {v === "C" && <Grille />}
      </div>
    </div>
  );
}
