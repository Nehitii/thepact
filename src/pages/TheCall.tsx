import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Zap, ArrowLeft, Lock, RefreshCw, Play, FastForward, Flame, AlertTriangle } from "lucide-react";
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
  const chargeRef = useRef<HTMLElement>(null);

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
    if (chargeRef.current) {
      chargeRef.current.textContent = `${Math.round(p * 100)}%`;
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
        data-phase={phase}
        data-pret={pret}
        /* « touch-none » etait pose sur la page entiere : le zoom par
           pincement etait interdit partout. Il ne l est plus que sur la
           zone de prise, ou il empeche le defilement pendant l appui. */
        className="rit h-[100dvh] bg-background overflow-hidden flex flex-col relative text-foreground select-none"
      >
        {/* Le reacteur, centre sur la zone de prise */}
        <CoeurStellaire progres={progresRef} phase={phase} immobile={immobile} cible={boutonRef} />

        {/* Le poste : trame, equerres, rails */}
        <span className="rit-trame" aria-hidden="true" />
        <span className="rit-equerres" aria-hidden="true" />

        {/* ── Le rail haut ─────────────────────────────────────── */}
        <header className={cn("rit-rail", enSequence && "est-efface")}>
          <button type="button" onClick={() => navigate("/")} className="rit-outil">
            <ArrowLeft className="w-3 h-3" aria-hidden="true" />
            <span className="hidden sm:inline">{t("thecall.back")}</span>
          </button>

          <span className="rit-sig">RIT.01</span>
          <span className="rit-filet" />
          <span className="rit-sig hidden md:inline">{t("thecall.engine")}</span>
          <span className="rit-filet hidden md:block" />

          <span className="rit-lecture">
            <b ref={chargeRef}>0%</b>
            <span>{t("thecall.charge")}</span>
          </span>
        </header>

        {/* ── Le titre ─────────────────────────────────────────── */}
        <div className={cn("rit-titre-bloc", enSequence && "est-efface")}>
          {/* L espace compte : sans lui, le nom lu est « THECALL ». */}
          <h1 className="rit-titre">
            THE <em>CALL</em>
          </h1>
          {pacte && (
            <div className="rit-mesures">
              <span className="rit-mesure">
                <Flame className="w-3 h-3" aria-hidden="true" />
                <b>{serie}</b>{t("thecall.streakShort")}
              </span>
              <span className="rit-sep" aria-hidden="true" />
              <span className="rit-mesure"><b>{total}</b>{t("thecall.callsShort")}</span>
            </div>
          )}
        </div>

        {/* ── La scene ─────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center w-full relative z-10 min-h-0">
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
                <p className="rit-connecte">{t("thecall.connected")}</p>
                <span className="rit-trait" />
                <p className="rit-sous-connecte">{t("thecall.synchronized")}</p>
              </div>
            )}

            <div className={cn(
              "relative transition-all",
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
                className={cn("rit-prise touch-none", verrouille && "est-verrouille")}
              >
                {verrouille ? (
                  <span className="rit-verrou">
                    <Lock className="w-12 h-12" aria-hidden="true" />
                    <span className="rit-verrou-titre">{t("thecall.locked")}</span>
                    {pacte && (
                      <span className="rit-verrou-mesures">
                        <span><b>{serie}</b>{t("thecall.streakShort")}</span>
                        <span className="rit-sep" aria-hidden="true" />
                        <span><b>{total}</b>{t("thecall.callsShort")}</span>
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="rit-etiquette">
                    <Zap className="rit-eclair w-14 h-14" aria-hidden="true" />
                    <span className="rit-compte" ref={compteRef} />
                    <span className="rit-invite">
                      {chargement ? t("thecall.loading") : t("thecall.hold")}
                    </span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Le rail bas ──────────────────────────────────────── */}
        <footer className={cn("rit-pied", enSequence && "est-efface")}>
          {!verrouille && (
            <>
              <p id="rit-etat" className="rit-message">{messageEtat}</p>
              {/* La jauge se remplit depuis la variable : aucun rendu. */}
              <span className="rit-jauge" aria-hidden="true"><i /></span>
            </>
          )}

          {(erreurEcriture || erreurLecture) && (
            <div className="rit-alerte">
              <span>{erreurEcriture ? t("thecall.errorWrite") : t("thecall.errorRead")}</span>
              <button type="button" onClick={() => { reinitialiserErreur(); relire(); }} className="rit-outil">
                <RefreshCw className="w-3 h-3" aria-hidden="true" />{t("thecall.retry")}
              </button>
            </div>
          )}

          {verrouille && (
            <button type="button" onClick={() => navigate("/")} className="rit-outil est-large">
              {t("thecall.returnHome")}
            </button>
          )}

          {phase === "attente" && !immobile && !verrouille && (
            <p className="rit-avert">
              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
              {t("thecall.flashWarning")}
            </p>
          )}
        </footer>

        {/* Ce que la page dit a voix haute : les paliers, pas les dixiemes */}
        <p role="status" aria-live="polite" className="sr-only">{annonce}</p>

        {import.meta.env.DEV && (
          <div className="fixed bottom-4 right-4 z-[200] flex gap-2 opacity-25 hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button type="button" onClick={devReset} aria-label="Reinitialiser (dev)" title="Reinitialiser" className="rit-outil est-icone">
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => devAuto(1)} aria-label="Lecture automatique (dev)" title="Lecture automatique" className="rit-outil est-icone">
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => devAuto(5)} aria-label="Lecture acceleree (dev)" title="Lecture acceleree x5" className="rit-outil est-icone">
              <FastForward className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        <style>{`
        /* ═══════════════════════════════════════════════════════
           LE POSTE — l interface autour du reacteur
           Elle etait faite de boutons d application poses sur un
           fond noir. Elle devient un instrument : des rails, des
           equerres, une trame — et surtout, elle CHAUFFE avec le
           coeur : tout ce qui est teinte lit « --rit-teinte ».
           ═══════════════════════════════════════════════════════ */
        .rit {
          --rit-p: 0;
          --rit-mono: "JetBrains Mono", ui-monospace, monospace;
          --rit-trait: hsl(var(--ds-border-default) / 0.18);
          --rit-faible: hsl(var(--ds-text-muted) / 0.85);
        }

        /* La trame et les lignes de balayage : discretes, elles montent
           avec la charge. */
        .rit-trame {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background:
            repeating-linear-gradient(0deg, transparent 0 2px, rgba(255,255,255,0.014) 2px 4px),
            linear-gradient(hsl(var(--ds-accent-primary) / 0.03) 1px, transparent 1px) 0 0 / 100% 34px,
            linear-gradient(90deg, hsl(var(--ds-accent-primary) / 0.03) 1px, transparent 1px) 0 0 / 40px 100%;
          opacity: calc(0.5 + var(--rit-p) * 0.5);
        }

        /* Quatre equerres : le cadre d un viseur. */
        .rit-equerres {
          position: absolute; inset: 14px; z-index: 3; pointer-events: none;
          background:
            linear-gradient(var(--rit-teinte), var(--rit-teinte)) 0 0 / 30px 1px no-repeat,
            linear-gradient(var(--rit-teinte), var(--rit-teinte)) 0 0 / 1px 30px no-repeat,
            linear-gradient(var(--rit-teinte), var(--rit-teinte)) 100% 0 / 30px 1px no-repeat,
            linear-gradient(var(--rit-teinte), var(--rit-teinte)) 100% 0 / 1px 30px no-repeat,
            linear-gradient(var(--rit-teinte), var(--rit-teinte)) 0 100% / 30px 1px no-repeat,
            linear-gradient(var(--rit-teinte), var(--rit-teinte)) 0 100% / 1px 30px no-repeat,
            linear-gradient(var(--rit-teinte), var(--rit-teinte)) 100% 100% / 30px 1px no-repeat,
            linear-gradient(var(--rit-teinte), var(--rit-teinte)) 100% 100% / 1px 30px no-repeat;
          opacity: calc(0.35 + var(--rit-p) * 0.65);
        }

        /* ── Les rails ─────────────────────────────────────────── */
        .rit-rail {
          position: relative; z-index: 20;
          display: flex; align-items: center; gap: 12px;
          padding: 26px 30px 12px;
          font-family: var(--rit-mono); font-size: max(9.5px, 0.594rem);
          letter-spacing: 0.26em; text-transform: uppercase; color: var(--rit-faible);
          white-space: nowrap;
          transition: opacity 400ms var(--ds-ease-out);
        }
        .rit-rail.est-efface, .rit-titre-bloc.est-efface, .rit-pied.est-efface {
          opacity: 0; pointer-events: none;
        }
        .rit-sig { color: var(--rit-teinte); transition: color 200ms linear; }
        .rit-filet { flex: 1; min-width: 10px; height: 1px; background: var(--rit-trait); }
        .rit-lecture {
          display: inline-flex; align-items: baseline; gap: 7px;
          color: var(--rit-faible);
        }
        .rit-lecture b {
          font-weight: 700; font-size: max(12px, 0.75rem); letter-spacing: 0.04em;
          color: var(--rit-teinte); font-variant-numeric: tabular-nums;
          text-shadow: 0 0 calc(var(--rit-p) * 16px) var(--rit-teinte);
        }

        .rit-titre-bloc {
          position: relative; z-index: 20; text-align: center; padding: 0 20px;
          transition: opacity 400ms var(--ds-ease-out);
        }
        .rit-titre {
          margin: 0; font-family: "Orbitron", sans-serif; font-weight: 900;
          font-size: clamp(26px, 5vw, 44px); line-height: 1;
          letter-spacing: 0.14em; text-transform: uppercase; color: hsl(var(--ds-text-primary));
        }
        .rit-titre em {
          font-style: normal;
          color: var(--rit-teinte);
          text-shadow: 0 0 calc(14px + var(--rit-p) * 40px) var(--rit-teinte);
          transition: color 200ms linear;
        }
        .rit-mesures {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          margin-top: 10px;
          font-family: var(--rit-mono); font-size: max(9.5px, 0.594rem);
          letter-spacing: 0.22em; text-transform: uppercase; color: var(--rit-faible);
        }
        .rit-mesure { display: inline-flex; align-items: center; gap: 6px; }
        .rit-mesure b {
          font-weight: 700; font-size: max(12px, 0.75rem); letter-spacing: 0.04em;
          color: hsl(var(--ds-text-primary)); font-variant-numeric: tabular-nums;
        }
        .rit-mesure svg { color: hsl(var(--ds-accent-warning)); }
        .rit-sep { width: 1px; height: 11px; background: var(--rit-trait); }

        /* ── La zone de prise ──────────────────────────────────── */
        .rit-prise {
          position: relative; z-index: 10;
          width: min(62vmin, 300px); height: min(62vmin, 300px);
          border-radius: 999px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: box-shadow 200ms var(--ds-ease-out);
        }
        .rit-prise:focus-visible {
          outline: 1px solid var(--rit-teinte); outline-offset: 14px;
        }
        .rit-prise.est-verrouille {
          cursor: default;
          border: 1px solid hsl(var(--ds-accent-success) / 0.35);
          background: hsl(var(--ds-accent-success) / 0.05);
        }
        .rit-etiquette {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          pointer-events: none;
        }
        /* L eclair se dissout dans le coeur : passe un tiers de course,
           c est l objet qu on regarde, plus l icone. */
        .rit-eclair {
          color: #fff;
          opacity: calc(1 - var(--rit-p) * 3);
          filter: drop-shadow(0 0 calc(var(--rit-p) * 30px) var(--rit-teinte));
          stroke-width: 1.5;
        }
        /* Le compte a rebours passe devant un coeur incandescent : il lui
           faut son propre fond, pas seulement sa couleur. */
        .rit-compte {
          font-family: var(--rit-mono); font-weight: 700;
          font-size: clamp(28px, 6vmin, 46px); line-height: 1;
          font-variant-numeric: tabular-nums; letter-spacing: 0.04em;
          color: #fff;
          text-shadow: 0 2px 18px rgba(0,0,0,0.95), 0 0 calc(var(--rit-p) * 28px) var(--rit-teinte);
        }
        .rit-invite {
          font-family: var(--rit-mono); font-size: max(10px, 0.625rem);
          letter-spacing: 0.28em; text-transform: uppercase;
          color: hsl(var(--ds-text-secondary));
          text-shadow: 0 1px 10px rgba(0,0,0,0.9);
          opacity: calc(1 - var(--rit-p) * 5);
          animation: rit-respire 2.6s ease-in-out infinite;
        }
        @keyframes rit-respire { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.95; } }

        .rit-verrou {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          color: hsl(var(--ds-accent-success));
        }
        .rit-verrou svg { filter: drop-shadow(0 0 14px currentColor); }
        .rit-verrou-titre {
          font-family: var(--rit-mono); font-size: max(10px, 0.625rem);
          letter-spacing: 0.3em; text-transform: uppercase;
        }
        .rit-verrou-mesures {
          display: flex; align-items: center; gap: 10px; margin-top: 4px;
          font-family: var(--rit-mono); font-size: max(9.5px, 0.594rem);
          letter-spacing: 0.2em; text-transform: uppercase;
          color: hsl(var(--ds-text-muted));
        }
        .rit-verrou-mesures b { color: hsl(var(--ds-text-secondary)); font-weight: 700; margin-right: 5px; }

        /* ── Le rail bas ───────────────────────────────────────── */
        .rit-pied {
          position: relative; z-index: 20;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 10px 30px 30px;
          transition: opacity 400ms var(--ds-ease-out);
        }
        .rit-message {
          margin: 0;
          font-family: var(--rit-mono); font-size: max(10px, 0.625rem);
          letter-spacing: 0.3em; text-transform: uppercase;
          color: color-mix(in oklab, var(--rit-teinte) calc(var(--rit-p) * 100%), hsl(var(--ds-text-muted)));
          text-shadow: 0 0 12px rgba(0,0,0,0.8);
          text-align: center;
        }
        /* Une jauge segmentee, remplie par la variable — donc sans
           aucun rendu React. */
        .rit-jauge {
          position: relative; display: block;
          width: min(520px, 74vw); height: 8px;
          background:
            repeating-linear-gradient(90deg,
              var(--rit-trait) 0 6px, transparent 6px 10px);
        }
        .rit-jauge i {
          position: absolute; inset: 0 auto 0 0; display: block;
          width: calc(var(--rit-p) * 100%);
          background:
            repeating-linear-gradient(90deg,
              var(--rit-teinte) 0 6px, transparent 6px 10px);
          box-shadow: 0 0 calc(6px + var(--rit-p) * 20px) var(--rit-teinte);
        }
        .rit-avert {
          margin: 0; display: flex; align-items: center; gap: 7px;
          font-family: var(--rit-mono); font-size: max(9px, 0.5625rem);
          letter-spacing: 0.2em; text-transform: uppercase;
          color: hsl(var(--ds-text-muted) / 0.6);
        }
        .rit-alerte {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center;
          padding: 9px 14px;
          border-left: 2px solid hsl(var(--ds-accent-critical));
          background: hsl(var(--ds-accent-critical) / 0.08);
          font-family: var(--rit-mono); font-size: max(10px, 0.625rem);
          letter-spacing: 0.14em; text-transform: uppercase;
          color: hsl(var(--ds-accent-critical));
        }

        /* ── Les outils ────────────────────────────────────────── */
        .rit-outil {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          min-height: 32px; padding: 0 11px;
          font-family: var(--rit-mono); font-size: max(10px, 0.625rem);
          letter-spacing: 0.18em; text-transform: uppercase;
          color: hsl(var(--ds-text-secondary));
          background: hsl(var(--ds-surface-1) / 0.6);
          border: 1px solid var(--rit-trait);
          clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px));
          transition: color 140ms var(--ds-ease-out), background 140ms var(--ds-ease-out), border-color 140ms var(--ds-ease-out);
        }
        .rit-outil:hover {
          color: hsl(var(--ds-text-primary));
          border-color: color-mix(in oklab, var(--rit-teinte) 60%, transparent);
          background: hsl(var(--ds-surface-2) / 0.85);
        }
        .rit-outil:focus-visible { outline: 1px solid var(--rit-teinte); outline-offset: 2px; }
        .rit-outil.est-icone { width: 32px; min-width: 32px; padding: 0; }
        .rit-outil.est-large { padding: 0 22px; min-height: 38px; }

        /* ── La revelation ─────────────────────────────────────── */
        .rit-revelation { animation: rit-revele 2.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        @keyframes rit-revele {
          0%   { opacity: 0; transform: translate(-50%, -42%) scale(1.12); filter: blur(24px); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: blur(0); }
        }
        .rit-connecte {
          margin: 0; font-family: "Orbitron", sans-serif; font-weight: 900;
          font-size: clamp(38px, 11vw, 104px); line-height: 0.92;
          letter-spacing: 0.02em; text-transform: uppercase;
          color: #fff;
          text-shadow: 0 0 60px rgba(255,255,255,0.85), 0 0 140px hsl(var(--ds-accent-primary) / 0.6);
        }
        .rit-trait {
          display: block; height: 1px; width: 0; margin: 22px auto 0;
          background: hsl(var(--ds-accent-primary) / 0.6);
          animation: rit-etire 1.4s ease-out forwards 0.5s;
        }
        @keyframes rit-etire { to { width: 220px; } }
        .rit-sous-connecte {
          margin: 18px 0 0; opacity: 0;
          font-family: var(--rit-mono); font-size: max(10px, 0.625rem);
          letter-spacing: 0.5em; text-transform: uppercase;
          color: hsl(var(--ds-accent-primary) / 0.8);
          animation: rit-remonte 1s ease-out forwards 0.9s;
        }
        @keyframes rit-remonte { from { opacity: 0; transform: translateY(18px); } to { opacity: 0.85; transform: none; } }

        @media (pointer: coarse) { .rit-outil { min-height: 44px; } .rit-outil.est-icone { width: 44px; min-width: 44px; } }

        @media (prefers-reduced-motion: reduce) {
          .rit-invite, .rit-revelation, .rit-trait, .rit-sous-connecte { animation: none !important; }
          .rit-trait { width: 220px; }
          .rit-sous-connecte { opacity: 0.85; }
        }
      `}</style>
      </div>
    </DSPageShell>
  );
}
