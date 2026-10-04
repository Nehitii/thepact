import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CoeurStellaire, type EvenementMain, type OptionsCoeur } from "@/domaines/appel/composants/CoeurStellaire";
import { jourLocal, type DonneesDeLAppel, type PacteAppel } from "@/domaines/appel/hooks/useTheCall";
import { DUREE, avancementDuRituel, palierDe } from "@/domaines/appel/logique/rituel";
import {
  APRES_ECRITURE, AVANT_ECRITURE, DUREE_SORTIE, PENDANT_L_ECRITURE, enSequence, retourDe,
  ruptureAuRelachement, type Phase,
} from "@/domaines/appel/logique/sequence";
import TheCall from "@/domaines/appel/pages/TheCall";

/* LE BANC DE L APPEL — public, pour la raison des autres bancs.
 *
 * The Call est derriere la session, la double authentification et un
 * appel par jour : le regarder deux fois demandait d attendre le
 * lendemain. Ce banc monte LA VRAIE TOILE — `CoeurStellaire`, sans une
 * ligne de plus — autour d une prise qu on tient comme dans la page.
 *
 * IL N ECRIT RIEN. Le temps mort y dure son silence minimal, puisqu il
 * n y a pas de requete a couvrir.
 *
 * Au clavier : espace ou entree sur la prise pour tenir, H pour masquer
 * le pupitre. La lecture automatique tient a la place du doigt.
 *
 * `?vue=page` monte la PAGE ENTIERE — `TheCall`, ses rails, sa
 * revelation — sur une donnee feinte, a cote d une barre laterale.
 */

type Ecriture = "reussit" | "echoue" | "lente";

/* LA PAGE ENTIERE, A COTE D UNE BARRE LATERALE FEINTE. La vraie page, et
   une ecriture qui reussit, echoue ou traine a volonte — et qui passe le
   pacte a « fait » des qu elle reussit, comme la vraie. La barre est la
   parce que c est elle qui a decale la revelation : un ecran pose sur la
   fenetre, et non sur la page. */
function BancDeLaPage({ surToile }: { surToile: () => void }) {
  const [ecriture, setEcriture] = useState<Ecriture>("reussit");
  const [erreur, setErreur] = useState<Error | null>(null);
  const [pacte, setPacte] = useState<PacteAppel>({ id: "banc", total: 41, serie: 6, dernierJour: null });
  const [cle, setCle] = useState(0);
  const ecritureRef = useRef(ecriture);
  useEffect(() => { ecritureRef.current = ecriture; }, [ecriture]);

  const donnees = useMemo<DonneesDeLAppel>(() => ({
    pacte,
    chargement: false,
    erreurLecture: null,
    pret: true,
    dejaFait: pacte.dernierJour === jourLocal(),
    enregistrer: async () => {
      await new Promise((r) => setTimeout(r, ecritureRef.current === "lente" ? 3000 : 250));
      if (ecritureRef.current === "echoue") { const e = new Error("banc"); setErreur(e); throw e; }
      const suivant = { ...pacte, total: pacte.total + 1, serie: pacte.serie + 1, dernierJour: jourLocal() };
      setPacte(suivant);
      return suivant;
    },
    enregistrementEnCours: false,
    erreurEcriture: erreur,
    reinitialiserErreur: () => setErreur(null),
    relire: (() => Promise.resolve()) as unknown as DonneesDeLAppel["relire"],
  }), [pacte, erreur]);

  /* Tenir, sans doigt : le meme evenement que le pointeur, sur la prise. */
  const tenir = () => document.querySelector(".rit-prise")
    ?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 1, isPrimary: true }));

  return (
    <div className="fixed inset-0 flex bg-background text-foreground">
      <aside className="w-[240px] shrink-0 border-r border-border/40 p-4 text-xs text-muted-foreground">Barre latérale feinte</aside>
      <div className="relative flex-1 min-w-0">
        <TheCall key={cle} donnees={donnees} />
      </div>
      <aside className="banc-appel-pupitre banc-appel-droite" aria-label="Pupitre de la page">
        <div className="banc-appel-rangee">
          <button type="button" onClick={surToile}>Toile</button>
          <button type="button" onClick={tenir}>Tenir</button>
          <button type="button" onClick={() => { setPacte((x) => ({ ...x, dernierJour: null })); setErreur(null); setCle((k) => k + 1); }}>Neuf</button>
        </div>
        <div className="banc-appel-rangee">
          {(["reussit", "echoue", "lente"] as Ecriture[]).map((e) => (
            <button key={e} type="button" aria-pressed={ecriture === e} onClick={() => setEcriture(e)}>
              {{ reussit: "Écrit", echoue: "Échoue", lente: "Lente (3 s)" }[e]}
            </button>
          ))}
        </div>
      </aside>
      <style>{STYLE_DU_BANC}</style>
    </div>
  );
}

const SAUTS = [
  { p: 0.3, nom: "II · Alignement" },
  { p: 0.55, nom: "III · Scission" },
  { p: 0.8, nom: "IV · Décentrage" },
  { p: 0.93, nom: "V · Critique" },
];

export default function BancDeLAppel() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("attente");
  const [sortie, setSortie] = useState(false);
  const [vitesse, setVitesse] = useState(1);
  const [immobile, setImmobile] = useState(false);
  const [jour, setJour] = useState(false);
  const [pupitre, setPupitre] = useState(true);
  const [vue, setVue] = useState<"toile" | "page">(
    () => (new URLSearchParams(window.location.search).get("vue") === "page" ? "page" : "toile"),
  );

  const progres = useRef(0);
  const cible = useRef<HTMLButtonElement>(null);
  const evenements = useRef<EvenementMain[]>([]);
  const phaseRef = useRef<Phase>("attente");
  const tient = useRef(false);
  const depart = useRef(0);
  const vitesseRef = useRef(1);
  const minuteries = useRef<number[]>([]);
  const lecture = useRef<HTMLSpanElement>(null);

  const options = useMemo<OptionsCoeur>(() => ({ recit: true, matiere: true, gravite: true, main: true, apres: true }), []);
  const sequence = enSequence(phase);

  const poser = useCallback((ph: Phase) => {
    if (phaseRef.current === ph) return;
    phaseRef.current = ph;
    setPhase(ph);
  }, []);

  const oublierLesMinuteries = () => {
    for (const m of minuteries.current) clearTimeout(m);
    minuteries.current = [];
  };

  /* La conclusion de la page, sans la requete : le premier temps est
     pose tout de suite, sinon la boucle verrait une prise lachee a un et
     la ferait redescendre. */
  const conclure = useCallback(() => {
    tient.current = false;
    progres.current = 1;
    oublierLesMinuteries();
    let attente = 0;
    [...AVANT_ECRITURE, PENDANT_L_ECRITURE, APRES_ECRITURE].forEach((etape, i) => {
      if (i === 0) poser(etape.phase);
      else minuteries.current.push(window.setTimeout(() => poser(etape.phase), attente));
      attente += etape.attente;
    });
  }, [poser]);

  useEffect(() => { vitesseRef.current = vitesse; }, [vitesse]);

  /* LA BOUCLE DE LA PAGE : la montee au temps, la descente a l image —
     exactement comme dans `TheCall`. */
  useEffect(() => {
    let id = 0;
    const boucle = () => {
      const ph = phaseRef.current;
      if (!enSequence(ph) && ph !== "verrouille") {
        if (tient.current) {
          const p = avancementDuRituel(performance.now(), depart.current, vitesseRef.current);
          progres.current = p;
          if (p >= 1) conclure(); else poser(palierDe(p));
        } else if (progres.current > 0) {
          progres.current = retourDe(progres.current);
          poser(palierDe(progres.current));
        }
      }
      if (lecture.current) lecture.current.textContent = `${progres.current.toFixed(3)} · ${phaseRef.current}`;
      id = requestAnimationFrame(boucle);
    };
    id = requestAnimationFrame(boucle);
    return () => { cancelAnimationFrame(id); oublierLesMinuteries(); };
  }, [conclure, poser]);

  const prendre = useCallback((depuis = progres.current) => {
    const ph = phaseRef.current;
    if (enSequence(ph) || ph === "verrouille") return;
    progres.current = depuis;
    depart.current = performance.now() - (depuis * DUREE) / vitesseRef.current;
    tient.current = true;
    evenements.current.push("appui");
  }, []);

  const lacher = useCallback(() => {
    if (!tient.current) return;
    tient.current = false;
    if (ruptureAuRelachement(progres.current)) evenements.current.push("rupture");
  }, []);

  const remettreAZero = useCallback(() => {
    oublierLesMinuteries();
    tient.current = false;
    progres.current = 0;
    setSortie(false);
    poser("attente");
  }, [poser]);

  /* La lecture automatique tient a la place du doigt — depuis la ou on
     en est, ou depuis un acte. Apres une conclusion, elle repart de zero. */
  const lire = useCallback((depuis?: number) => {
    if (enSequence(phaseRef.current) || phaseRef.current === "verrouille") remettreAZero();
    prendre(depuis ?? progres.current);
  }, [prendre, remettreAZero]);

  /* On quitte la revelation pour l astre d apres, en croisant les deux. */
  const quitter = useCallback(() => {
    if (sortie || phaseRef.current !== "projection") return;
    setSortie(true);
    progres.current = 0;
    poser("verrouille");
    minuteries.current.push(window.setTimeout(() => setSortie(false), DUREE_SORTIE));
  }, [sortie, poser]);

  /* Le banc force la nuit, comme le banc des fonds : c est le theme ou le
     reacteur est ne. La bascule « Clair » montre son jumeau d encre. */
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
      if (e.key === "h" || e.key === "H") setPupitre((v) => !v);
    };
    window.addEventListener("keydown", auClavier);
    return () => window.removeEventListener("keydown", auClavier);
  }, []);

  /* La prise a la taille de celle de la page : c est elle que la toile
     lit pour se centrer. */
  const cote = "min(62vmin, 300px)";

  if (vue === "page") return <BancDeLaPage surToile={() => setVue("toile")} />;

  return (
    <div className="fixed inset-0 overflow-hidden bg-background text-foreground select-none" data-phase={phase}>
      <CoeurStellaire
        progres={progres}
        phase={phase}
        immobile={immobile}
        cible={cible}
        options={options}
        evenements={evenements}
      />

      <button
        ref={cible}
        type="button"
        aria-label="Tenir la prise"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full touch-none"
        style={{ width: cote, height: cote, opacity: sequence ? 0 : 1, transition: "opacity 300ms", pointerEvents: sequence ? "none" : "auto" }}
        onPointerDown={(e) => {
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointeur synthetique */ }
          prendre();
        }}
        onPointerUp={lacher}
        onPointerCancel={lacher}
        onLostPointerCapture={lacher}
        onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); prendre(); } }}
        onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); lacher(); } }}
      />

      {(phase === "projection" || sortie) && (
        <div className="fixed inset-0 z-30 flex items-center justify-center cursor-pointer" onClick={quitter}>
          <div className={"banc-appel-revelation" + (sortie ? " est-sortie" : "")}>
            <p className="banc-appel-connecte">{t("thecall.connected")}</p>
            <p className="banc-appel-sous">{t("thecall.synchronized")}</p>
            <button type="button" className="banc-appel-suite" onClick={(e) => { e.stopPropagation(); quitter(); }}>
              {t("thecall.backToConsole")}
            </button>
          </div>
        </div>
      )}

      {pupitre && (
        <aside className="banc-appel-pupitre" aria-label="Pupitre du banc de l appel">
          <span ref={lecture} className="banc-appel-lecture" />
          <div className="banc-appel-rangee">
            <button type="button" onClick={() => lire()}>Lecture</button>
            <button type="button" onClick={conclure} disabled={sequence}>Conclure</button>
            <button type="button" onClick={remettreAZero}>Zéro</button>
            <button type="button" onClick={() => { remettreAZero(); setVue("page"); }}>Page</button>
          </div>
          <div className="banc-appel-rangee">
            {SAUTS.map((s) => (
              <button key={s.p} type="button" onClick={() => lire(s.p)}>{s.nom}</button>
            ))}
          </div>
          <div className="banc-appel-rangee">
            {[1, 4].map((v) => (
              <button key={v} type="button" aria-pressed={vitesse === v} onClick={() => setVitesse(v)}>×{v}</button>
            ))}
            <label><input type="checkbox" checked={immobile} onChange={(e) => setImmobile(e.target.checked)} /> Mouvement réduit</label>
            <label><input type="checkbox" checked={jour} onChange={(e) => setJour(e.target.checked)} /> Clair</label>
          </div>
        </aside>
      )}

      <style>{STYLE_DU_BANC}</style>
    </div>
  );
}

/* Les styles du banc, partages par la toile et par la page. */
const STYLE_DU_BANC = `
  .banc-appel-pupitre {
    position: absolute; left: 14px; top: 14px; z-index: 40;
    display: flex; flex-direction: column; gap: 8px; padding: 12px 14px;
    font: 500 11px/1.4 "JetBrains Mono", ui-monospace, monospace; letter-spacing: 0.06em;
    color: hsl(var(--ds-text-secondary)); background: hsl(var(--ds-surface-1) / 0.72);
    border: 1px solid hsl(var(--ds-border-default) / 0.3); border-radius: 8px;
  }
  .banc-appel-lecture { color: hsl(var(--ds-text-primary)); font-variant-numeric: tabular-nums; }
  .banc-appel-rangee { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  .banc-appel-rangee button {
    padding: 4px 9px; border-radius: 6px; color: inherit;
    border: 1px solid hsl(var(--ds-border-default) / 0.35); background: hsl(var(--ds-surface-2) / 0.6);
  }
  .banc-appel-rangee button[aria-pressed="true"] { border-color: hsl(var(--ds-accent-primary)); }
  .banc-appel-rangee button:disabled { opacity: 0.4; }
  .banc-appel-rangee label { display: inline-flex; align-items: center; gap: 5px; }
  .banc-appel-revelation {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    animation: banc-appel-revele 2.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .banc-appel-revelation.est-sortie { animation: banc-appel-eteint 620ms cubic-bezier(0.4, 0, 0.2, 1) forwards; pointer-events: none; }
  @keyframes banc-appel-revele {
    0% { opacity: 0; transform: translateY(8%) scale(1.12); filter: blur(24px); }
    100% { opacity: 1; transform: none; filter: blur(0); }
  }
  @keyframes banc-appel-eteint {
    0% { opacity: 1; transform: none; filter: blur(0); }
    100% { opacity: 0; transform: translateY(-2%) scale(1.04); filter: blur(12px); }
  }
  .banc-appel-connecte {
    margin: 0; font-family: "Orbitron", sans-serif; font-weight: 900;
    font-size: clamp(38px, 11vw, 104px); line-height: 0.92; text-transform: uppercase; color: #fff;
    text-shadow: 0 0 60px rgba(255,255,255,0.85), 0 0 140px hsl(var(--ds-accent-primary) / 0.6);
  }
  .banc-appel-sous {
    margin: 22px 0 0; font: 10px "JetBrains Mono", monospace; letter-spacing: 0.5em;
    text-transform: uppercase; color: hsl(var(--ds-accent-primary) / 0.8);
  }
  .banc-appel-suite {
    margin-top: 34px; padding: 10px 22px; color: #fff; font: 10px "JetBrains Mono", monospace;
    letter-spacing: 0.18em; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.18);
  }
  .banc-appel-droite { left: auto; right: 14px; }
`;
