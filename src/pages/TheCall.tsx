import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Zap, ArrowLeft, Lock, RefreshCw, Play, FastForward, Flame, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheCall } from "@/hooks/useTheCall";
import { CoeurStellaire } from "@/components/thecall/CoeurStellaire";
import { DSPageShell } from "@/components/ds";
import { cn } from "@/lib/utils";

/* RIT.01 — L APPEL
 *
 * La page n a qu une fonction : maintenir vingt secondes, une fois par
 * jour. Elle avait quatre defauts qui touchaient la donnee.
 *
 * 1. Le rituel se terminait sans le doigt qui l avait commence :
 *    « pointercancel » n etait pas ecoute, et rien n annulait la boucle
 *    au demontage. Un appui interrompu — un defilement, un appel, un
 *    changement de page — la laissait courir jusqu au bout et ecrire.
 * 2. L ecriture n etait ni attendue ni verifiee, et sortait en silence
 *    si le pacte n etait pas encore charge : la page annoncait « ame
 *    connectee » sans que rien ne soit enregistre.
 * 3. La serie ne se cassait jamais, et 4. le verrou du jour comparait
 *    une date locale a une date relue en UTC. Ces deux-la sont partis
 *    en base, dans « enregistrer_appel » — voir « useTheCall ».
 *
 * S y ajoutent l acces clavier, qui n existait pas, et la boucle qui
 * re-rendait tout l arbre soixante fois par seconde : la progression
 * est maintenant peinte en imperatif, React ne voit que les paliers.
 */

const DUREE = 20000;
const NB_PARTICULES = 16;

/* Les trois couleurs de la montee. Ce sont des etapes d une jauge, pas
   des couleurs d interface : elles restent nommees ici. */
const FROID = [6, 182, 212] as const;
const CHAUD = [139, 92, 246] as const;
const BLANC = [255, 255, 255] as const;

type Phase =
  | "attente" | "montee" | "critique"
  | "implosion" | "singularite" | "explosion" | "revelation" | "verrouille";

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;
const easeInExpo = (x: number) => (x === 0 ? 0 : Math.pow(2, 10 * x - 10));
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

const melange = (a: readonly number[], b: readonly number[], t: number) =>
  `rgb(${Math.round(lerp(a[0], b[0], t))}, ${Math.round(lerp(a[1], b[1], t))}, ${Math.round(lerp(a[2], b[2], t))})`;

const teinteDe = (p: number) =>
  p < 0.5 ? melange(FROID, CHAUD, p * 2)
    : p < 0.85 ? melange(CHAUD, [255, 0, 255], (p - 0.5) / 0.35)
      : melange([255, 0, 255], BLANC, (p - 0.85) / 0.15);

/* Le reglage etait lu une fois et jamais ecoute : le changer en cours
   de session ne changeait rien. */
function useMouvementReduit() {
  const [reduit, setReduit] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const suivre = () => setReduit(m.matches);
    m.addEventListener("change", suivre);
    return () => m.removeEventListener("change", suivre);
  }, []);
  return reduit;
}

export default function TheCall() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const immobile = useMouvementReduit();

  const {
    pacte, chargement, erreurLecture, pret, dejaFait,
    enregistrer, erreurEcriture, reinitialiserErreur, relire,
  } = useTheCall();

  const [phase, setPhase] = useState<Phase>("attente");
  const [relacheTot, setRelacheTot] = useState(false);

  const racineRef = useRef<HTMLDivElement>(null);
  const boutonRef = useRef<HTMLButtonElement>(null);
  const compteRef = useRef<HTMLSpanElement>(null);

  const progresRef = useRef(0);
  const tientRef = useRef(false);
  const finiRef = useRef(false);
  const departRef = useRef(0);
  const rafRef = useRef(0);
  const palierRef = useRef<Phase>("attente");
  const vivantRef = useRef(true);
  const vitesseRef = useRef(1);
  const autoRef = useRef(false);

  const enSequence = phase === "implosion" || phase === "singularite"
    || phase === "explosion" || phase === "revelation";
  const verrouille = phase === "verrouille";
  const tenable = pret && !verrouille && !enSequence;

  useEffect(() => {
    if (dejaFait) { finiRef.current = true; setPhase("verrouille"); }
  }, [dejaFait]);

  /* Il n y avait aucun nettoyage dans tout le fichier : quitter la page
     en cours d appui laissait la boucle finir sa course et ecrire. */
  useEffect(() => {
    /* Le drapeau doit etre RE-arme a chaque montage : en mode strict,
       React monte, demonte, remonte — sans cette ligne, la sequence se
       croyait morte des le premier rendu. */
    vivantRef.current = true;
    return () => { vivantRef.current = false; cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Ce que le DOM porte encore : le texte ──────────────────
  const peindre = useCallback((p: number) => {
    /* La toile lit « progresRef » toute seule. Ici on ne touche qu au
       compte a rebours et aux deux variables dont le texte se sert. */
    const r = racineRef.current;
    if (r) {
      r.style.setProperty("--rit-p", String(p));
      r.style.setProperty("--rit-teinte", teinteDe(p));
    }
    if (compteRef.current) {
      compteRef.current.textContent = p > 0 ? `${(20 - p * 20).toFixed(1)}s` : "";
    }
  }, []);

  const rendreLaMain = useCallback(() => {
    progresRef.current = 0;
    peindre(0);
    palierRef.current = "attente";
    setPhase("attente");
  }, [peindre]);

  // ── La conclusion ───────────────────────────────────────────
  const conclure = useCallback(async () => {
    tientRef.current = false;
    finiRef.current = true;
    cancelAnimationFrame(rafRef.current);
    peindre(1);

    setPhase("implosion");
    await attendre(500);
    setPhase("singularite");
    await attendre(200);

    /* L ecriture est ATTENDUE, et son echec remonte : la page ne dit
       plus « connecte » avant que la base l ait accepte. En mode
       demonstration, on ne touche pas a la base. */
    if (!autoRef.current && vitesseRef.current === 1) {
      try {
        await enregistrer();
      } catch {
        finiRef.current = false;
        if (vivantRef.current) rendreLaMain();
        return;
      }
    }
    if (!vivantRef.current) return;

    setPhase("explosion");
    await attendre(immobile ? 500 : 100);
    if (!vivantRef.current) return;
    setPhase("revelation");
    await attendre(3000);
    if (!vivantRef.current) return;
    /* Le reacteur a disparu : le fond doit redescendre avec lui, sinon
       l ecran reste incandescent sous l etat verrouille. */
    progresRef.current = 0;
    peindre(0);
    setPhase("verrouille");
  }, [peindre, enregistrer, immobile, rendreLaMain]);

  // ── La boucle ───────────────────────────────────────────────
  const boucleRef = useRef<() => void>(() => {});
  const planifier = useCallback(() => {
    rafRef.current = requestAnimationFrame(() => boucleRef.current());
  }, []);

  const boucle = useCallback(() => {
    if (!tientRef.current || finiRef.current) return;
    const p = clamp(((performance.now() - departRef.current) * vitesseRef.current) / DUREE, 0, 1);
    progresRef.current = p;
    peindre(p);

    /* React ne voit que les paliers : trois rendus au lieu de mille
       deux cents. */
    const palier: Phase = p >= 0.85 ? "critique" : p > 0 ? "montee" : "attente";
    if (palierRef.current !== palier) { palierRef.current = palier; setPhase(palier); }

    if (p >= 1) conclure();
    else planifier();
  }, [peindre, conclure, planifier]);

  /* La boucle se re-planifiait elle-meme : les vingt secondes tournaient
     sur les variables du premier rendu. Elle passe par une reference,
     donc chaque image utilise la version courante. */
  useEffect(() => { boucleRef.current = boucle; }, [boucle]);

  // ── Les commandes ───────────────────────────────────────────
  const demarrer = useCallback(() => {
    if (!tenable || tientRef.current || finiRef.current) return;
    if (erreurEcriture) reinitialiserErreur();
    setRelacheTot(false);
    tientRef.current = true;
    departRef.current = performance.now();
    planifier();
  }, [tenable, erreurEcriture, reinitialiserErreur, planifier]);

  const arreter = useCallback(() => {
    if (!tientRef.current) return;
    /* On lache toujours la prise — meme si la sequence finale est deja
       partie : sinon l appui reste « en cours » pour toujours, et le
       suivant est refuse sans rien dire. */
    tientRef.current = false;
    if (finiRef.current) return;
    cancelAnimationFrame(rafRef.current);

    if (progresRef.current > 0.05) {
      setRelacheTot(true);
      setTimeout(() => setRelacheTot(false), 2500);
    }

    /* Le retour a zero planifiait sa propre image DANS le calcul d etat
       de React. Il vit ici, avec la meme reference d animation que la
       montee — un nouvel appui l annule donc vraiment. */
    const revenir = () => {
      if (tientRef.current || finiRef.current) return;
      const p = Math.max(0, progresRef.current - 0.05);
      progresRef.current = p;
      peindre(p);
      if (p > 0) rafRef.current = requestAnimationFrame(revenir);
      else if (palierRef.current !== "attente") { palierRef.current = "attente"; setPhase("attente"); }
    };
    revenir();
  }, [peindre]);

  // ── Outils de developpement ─────────────────────────────────
  const devReset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    tientRef.current = false; finiRef.current = false;
    autoRef.current = false; vitesseRef.current = 1;
    setRelacheTot(false);
    rendreLaMain();
  }, [rendreLaMain]);

  const devAuto = useCallback((vitesse: number) => {
    devReset();
    setTimeout(() => {
      tientRef.current = true; autoRef.current = true; vitesseRef.current = vitesse;
      departRef.current = performance.now();
      planifier();
    }, 50);
  }, [devReset, planifier]);

  // ── Les textes d etat ───────────────────────────────────────
  const messageEtat = relacheTot ? t("thecall.fading")
    : phase === "critique" ? t("thecall.critical")
      : phase === "montee" ? t("thecall.rising")
        : t("thecall.awaiting");

  const annonce = phase === "critique" ? t("thecall.critical")
    : phase === "verrouille" ? t("thecall.announceDone")
      : phase === "montee" ? t("thecall.syncing")
        : "";

  const total = pacte?.total ?? 0;
  const serie = pacte?.serie ?? 0;

  return (
    <DSPageShell width="full" padding="tight" className="!p-0">
      <div
        ref={racineRef}
        style={{ ["--rit-p" as string]: 0, ["--rit-teinte" as string]: "hsl(var(--ds-accent-primary))" } as React.CSSProperties}
        /* « touch-none » etait pose sur la page entiere : le zoom par
           pincement etait interdit partout. Il ne l est plus que sur le
           bouton, ou il empeche le defilement pendant l appui. */
        data-phase={phase}
        data-pret={pret}
        className="rit h-[100dvh] bg-background overflow-hidden flex flex-col relative text-foreground select-none"
      >
        {/* Le coeur : une seule toile, qui porte le reacteur ET le fond */}
        <CoeurStellaire progres={progresRef} phase={phase} immobile={immobile} />

        <div className="relative z-10 flex-1 flex flex-col items-center">
          {/* L en-tete */}
          <div className={cn(
            "w-full z-20 transition-opacity duration-500 pointer-events-none shrink-0",
            enSequence ? "opacity-0" : "opacity-100",
          )}>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="pointer-events-auto absolute top-4 left-4 sm:top-6 sm:left-6 z-30 text-muted-foreground hover:text-foreground hover:bg-muted/10 font-mono text-xs tracking-[0.2em]"
            >
              <ArrowLeft className="w-3 h-3 mr-2" aria-hidden="true" /> {t("thecall.back")}
            </Button>

            <div className="pt-12 sm:pt-16 pb-2 sm:pb-4 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="flex-1 max-w-[80px] h-px bg-gradient-to-r from-transparent to-primary/20" />
                <span className="font-mono ds-t-label text-primary/50 tracking-[0.25em]">{t("thecall.engine")}</span>
                <span className="flex-1 max-w-[80px] h-px bg-gradient-to-r from-primary/20 to-transparent" />
              </div>
              <h1 className="font-orbitron font-black text-[clamp(24px,5vw,40px)] tracking-[0.08em] leading-none text-transparent bg-clip-text bg-gradient-to-b from-foreground/95 to-foreground/50">
                THE <span className="text-primary [text-shadow:0_0_12px_hsl(var(--ds-accent-primary)/0.8)]">CALL</span>
              </h1>

              {pacte && !enSequence && (
                <div className="flex items-center justify-center gap-4 mt-3">
                  <span className="font-mono ds-t-label text-muted-foreground/70 tracking-wider">
                    <Flame className="w-3 h-3 inline mr-1 text-orange-400/80" aria-hidden="true" />
                    {t("thecall.streak", { count: serie })}
                  </span>
                  <span className="font-mono ds-t-label text-muted-foreground/70 tracking-wider">
                    {t("thecall.calls", { count: total })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Le centre */}
          <div className="flex-1 flex items-center justify-center w-full">
            <div className="relative flex flex-col items-center justify-center">
              <div className={cn(
                "fixed inset-0 bg-black z-[90] pointer-events-none transition-opacity duration-200",
                phase === "singularite" ? "opacity-100" : "opacity-0",
              )} />
              <div className={cn(
                "fixed inset-0 z-[100] pointer-events-none transition-opacity ease-out bg-white",
                phase === "explosion"
                  ? (immobile ? "duration-500 opacity-70" : "duration-150 opacity-90")
                  : "[transition-duration:3000ms] opacity-0",
              )} />

              {phase === "revelation" && (
                <div className="absolute z-[110] flex flex-col items-center rit-revelation top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full">
                  <div className="absolute inset-[-300px] rit-rayons opacity-50 blur-2xl -z-10" />
                  {/* C etait un second « h1 » sur la page. */}
                  <p className="text-5xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-300 tracking-tight drop-shadow-[0_0_50px_rgba(255,255,255,0.9)] leading-[0.95] mb-6 m-0">
                    {t("thecall.connected")}
                  </p>
                  <span className="h-px w-0 bg-cyan-400/50 rit-trait" />
                  <p className="text-cyan-200/70 font-mono text-xs uppercase tracking-[0.5em] mt-6 rit-monte">
                    {t("thecall.synchronized")}
                  </p>
                </div>
              )}

              <div className={cn(
                "relative transition-all will-change-transform",
                phase === "implosion" ? "scale-0 opacity-0 duration-500" : "scale-100 opacity-100 duration-100",
                phase === "revelation" ? "hidden" : "block",
              )}>


                <button
                  ref={boutonRef}
                  type="button"
                  onPointerDown={(e) => {
                    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointeur synthetique */ }
                    demarrer();
                  }}
                  onPointerUp={arreter}
                  /* « pointercancel » manquait : c est lui que le systeme
                     envoie quand le geste devient un defilement ou qu un
                     appel arrive. Sans lui, la boucle continuait seule. */
                  onPointerCancel={arreter}
                  onLostPointerCapture={arreter}
                  onKeyDown={(e) => {
                    if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); demarrer(); }
                  }}
                  onKeyUp={(e) => {
                    if (e.key === " " || e.key === "Enter") { e.preventDefault(); arreter(); }
                  }}
                  onBlur={arreter}
                  disabled={!tenable}
                  aria-label={verrouille ? t("thecall.ariaDone") : t("thecall.ariaHold")}
                  aria-describedby="rit-etat"
                  className={cn(
                    "rit-prise touch-none relative w-64 h-64 sm:w-80 sm:h-80 rounded-full flex items-center justify-center",
                    "transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-background",
                    verrouille
                      ? "border border-[hsl(var(--ds-accent-success)/0.35)] bg-[hsl(var(--ds-accent-success)/0.06)] cursor-default"
                      : "cursor-pointer",
                  )}
                >
                  <span className="rit-etiquette relative z-20 flex flex-col items-center pointer-events-none">
                    {verrouille ? (
                      <span className="flex flex-col items-center text-[hsl(var(--ds-accent-success))]">
                        <Lock className="w-14 h-14 mb-3 drop-shadow-[0_0_15px_currentColor]" aria-hidden="true" />
                        <span className="font-mono ds-t-label tracking-[0.3em] uppercase opacity-80">
                          {t("thecall.locked")}
                        </span>
                        {pacte && (
                          <span className="flex items-center gap-3 mt-4 text-muted-foreground/60">
                            <span className="font-mono ds-t-label tracking-wider">
                              <Flame className="w-3 h-3 inline mr-1 text-orange-400/70" aria-hidden="true" />{serie}
                            </span>
                            {/* Le total etait affiche « + 1 » cote client ;
                                c est celui que la base a rendu. */}
                            <span className="font-mono ds-t-label tracking-wider">{t("thecall.calls", { count: total })}</span>
                          </span>
                        )}
                      </span>
                    ) : (
                      <>
                        <Zap className="rit-eclair w-16 h-16" aria-hidden="true" />
                        <span className="mt-4 h-5 flex items-center justify-center font-mono text-xs tracking-[0.2em]">
                          <span ref={compteRef} className="rit-compte tabular-nums" />
                          <span className="rit-invite">
                            {chargement ? t("thecall.loading") : t("thecall.hold")}
                          </span>
                        </span>
                      </>
                    )}
                  </span>
                </button>
              </div>

              {/* L etat, annonce aussi a la voix */}
              {!verrouille && !enSequence && (
                <div className="mt-8 text-center">
                  <p
                    id="rit-etat"
                    className="rit-message font-mono ds-t-label uppercase tracking-[0.3em] transition-colors duration-200"
                  >
                    {messageEtat}
                  </p>
                  {phase === "attente" && !immobile && (
                    <p className="mt-3 font-mono ds-t-label uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center justify-center gap-2">
                      <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                      {t("thecall.flashWarning")}
                    </p>
                  )}
                </div>
              )}

              {/* Les erreurs : un message et une reprise, pas un verrou */}
              {(erreurEcriture || erreurLecture) && (
                <div className="mt-6 text-center max-w-[42ch]">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[hsl(var(--ds-accent-critical))]">
                    {erreurEcriture ? t("thecall.errorWrite") : t("thecall.errorRead")}
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => { reinitialiserErreur(); relire(); }}
                    className="mt-2 font-mono text-xs tracking-[0.2em] text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="w-3 h-3 mr-2" aria-hidden="true" />{t("thecall.retry")}
                  </Button>
                </div>
              )}

              {verrouille && (
                <div className="mt-8 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="text-muted-foreground/60 hover:text-foreground font-mono text-xs tracking-[0.2em]"
                  >
                    {t("thecall.returnHome")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ce que la page dit a voix haute : les paliers, pas les dixiemes */}
        <p role="status" aria-live="polite" className="sr-only">{annonce}</p>

        {import.meta.env.DEV && (
          <div className="fixed bottom-4 right-4 z-[200] flex gap-2 opacity-20 hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <Button variant="secondary" size="icon" onClick={devReset} aria-label="Reinitialiser (dev)" title="Reinitialiser">
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button variant="secondary" size="icon" onClick={() => devAuto(1)} aria-label="Lecture automatique (dev)" title="Lecture automatique">
              <Play className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button variant="secondary" size="icon" onClick={() => devAuto(5)} aria-label="Lecture acceleree (dev)" title="Lecture acceleree x5">
              <FastForward className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        <style>{`
        /* Le DOM ne porte plus que le texte : la toile fait le reste.
           Ces deux variables lui donnent la couleur du moment. */
        .rit { --rit-p: 0; }

        .rit-prise { box-shadow: 0 0 calc(var(--rit-p) * 90px) color-mix(in oklab, var(--rit-teinte) 45%, transparent); }
        .rit-prise:focus-visible { --tw-ring-color: var(--rit-teinte); }

        /* L eclair se dissout dans le coeur : passe un tiers de course,
           c est l objet qu on regarde, plus l icone. */
        .rit-eclair {
          color: #fff;
          opacity: calc(1 - var(--rit-p) * 3);
          filter: drop-shadow(0 0 calc(var(--rit-p) * 30px) var(--rit-teinte));
          stroke-width: 1.5;
        }
        /* Le compte a rebours passe devant un coeur incandescent : il
           lui faut son propre fond, pas seulement sa couleur. */
        .rit-compte {
          color: #fff;
          text-shadow: 0 0 12px rgba(0,0,0,0.9), 0 0 calc(var(--rit-p) * 26px) var(--rit-teinte);
        }
        .rit-invite { color: hsl(var(--ds-text-muted)); opacity: calc(1 - var(--rit-p) * 4); animation: rit-respire 2.5s ease-in-out infinite; }
        @keyframes rit-respire { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.85; } }
        .rit-message { color: color-mix(in oklab, var(--rit-teinte) calc(var(--rit-p) * 100%), hsl(var(--ds-text-muted))); text-shadow: 0 0 10px rgba(0,0,0,0.8); }

        .rit-revelation { animation: rit-revele 2.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        @keyframes rit-revele {
          0%   { opacity: 0; transform: translate(-50%, -40%) scale(1.1); filter: blur(20px); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: blur(0); }
        }
        .rit-rayons { background: conic-gradient(hsl(var(--ds-accent-primary) / 0), hsl(var(--ds-accent-primary) / 0.2), hsl(var(--ds-accent-primary) / 0)); animation: rit-tourne 60s linear infinite; }
        @keyframes rit-tourne { to { transform: rotate(360deg); } }
        .rit-trait { animation: rit-etire 1.5s ease-out forwards 0.5s; }
        @keyframes rit-etire { to { width: 200px; } }
        .rit-monte { opacity: 0; animation: rit-remonte 1s ease-out forwards 1s; }
        @keyframes rit-remonte { from { opacity: 0; transform: translateY(20px); } to { opacity: 0.7; transform: none; } }

        @media (prefers-reduced-motion: reduce) {
          .rit-invite,
          .rit-rayons, .rit-trait, .rit-monte, .rit-revelation { animation: none !important; }
          .rit-monte { opacity: 0.7; }
          .rit-trait { width: 200px; }
        }
      `}</style>
      </div>
    </DSPageShell>
  );
}
