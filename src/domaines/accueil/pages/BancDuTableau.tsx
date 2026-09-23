import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { rosaceDuPacte } from "@/domaines/objectifs";
import { FondVivant } from "@/socle/ds/fonds/FondVivant";
import { FONDS_AU_CHOIX } from "@/socle/ds/fonds/choix";
import { PROPOSITIONS, type IdDuFond } from "@/socle/ds/fonds/catalogue";
import { useVisibleInterval } from "@/socle/hooks/useVisibleInterval";
import {
  A_VENIR, BONDS, JOURNEE, MAINTENANT, OBJECTIFS, ORDRES, PACTE, type OrdreDuJour,
} from "@/domaines/accueil/logique/scenarioDuTableau";
import { heure, lireLeTableau } from "@/domaines/accueil/logique/lectureDuTableau";
import type { DonneesDuTableau } from "@/domaines/accueil/composants/refonte/communs";
import { Registre } from "@/domaines/accueil/composants/refonte/Registre";
import { Cadran } from "@/domaines/accueil/composants/refonte/Cadran";
import { Serment } from "@/domaines/accueil/composants/refonte/Serment";
import { Dossier } from "@/domaines/accueil/composants/refonte/Dossier";
import { Reseau } from "@/domaines/accueil/composants/refonte/Reseau";
import "@/domaines/accueil/accueil.css";
import "@/domaines/accueil/banc-du-tableau.css";

/* LE BANC DU TABLEAU DE BORD.
 *
 * Trois refontes, le meme contenu. Le banc tient l etat — les ordres,
 * la journee, le solde — et le passe a la structure affichee : un
 * ordre reclame dans le registre reste reclame dans le serment. On
 * compare des compositions, pas des etats differents.
 *
 * TOUT EST FICTIF, et le pupitre le dit : un pacte « Ananta », quinze
 * objectifs, un mercredi soir. L heure du scenario avance avec la
 * vraie, a partir de 19 h 42. Rien n est lu, rien n est ecrit. */

/* DEUX SERIES. Les mondes d abord — une matiere, une typographie, une
   grammaire entiere chacun — puis les trois structures de la premiere
   serie, jugees « trop simples, trop IA » : elles changeaient la mise
   en page sans changer de monde. */
const STRUCTURES = [
  {
    id: "dossier",
    nom: "Le dossier scellé",
    these: "Le pacte est un serment : son tableau de bord est le dossier qu’on ouvre chaque jour. L’état ne se colore pas, il se tamponne.",
    risque: "Un décor d’objet peut devenir costume s’il ne sert pas l’action : tamponner doit rester le geste principal.",
  },
  {
    id: "reseau",
    nom: "Le plan du réseau",
    these: "Chaque objectif est une ligne, chaque étape une station ; tous les trains sont à quai au méridien d’aujourd’hui.",
    risque: "Un plan se lit vite mais ne dit pas l’heure : le tableau des départs la porte.",
  },
  {
    id: "registre",
    nom: "Le registre de bord",
    these: "Un seul axe de temps : ce qui est fait au-dessus, MAINTENANT au centre, ce qui vient dessous.",
    risque: "Un pacte sans échéances aura un « à venir » maigre.",
  },
  {
    id: "cadran",
    nom: "Le cadran du pacte",
    these: "Tout l’état du pacte dans un seul instrument, construit autour du sceau. Survole un objectif.",
    risque: "Se lit moins vite qu’une liste ; demande sa légende.",
  },
  {
    id: "serment",
    nom: "Le serment vivant",
    these: "Le pacte signé, relu chaque jour : des articles dont les chiffres vivent, les écarts en marge.",
    risque: "Un document se parcourt moins vite que des panneaux.",
  },
] as const;

type IdDeStructure = (typeof STRUCTURES)[number]["id"];

function motsDesOrdres(ordres: readonly OrdreDuJour[]): string {
  const prets = ordres.filter((o) => o.progres >= o.cible && !o.reclame).length;
  const enCours = ordres.filter((o) => o.progres < o.cible).length;
  const bouts = [prets && `${prets} à réclamer`, enCours && `${enCours} en cours`].filter(Boolean);
  return bouts.length ? bouts.join(", ") : "tous tenus";
}

export default function BancDuTableau() {
  const [id, setId] = useState<IdDeStructure>("dossier");
  const [fond, setFond] = useState<IdDuFond>("classique");
  const [jour, setJour] = useState(false);
  const [pupitre, setPupitre] = useState(true);
  const [ordres, setOrdres] = useState(ORDRES);
  const [journee, setJournee] = useState(JOURNEE);
  const [bonds, setBonds] = useState(BONDS);

  /* L heure du scenario : 19 h 42, plus le temps passe sur la page. */
  const [ouverture] = useState(() => Date.now());
  const [, battre] = useState(0);
  useVisibleInterval(() => battre((n) => n + 1), 15_000);
  const maintenant = new Date(MAINTENANT.getTime() + (Date.now() - ouverture));
  const minute = Math.floor(maintenant.getTime() / 60_000);

  const lecture = useMemo(() => lireLeTableau(OBJECTIFS, PACTE, new Date(minute * 60_000)), [minute]);
  const sceau = useMemo(() => rosaceDuPacte(PACTE.nom, PACTE.valeurs, PACTE.version), []);

  const reclamer = useCallback((cle: string) => {
    const o = ordres.find((x) => x.id === cle);
    if (!o || o.reclame || o.progres < o.cible) return;
    setOrdres((os) => os.map((x) => (x.id === cle ? { ...x, reclame: true } : x)));
    setJournee((j) => [...j, {
      heure: heure(new Date(MAINTENANT.getTime() + (Date.now() - ouverture))), genre: "ordre", titre: `Ordre tenu : ${o.titre.toLowerCase()}`,
      detail: `+${o.prime} bonds`, ordre: o.id,
    }]);
    setBonds((b) => b + o.prime);
  }, [ordres, ouverture]);

  /* La bascule du theme agit sur la racine, comme le vrai selecteur. */
  useEffect(() => {
    const racine = document.documentElement;
    const avant = { clair: racine.classList.contains("light"), sombre: racine.classList.contains("dark") };
    racine.classList.toggle("light", jour);
    racine.classList.toggle("dark", !jour);
    return () => {
      racine.classList.toggle("light", avant.clair);
      racine.classList.toggle("dark", avant.sombre);
    };
  }, [jour]);

  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      if (cible instanceof HTMLInputElement && cible.type !== "checkbox") return;
      if (cible && ["SELECT", "TEXTAREA"].includes(cible.tagName)) return;
      const i = STRUCTURES.findIndex((s) => s.id === id);
      if (e.key === "ArrowRight") setId(STRUCTURES[(i + 1) % STRUCTURES.length].id);
      else if (e.key === "ArrowLeft") setId(STRUCTURES[(i + STRUCTURES.length - 1) % STRUCTURES.length].id);
      else if (e.key === "h" || e.key === "H") setPupitre((v) => !v);
    };
    window.addEventListener("keydown", auClavier);
    return () => window.removeEventListener("keydown", auClavier);
  }, [id]);

  const donnees: DonneesDuTableau = {
    maintenant,
    lecture,
    objectifs: OBJECTIFS,
    ordres,
    journee,
    aVenir: A_VENIR.map((e) => (e.genre === "ordres" ? { ...e, detail: motsDesOrdres(ordres) } : e)),
    bonds,
    reclamer,
  };
  const structure = STRUCTURES.find((s) => s.id === id) ?? STRUCTURES[0];
  const fonds = PROPOSITIONS.filter((p) => FONDS_AU_CHOIX.includes(p.id));

  return (
    <div className="bt" style={{ "--teinte": PACTE.teinte } as CSSProperties}>
      <div key={fond}>
        {/* Les fonds vivants sont faits pour la nuit : en clair, le banc
            montre le ciel classique, comme le tableau de bord le fera. */}
        <FondVivant id={jour ? "classique" : fond} teinte={PACTE.teinte} sceau={sceau}
          progression={lecture.objectifs.pct / 100} />
      </div>

      <div key={id} className="bt-scene">
        {id === "dossier" && <Dossier {...donnees} />}
        {id === "reseau" && <Reseau {...donnees} />}
        {id === "registre" && <Registre {...donnees} />}
        {id === "cadran" && <Cadran {...donnees} />}
        {id === "serment" && <Serment {...donnees} />}
      </div>

      {pupitre ? (
        <aside className="bt-pupitre" aria-label="Pupitre du banc du tableau de bord">
          <nav className="bt-choix" aria-label="Structures">
            {STRUCTURES.map((s, i) => (
              <button key={s.id} type="button" aria-pressed={s.id === id} onClick={() => setId(s.id)}
                data-serie={i < 2 ? "mondes" : "structures"}>
                {s.nom}
              </button>
            ))}
          </nav>
          <p className="bt-these">{structure.these} <span>Risque : {structure.risque}</span></p>
          <div className="bt-reglages">
            <label className="bt-fond">
              <span>Fond</span>
              <select value={fond} onChange={(e) => setFond(e.target.value as IdDuFond)}>
                {fonds.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </label>
            <label className="bt-bascule">
              <input type="checkbox" checked={jour} onChange={(e) => setJour(e.target.checked)} /> Thème clair
            </label>
            <p className="bt-fictif">Scénario fictif · pacte « {PACTE.nom} », 15 objectifs</p>
            <p className="bt-raccourcis"><kbd>←</kbd> <kbd>→</kbd> changer · <kbd>H</kbd> masquer</p>
          </div>
        </aside>
      ) : (
        <button type="button" className="bt-rappel" onClick={() => setPupitre(true)}>
          Pupitre <kbd>H</kbd>
        </button>
      )}
    </div>
  );
}
