import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "framer-motion";
import type { PomodoroPhase } from "@/hooks/usePomodoro";

/* LE SCELLÉ
 *
 * L application s appelle Vowpact. Une session n etait pourtant qu un
 * minuteur anonyme : un anneau de progression, le meme que dans n importe
 * quelle application de pomodoro. Ici, une session est l EXECUTION D UNE
 * CLAUSE — l engagement est enonce, le sceau se grave pendant que le temps
 * passe, la ligne de signature compte ce qui a ete honore.
 *
 * Ce qui distingue un sceau d une barre de progression ronde, ce n est pas
 * le trace : c est le substrat grave, present des la premiere seconde. A
 * zero pour cent, il y a deja un objet a regarder — ce que l anneau vide
 * ne donnait jamais.
 */

const C = 170;      // centre du repere
const R_TRACE = 144;
const CIRC = 2 * Math.PI * R_TRACE;

interface FocusSealProps {
  phase: PomodoroPhase;
  progress: number;
  secondsLeft: number;
  isPaused: boolean;
  sessionsCompleted: number;
  workMinutes: number;
  targetName?: string | null;
  goalImageUrl?: string | null;
  onStart?: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** Denture du sceau : un trait tous les 5 degres, plus long tous les 15.
 *  Calculee une fois — c est de la geometrie, pas de l etat. */
function useDenture() {
  return useMemo(() => {
    const traits: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let a = 0; a < 360; a += 5) {
      const rad = (a * Math.PI) / 180;
      const longueur = a % 15 === 0 ? 11 : 5;
      traits.push({
        x1: C + Math.cos(rad) * 162,
        y1: C + Math.sin(rad) * 162,
        x2: C + Math.cos(rad) * (162 - longueur),
        y2: C + Math.sin(rad) * (162 - longueur),
      });
    }
    return traits;
  }, []);
}

/** Hexagone de la quatrieme couche. */
const HEXAGONE = Array.from({ length: 6 }, (_, i) => {
  const rad = ((i * 60) * Math.PI) / 180;
  return `${(C + Math.cos(rad) * 84).toFixed(1)},${(C + Math.sin(rad) * 84).toFixed(1)}`;
}).join(" ");

export function FocusSeal({
  phase,
  progress,
  secondsLeft,
  isPaused,
  sessionsCompleted,
  workMinutes,
  targetName,
  goalImageUrl,
  onStart,
}: FocusSealProps) {
  const { t } = useTranslation();
  const mouvementReduit = useReducedMotion();
  const denture = useDenture();

  const auRepos = phase === "idle";
  const enPause = phase === "break";
  const enTravail = phase === "work";

  /* La frappe se declenche au franchissement, pas sur un etat : c est un
     evenement. On la lit sur le compteur de cycles, qui n avance qu au
     moment ou une clause vient d etre honoree. */
  const [frappe, setFrappe] = useState(false);
  const cyclesPrecedents = useRef(sessionsCompleted);
  useEffect(() => {
    if (sessionsCompleted > cyclesPrecedents.current && !mouvementReduit) {
      setFrappe(true);
      const fin = setTimeout(() => setFrappe(false), 950);
      cyclesPrecedents.current = sessionsCompleted;
      return () => clearTimeout(fin);
    }
    cyclesPrecedents.current = sessionsCompleted;
  }, [sessionsCompleted, mouvementReduit]);

  // Les couches ne s enclenchent que pendant la gravure : une pause
  // n execute aucune clause.
  const quarts = enTravail ? Math.floor(progress * 4) : 0;

  const etat = auRepos
    ? t("focus.clause.toSeal")
    : enPause
      ? t("focus.clause.recovery")
      : isPaused
        ? t("focus.clause.suspended")
        : t("focus.clause.executing");

  const enonce = targetName
    ? t("focus.clause.withTarget", { target: targetName })
    : t("focus.clause.plain", { minutes: workMinutes });

  const cachetsPoses = sessionsCompleted % 4;

  return (
    <div className="sc" data-phase={phase}>
      <div className="sc-etat">{etat}</div>
      <p className="sc-enonce">{enonce}</p>

      <div
        className={`sc-sceau${auRepos ? " sc-sceau--vierge" : ""}${frappe ? " est-frappee" : ""}`}
        style={{ ["--p" as string]: auRepos ? 0 : progress, ["--circ" as string]: CIRC }}
      >
        <span className={`sc-frappe${frappe ? " est-lancee" : ""}`} aria-hidden="true" />

        {goalImageUrl && !auRepos && (
          <div className="sc-vignette" aria-hidden="true">
            <img src={goalImageUrl} alt="" loading="lazy" decoding="async" />
          </div>
        )}

        <svg
          className="sc-svg"
          viewBox="0 0 340 340"
          role="progressbar"
          aria-label={t("focus.ring.progress")}
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={
            auRepos
              ? t("focus.ring.notStarted")
              : t("focus.ring.remaining", { time: formatTime(secondsLeft) })
          }
        >
          {/* Substrat : ce qui fait qu un sceau vide reste un objet. */}
          <g className="sc-dents" aria-hidden="true">
            {denture.map((d, i) => (
              <line key={i} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} />
            ))}
          </g>
          <circle className="sc-cercle" cx={C} cy={C} r={162} />
          <circle className="sc-cercle sc-cercle--net" cx={C} cy={C} r={152} />
          <circle className="sc-cercle" cx={C} cy={C} r={126} />
          <circle className="sc-piste" cx={C} cy={C} r={R_TRACE} />

          {/* La gravure. Deux epaisseurs : une creuse, une brille. */}
          <g transform={`rotate(-90 ${C} ${C})`}>
            <circle className="sc-trace-fond" cx={C} cy={C} r={R_TRACE} />
            <circle className="sc-trace" cx={C} cy={C} r={R_TRACE} />
          </g>

          {/* Le burin, au point ou la gravure se fait. */}
          {enTravail && !isPaused && (
            <g className="sc-burin" aria-hidden="true">
              <line x1={C} y1={C - 158} x2={C} y2={C - 130} />
            </g>
          )}

          {/* Quatre couches, une par quart : autant de reperes sans avoir
              a lire les chiffres. */}
          <g className={`sc-couche${quarts >= 1 ? " est-posee" : ""}`} aria-hidden="true">
            <polygon
              points={`${C},${C - 120} ${C + 120},${C} ${C},${C + 120} ${C - 120},${C}`}
              fill="none"
              stroke="hsl(var(--primary) / 0.5)"
              strokeWidth="1.5"
            />
          </g>
          <g className={`sc-couche${quarts >= 2 ? " est-posee" : ""}`} aria-hidden="true">
            <rect
              x={C - 78}
              y={C - 78}
              width={156}
              height={156}
              fill="none"
              stroke="var(--cp-jaune, #fcee0a)"
              strokeOpacity="0.34"
              strokeWidth="1.5"
            />
          </g>
          <g className={`sc-couche${quarts >= 3 ? " est-posee" : ""}`} aria-hidden="true">
            <circle
              cx={C}
              cy={C}
              r={104}
              fill="none"
              stroke="hsl(var(--primary) / 0.4)"
              strokeWidth="1"
              strokeDasharray="3 7"
            />
          </g>
          <g className={`sc-couche${quarts >= 4 ? " est-posee" : ""}`} aria-hidden="true">
            <polygon points={HEXAGONE} fill="none" stroke="#00ff88" strokeOpacity="0.55" strokeWidth="1.5" />
          </g>
        </svg>

        {auRepos && onStart ? (
          <button type="button" className="sc-depart" onClick={onStart} aria-label={t("focus.seal.affix")}>
            <SceauIcone />
            <span>{t("focus.seal.affix")}</span>
          </button>
        ) : (
          <div className="sc-noyau">
            <div className="sc-temps">{formatTime(secondsLeft)}</div>
            <div className="sc-sous">
              {isPaused
                ? t("focus.ring.halted")
                : enPause
                  ? t("focus.ring.cooling")
                  : t("focus.seal.engraving", { pct: Math.round(progress * 100) })}
            </div>
          </div>
        )}
      </div>

      <div className="sc-signature">
        <i aria-hidden="true" />
        {auRepos ? (
          <span>{t("focus.seal.ready")}</span>
        ) : (
          <>
            <span className="sc-cachets" aria-hidden="true">
              {Array.from({ length: 4 }, (_, i) => (
                <u key={i} className={i < cachetsPoses ? "est-appose" : ""} />
              ))}
            </span>
            <span>{t("focus.seal.sealedOf", { count: cachetsPoses })}</span>
          </>
        )}
        <i aria-hidden="true" />
      </div>
    </div>
  );
}

/** Le poincon : un hexagone entaille, repris du vocabulaire de l app. */
function SceauIcone() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" fill="none">
      <polygon points="15,2 27,9 27,21 15,28 3,21 3,9" stroke="currentColor" strokeWidth="1.4" />
      <polygon points="15,8 22,12 22,18 15,22 8,18 8,12" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <circle cx="15" cy="15" r="2.4" fill="currentColor" />
    </svg>
  );
}

export default FocusSeal;
