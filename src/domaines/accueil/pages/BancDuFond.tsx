import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Enseigne } from "@/domaines/accueil/composants/bandeau/Enseigne";
import { rosaceDuPacte } from "@/domaines/objectifs";
import { PROPOSITIONS, TEINTES_DU_PACTE, voisine, type IdDuFond } from "@/socle/ds/fonds/catalogue";
import type { MesureDuRendu } from "@/socle/ds/fonds/useRenduDuFond";
import { FondVivant } from "@/socle/ds/fonds/FondVivant";
import { PanneauxSimules } from "@/domaines/accueil/composants/PanneauxSimules";
import "@/domaines/accueil/accueil.css";
import "@/domaines/accueil/banc-du-fond.css";

/* LE BANC DES FONDS.
 *
 * Un fond ne se juge pas seul : il se juge derriere ce qu il porte.
 * Chaque proposition passe donc ici en plein ecran, sous le VRAI
 * bandeau du tableau de bord et sous des panneaux aux memes couleurs
 * et aux memes dimensions que ceux de l accueil — opaques, comme eux,
 * pour qu on voie ce qui reste reellement visible du fond.
 *
 * La page defile sur deux ecrans et demi : c est la seule facon de
 * juger une parallaxe, et de lancer la Derive.
 *
 * IL NE LIT NI N ECRIT RIEN. Le pacte est celui du banc du bandeau :
 * « Ananta », trois valeurs. Son sceau vient du vrai `rosaceDuPacte`.
 */

const NOMS_DES_TEINTES: Record<string, string> = {
  amber: "Ambre", rose: "Rose", emerald: "Émeraude", sky: "Ciel", violet: "Violet", cyan: "Cyan",
};

const VALEURS = ["Liberté", "Discipline", "Création"];

function lireLaCarte(nom: string | null): string {
  if (!nom) return "—";
  return nom.replace(/\s*\(0x[0-9a-f]+\)/i, "").replace(/Direct3D.*$/i, "").replace(/,\s*$/, "").trim();
}

export default function BancDuFond() {
  const [id, setId] = useState<IdDuFond>("nebuleuse");
  const [nomDeTeinte, setNomDeTeinte] = useState("violet");
  const [intensite, setIntensite] = useState(0.7);
  const [progression, setProgression] = useState(0.57);
  const [mouvement, setMouvement] = useState(true);
  const [superposition, setSuperposition] = useState(true);
  const [jour, setJour] = useState(false);
  const [pupitre, setPupitre] = useState(true);
  const [mesure, setMesure] = useState<MesureDuRendu | null>(null);
  const [carte, setCarte] = useState<string | null>(null);

  const proposition = PROPOSITIONS.find((p) => p.id === id) ?? PROPOSITIONS[0];
  const teinte = TEINTES_DU_PACTE[nomDeTeinte];

  const sceau = useMemo(() => rosaceDuPacte("Ananta", VALEURS, 4), []);

  /* La bascule agit sur la racine, comme le vrai selecteur de theme. */
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
      /* Un curseur prend les fleches pour lui ; une case a cocher, non —
         apres un clic sur « Mouvement », H doit encore masquer le pupitre. */
      const cible = e.target as HTMLElement | null;
      if (cible instanceof HTMLInputElement && cible.type !== "checkbox") return;
      if (cible && ["SELECT", "TEXTAREA"].includes(cible.tagName)) return;
      if (e.key === "ArrowRight") setId((x) => voisine(x, 1));
      else if (e.key === "ArrowLeft") setId((x) => voisine(x, -1));
      else if (e.key === "h" || e.key === "H") setPupitre((v) => !v);
    };
    window.addEventListener("keydown", auClavier);
    return () => window.removeEventListener("keydown", auClavier);
  }, []);

  useEffect(() => {
    setMesure(null);
    setCarte(null);
  }, [id]);

  const cadence = id === "classique"
    ? "CSS"
    : mesure === null ? "…" : mesure.fps === 0 ? "image fixe" : `${Math.round(mesure.fps)} i/s`;

  return (
    <div className="banc-fond" style={{ "--banc-teinte": teinte } as CSSProperties}>
      {/* Une cle par proposition : chacune ouvre son contexte graphique,
          et le rend en partant. */}
      <div key={id}>
        <FondVivant
          id={id}
          teinte={teinte}
          intensite={intensite}
          mouvement={mouvement}
          sceau={sceau}
          progression={progression}
          jour={jour}
          surMesure={setMesure}
          surCarte={setCarte}
        />
      </div>
      <div className="banc-fond-balayage" aria-hidden="true" />

      {superposition && (
        <main className="banc-fond-scene">
          {/* Le vrai bandeau est l enseigne depuis le 23/09 : un fond
              se juge derriere elle, et derriere son mur opaque. */}
          <Enseigne
            teinte={nomDeTeinte}
            progression={Math.round(progression * 100)}
            level={12}
            totalMissions={47}
            activeDays={91}
            pactName="Ananta"
            pactMantra="Tenir ce qui est juré"
            pactSymbol="flame"
            valeurs={VALEURS}
            sigilVersion={4}
            titleFont="orbitron"
            titleEffect="none"
            enCours={2}
            rankName="Architecte"
            rankProgress={64}
            rankXP={3200}
            rankXPTarget={5000}
            nextRankName="Bâtisseur"
          />
          <PanneauxSimules />
        </main>
      )}

      {pupitre ? (
        <aside className="banc-fond-pupitre" aria-label="Pupitre du banc des fonds">
          <div className="bfp-tete">
            <div className="bfp-titre">
              <h1>{proposition.nom}</h1>
              <p className="bfp-idee">{proposition.idee}</p>
              <p className="bfp-pourquoi">{proposition.pourquoi}</p>
            </div>
            <dl className="bfp-mesure">
              <div><dt>Cadence</dt><dd>{cadence}</dd></div>
              <div>
                <dt>Processeur</dt>
                <dd>{id === "classique" || !mesure ? "—" : `${mesure.ms.toFixed(2)} ms/image`}</dd>
              </div>
              <div>
                <dt>Tampon</dt>
                <dd>{id === "classique" || !mesure ? "—" : `${mesure.largeur} × ${mesure.hauteur}`}</dd>
              </div>
              <div><dt>Carte</dt><dd title={carte ?? undefined}>{lireLaCarte(carte)}</dd></div>
            </dl>
          </div>

          <p className="bfp-technique">{proposition.technique}</p>

          <nav className="bfp-choix" aria-label="Propositions">
            {PROPOSITIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={p.id === id}
                onClick={() => setId(p.id)}
              >
                {p.nom}
                {p.jour && <span className="bfp-jour" title="Tient aussi en thème clair">jour</span>}
              </button>
            ))}
          </nav>

          <div className="bfp-reglages">
            <fieldset className="bfp-teintes">
              <legend>Teinte du pacte</legend>
              {Object.entries(TEINTES_DU_PACTE).map(([nom, hex]) => (
                <button
                  key={nom}
                  type="button"
                  aria-pressed={nom === nomDeTeinte}
                  aria-label={NOMS_DES_TEINTES[nom]}
                  title={NOMS_DES_TEINTES[nom]}
                  style={{ "--pastille": hex } as CSSProperties}
                  onClick={() => setNomDeTeinte(nom)}
                />
              ))}
            </fieldset>

            <label className="bfp-curseur">
              <span>Intensité</span>
              <input type="range" min={0} max={1} step={0.01} value={intensite}
                onChange={(e) => setIntensite(Number(e.target.value))} />
              <output>{Math.round(intensite * 100)} %</output>
            </label>

            <label className="bfp-curseur">
              <span>Objectifs accomplis</span>
              <input type="range" min={0} max={1} step={0.01} value={progression}
                onChange={(e) => setProgression(Number(e.target.value))} />
              <output>{Math.round(progression * 100)} %</output>
            </label>

            <div className="bfp-bascules">
              <label><input type="checkbox" checked={mouvement} onChange={(e) => setMouvement(e.target.checked)} /> Mouvement</label>
              <label><input type="checkbox" checked={superposition} onChange={(e) => setSuperposition(e.target.checked)} /> Tableau de bord</label>
              <label><input type="checkbox" checked={jour} onChange={(e) => setJour(e.target.checked)} /> Thème clair</label>
            </div>

            <p className="bfp-raccourcis">
              <kbd>←</kbd> <kbd>→</kbd> changer · <kbd>H</kbd> masquer le pupitre
            </p>
          </div>
        </aside>
      ) : (
        <button type="button" className="banc-fond-rappel" onClick={() => setPupitre(true)}>
          Pupitre <kbd>H</kbd>
        </button>
      )}
    </div>
  );
}
