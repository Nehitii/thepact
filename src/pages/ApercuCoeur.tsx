import { useCallback, useRef, useState } from "react";
import { RefreshCw, Play, FastForward, Hand, Unlink, Zap } from "lucide-react";
import { CoeurStellaire, type OptionsCoeur, type PhaseCoeur, type EvenementMain } from "@/components/thecall/CoeurStellaire";
import { cn } from "@/lib/utils";

/* BANC DES SIX PROPOSITIONS — a supprimer apres le choix.
   Chaque option s allume et s eteint a chaud, et le curseur permet de
   se poser sur n importe quel instant des vingt secondes. */

const DUREE = 20000;

const PROPOSITIONS: { cle: keyof OptionsCoeur; lettre: string; nom: string; quoi: string }[] = [
  { cle: "recit", lettre: "A", nom: "Le recit", quoi: "Quatre seuils : amorcage, fusion, instabilite, non-retour" },
  { cle: "matiere", lettre: "B", nom: "La matiere", quoi: "Arcs electriques, debris happes, aurore tournante" },
  { cle: "gravite", lettre: "C", nom: "La gravite", quoi: "La grille se courbe vers le coeur" },
  { cle: "main", lettre: "D", nom: "La main", quoi: "Contraction a l appui, dispersion a la rupture" },
  { cle: "final", lettre: "E", nom: "Le final", quoi: "Ondes aspirees, blanc total, souffle deformant" },
  { cle: "apres", lettre: "F", nom: "L apres", quoi: "Un astre calme reste apres le rituel" },
];

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ApercuCoeur() {
  const progres = useRef(0);
  const evenements = useRef<EvenementMain[]>([]);
  const cibleRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const departRef = useRef(0);
  const vitesseRef = useRef(1);

  const [phase, setPhase] = useState<PhaseCoeur>("attente");
  const [affiche, setAffiche] = useState(0);
  const [options, setOptions] = useState<OptionsCoeur>({
    recit: true, matiere: true, gravite: true, main: true, final: true, apres: true,
  });

  const basculer = (cle: keyof OptionsCoeur) =>
    setOptions((o) => ({ ...o, [cle]: !o[cle] }));

  const finale = useCallback(async () => {
    setPhase("implosion"); await attendre(500);
    setPhase("singularite"); await attendre(200);
    setPhase("explosion"); await attendre(700);
    setPhase("revelation"); await attendre(1800);
    progres.current = 0; setAffiche(0);
    setPhase("verrouille");
  }, []);

  const arreterBoucle = () => cancelAnimationFrame(rafRef.current);

  const boucle = useCallback(() => {
    const p = Math.min(1, ((performance.now() - departRef.current) * vitesseRef.current) / DUREE);
    progres.current = p;
    setAffiche(p);
    if (p >= 1) { finale(); return; }
    rafRef.current = requestAnimationFrame(boucle);
  }, [finale]);

  const jouer = (vitesse: number) => {
    arreterBoucle();
    progres.current = 0; setAffiche(0);
    setPhase("montee");
    vitesseRef.current = vitesse;
    departRef.current = performance.now();
    evenements.current.push("appui");
    rafRef.current = requestAnimationFrame(boucle);
  };

  const reinitialiser = () => {
    arreterBoucle();
    progres.current = 0; setAffiche(0);
    setPhase("attente");
  };

  const poser = (v: number) => {
    arreterBoucle();
    progres.current = v; setAffiche(v);
    if (phase !== "montee") setPhase("montee");
  };

  return (
    <div className="apr min-h-[100dvh] bg-[hsl(var(--ds-bg-base))] text-[hsl(var(--ds-text-primary))] flex flex-col">
      {/* La scene */}
      <div className="relative flex-1 min-h-[62vh] overflow-hidden">
        <CoeurStellaire
          progres={progres}
          phase={phase}
          immobile={false}
          cible={cibleRef}
          options={options}
          evenements={evenements}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            ref={cibleRef}
            className="w-[min(52vmin,280px)] h-[min(52vmin,280px)] rounded-full flex items-center justify-center"
          >
            <span className="font-mono font-bold text-4xl tabular-nums text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.95)]">
              {phase === "verrouille" ? "—" : `${(20 - affiche * 20).toFixed(1)}s`}
            </span>
          </div>
        </div>
      </div>

      {/* Le pupitre */}
      <div className="relative z-10 border-t border-[hsl(var(--ds-border-default)/0.2)] bg-[hsl(var(--ds-surface-1)/0.9)] backdrop-blur px-5 py-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={reinitialiser} className="apr-outil">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />Reinitialiser
          </button>
          <button type="button" onClick={() => jouer(1)} className="apr-outil est-primaire">
            <Play className="w-3.5 h-3.5" aria-hidden="true" />Jouer 20 s
          </button>
          <button type="button" onClick={() => jouer(4)} className="apr-outil">
            <FastForward className="w-3.5 h-3.5" aria-hidden="true" />x4
          </button>
          <button type="button" onClick={() => { arreterBoucle(); finale(); }} className="apr-outil">
            <Zap className="w-3.5 h-3.5" aria-hidden="true" />Le final
          </button>
          <span className="w-px h-6 bg-[hsl(var(--ds-border-default)/0.25)]" />
          <button type="button" onClick={() => evenements.current.push("appui")} className="apr-outil">
            <Hand className="w-3.5 h-3.5" aria-hidden="true" />Appui (D)
          </button>
          <button type="button" onClick={() => evenements.current.push("rupture")} className="apr-outil">
            <Unlink className="w-3.5 h-3.5" aria-hidden="true" />Rupture (D)
          </button>
          <span className="ml-auto font-mono text-[11px] tracking-[0.2em] uppercase text-[hsl(var(--ds-text-muted))]">
            {phase} · {Math.round(affiche * 100)}%
          </span>
        </div>

        <label className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[hsl(var(--ds-text-muted))] shrink-0">
            Curseur
          </span>
          <input
            type="range" min={0} max={1} step={0.005}
            value={affiche}
            onChange={(e) => poser(Number(e.target.value))}
            className="w-full accent-[hsl(var(--ds-accent-primary))]"
          />
        </label>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PROPOSITIONS.map(({ cle, lettre, nom, quoi }) => (
            <button
              key={cle}
              type="button"
              aria-pressed={!!options[cle]}
              onClick={() => basculer(cle)}
              className={cn("apr-prop", options[cle] && "est-actif")}
            >
              <b>{lettre}</b>
              <span>
                <strong>{nom}</strong>
                <small>{quoi}</small>
              </span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .apr-outil {
          display: inline-flex; align-items: center; gap: 7px;
          min-height: 34px; padding: 0 12px;
          font-family: "JetBrains Mono", monospace; font-size: 11px;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: hsl(var(--ds-text-secondary));
          background: hsl(var(--ds-surface-2) / 0.8);
          border: 1px solid hsl(var(--ds-border-default) / 0.22);
          clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px));
        }
        .apr-outil:hover { color: hsl(var(--ds-text-primary)); border-color: hsl(var(--ds-accent-primary) / 0.5); }
        .apr-outil.est-primaire {
          color: hsl(var(--ds-bg-base)); background: hsl(var(--ds-accent-primary)); border-color: transparent;
        }
        .apr-prop {
          display: flex; align-items: flex-start; gap: 10px; text-align: left;
          padding: 9px 11px;
          background: hsl(var(--ds-surface-2) / 0.5);
          border-left: 2px solid hsl(var(--ds-border-default) / 0.3);
        }
        .apr-prop b {
          font-family: "JetBrains Mono", monospace; font-size: 13px;
          color: hsl(var(--ds-text-muted)); line-height: 1.3;
        }
        .apr-prop strong { display: block; font-size: 14px; color: hsl(var(--ds-text-secondary)); }
        .apr-prop small { display: block; margin-top: 2px; font-size: 12px; color: hsl(var(--ds-text-muted)); }
        .apr-prop.est-actif { border-left-color: hsl(var(--ds-accent-primary)); background: hsl(var(--ds-accent-primary) / 0.1); }
        .apr-prop.est-actif b { color: hsl(var(--ds-accent-primary)); }
        .apr-prop.est-actif strong { color: hsl(var(--ds-text-primary)); }
      `}</style>
    </div>
  );
}
