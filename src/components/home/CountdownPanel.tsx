import { useState, useEffect, useMemo } from "react";
import { CornerBrackets } from "./CornerBrackets";

interface CountdownPanelProps {
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  goalsCompleted: number;
  totalGoals: number;
  pactName?: string;
}

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

// Phase color configs
const PHASE_GREEN = {
  primary: "#00e676",
  rgb: "0,230,118",
  label: "NOMINAL",
  labelLines: ["STATUT", "NOMINAL"],
  statusIcon: "shield",
  pulseAnim: "none",
  blinkAnim: "none",
  flickerAnim: "none",
  barGradient: "linear-gradient(90deg, rgba(0,230,118,0.5), rgba(0,230,118,0.8))",
  gradStopA: "#00e676",
  gradStopB: "#69f0ae",
  statusEmoji: "✓",
} as const;

const PHASE_AMBER = {
  primary: "#ffab00",
  rgb: "255,171,0",
  label: "ATTENTION",
  labelLines: ["NIVEAU", "ATTENTION"],
  statusIcon: "clock",
  pulseAnim: "alertPulse 2.5s ease-in-out infinite",
  blinkAnim: "none",
  flickerAnim: "none",
  barGradient: "linear-gradient(90deg, rgba(0,230,118,0.5), rgba(255,171,0,0.8))",
  gradStopA: "#ffab00",
  gradStopB: "#ffd740",
  statusEmoji: "◆",
} as const;

const PHASE_RED = {
  primary: "#ff1744",
  rgb: "255,23,68",
  label: "CRITIQUE",
  labelLines: ["ALERTE", "CRITIQUE"],
  statusIcon: "triangle",
  pulseAnim: "alertPulse 1s ease-in-out infinite",
  blinkAnim: "blink 2s step-end infinite",
  flickerAnim: "numFlicker 2s ease-in-out infinite",
  barGradient: "linear-gradient(90deg, rgba(255,100,0,0.7), rgba(255,23,68,0.9))",
  gradStopA: "#ff1744",
  gradStopB: "#ff8c00",
  statusEmoji: "⚠",
} as const;

function ShieldIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function TriangleIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function CountdownPanel({ projectStartDate, projectEndDate, goalsCompleted, totalGoals, pactName = "OPERATION ASCENSION" }: CountdownPanelProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const calc = useMemo(() => {
    if (!projectEndDate) return null;
    const start = projectStartDate ? new Date(projectStartDate).getTime() : now;
    const end = new Date(projectEndDate).getTime();
    const total = end - start;
    const elapsed = now - start;
    const remaining = Math.max(0, end - now);
    const pct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;

    const d = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const h = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((remaining % (1000 * 60)) / 1000);

    const totalDays = Math.max(1, Math.ceil(total / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.ceil(remaining / (1000 * 60 * 60 * 24));

    const remainingPct = 100 - pct;
    let phase = "PHASE TERMINALE";
    let statusLabel = "CRITIQUE";
    if (remainingPct > 75) { phase = "PHASE INITIALE"; statusLabel = "STABLE"; }
    else if (remainingPct > 25) { phase = "PHASE INTERMÉDIAIRE"; statusLabel = "ATTENTION"; }

    const colors = remainingPct > 75 ? PHASE_GREEN : remainingPct > 25 ? PHASE_AMBER : PHASE_RED;

    return { days: d, hours: h, minutes: m, seconds: s, progressPct: pct, phase, statusLabel, totalDays, remainingDays, colors };
  }, [now, projectStartDate, projectEndDate]);

  if (!projectEndDate || !calc) return null;

  const c = calc.colors;
  const startStr = projectStartDate ? new Date(projectStartDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }).toUpperCase() : "—";
  const endStr = new Date(projectEndDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }).toUpperCase();

  const StatusIcon = c.statusIcon === "shield" ? ShieldIcon : c.statusIcon === "clock" ? ClockIcon : TriangleIcon;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: 4,
        border: `1px solid rgba(${c.rgb},0.15)`,
        background: "var(--nexus-countdown-bg)",
        boxShadow: `0 0 20px rgba(${c.rgb},0.05)`,
      }}
    >
      <CornerBrackets color={`rgba(${c.rgb},0.4)`} />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, rgba(${c.rgb},0.4), transparent)` }} />
      <div className="absolute top-0 bottom-0 left-0" style={{ width: 3, background: `linear-gradient(180deg, rgba(${c.rgb},0.8), rgba(${c.rgb},0.1))`, boxShadow: `0 0 12px rgba(${c.rgb},0.6)` }} />

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center" style={{ minHeight: 100 }}>
        {/* Left: Alert status */}
        <div
          className="flex flex-col items-center justify-center gap-2 md:border-r border-b md:border-b-0"
          style={{ padding: "20px 28px", borderColor: `rgba(${c.rgb},0.15)`, background: `rgba(${c.rgb},0.04)` }}
        >
          <div className="relative" style={{ width: 44, height: 44 }}>
            <svg viewBox="0 0 44 44" style={{ width: 44, height: 44, animation: "ringRotate 8s linear infinite" }}>
              <defs>
                <linearGradient id="alertGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={c.gradStopA} />
                  <stop offset="100%" stopColor={c.gradStopB} />
                </linearGradient>
              </defs>
              <circle cx="22" cy="22" r="20" fill="none" stroke={`rgba(${c.rgb},0.1)`} strokeWidth="2" />
              <circle cx="22" cy="22" r="20" fill="none" stroke="url(#alertGrad)" strokeWidth="2" strokeDasharray="30 95" strokeLinecap="round" />
              <circle cx="22" cy="22" r="14" fill="none" stroke={`rgba(${c.rgb},0.15)`} strokeWidth="1" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center" style={{ animation: c.pulseAnim }}>
              <StatusIcon color={c.primary} />
            </div>
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: 3, color: `rgba(${c.rgb},0.6)`, textTransform: "uppercase" as const, textAlign: "center", animation: c.blinkAnim }}>
            {c.labelLines[0]}<br />{c.labelLines[1]}
          </div>
        </div>

        {/* Center: Countdown + bar */}
        <div style={{ padding: "20px 28px" }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: 4, color: `rgba(${c.rgb},0.4)`, textTransform: "uppercase" as const, marginBottom: 12 }}>
            ⬝ PACTE EN COURS — {calc.phase} — COMPTE À REBOURS ACTIF
          </div>

          <div className="flex items-center">
            {[
              { val: calc.days, label: "JOURS" },
              { val: calc.hours, label: "HEURES" },
              { val: calc.minutes, label: "MIN" },
              { val: calc.seconds, label: "SEC" },
            ].map((t, i) => (
              <div key={t.label} className="flex items-center">
                <div className="flex flex-col items-center" style={{ minWidth: "clamp(40px, 6vw, 70px)" }}>
                  <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: c.primary, textShadow: `0 0 10px rgba(${c.rgb},0.9), 0 0 40px rgba(${c.rgb},0.35)`, lineHeight: 1, animation: c.flickerAnim, fontVariantNumeric: "tabular-nums", display: "inline-block", textAlign: "center" as const, width: "100%" }}>
                    {pad(t.val)}
                  </span>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 7, letterSpacing: 2, color: `rgba(${c.rgb},0.35)`, textTransform: "uppercase" as const, marginTop: 4 }}>
                    {t.label}
                  </span>
                </div>
                {i < 3 && (
                  <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 700, color: `rgba(${c.rgb},0.3)`, margin: "0 6px 12px", animation: "colonBlink 1s step-end infinite" }}>
                    :
                  </span>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="flex justify-between" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: 2, color: `rgba(${c.rgb},0.35)`, marginBottom: 5 }}>
              <span>DÉBUT · {startStr}</span>
              <span>{Math.round(calc.progressPct)}% ÉCOULÉ</span>
              <span>FIN · {endStr}</span>
            </div>
            <div className="relative overflow-hidden" style={{ height: 6, background: `rgba(${c.rgb},0.06)`, border: `1px solid rgba(${c.rgb},0.12)`, borderRadius: 1 }}>
              <div className="relative" style={{ height: "100%", width: `${calc.progressPct}%`, background: c.barGradient, boxShadow: `0 0 8px rgba(${c.rgb},0.5)`, borderRadius: 1 }}>
                <div className="absolute top-0 left-0 right-0" style={{ height: "50%", background: "rgba(255,255,255,0.08)" }} />
                <div className="absolute top-0 right-0" style={{ width: 20, height: "100%", background: `linear-gradient(90deg, transparent, rgba(${c.rgb},0.6))`, animation: "barPulse 2s ease-in-out infinite" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info rows */}
        <div
          className="flex flex-col justify-center gap-[14px] md:border-l border-t md:border-t-0"
          style={{ padding: "20px 28px", borderColor: `rgba(${c.rgb},0.12)`, background: `rgba(${c.rgb},0.02)`, minWidth: 180 }}
        >
          {[
            { key: "NOM DU PACTE", val: pactName, critical: false },
            { key: "DURÉE TOTALE", val: `${calc.totalDays} jours`, critical: false },
            { key: "STATUT", val: `${c.statusEmoji} ${calc.statusLabel}`, critical: true },
            { key: "COMPLÉTION OBJ.", val: `${goalsCompleted} / ${totalGoals}`, critical: false },
          ].map((row) => (
            <div key={row.key} className="flex flex-col gap-0.5">
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 7, letterSpacing: 3, color: `rgba(${c.rgb},0.35)`, textTransform: "uppercase" as const }}>
                {row.key}
              </span>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: row.critical ? 12 : 11, letterSpacing: 1, color: row.critical ? c.primary : `rgba(${c.rgb},0.7)`, textShadow: row.critical ? `0 0 6px rgba(${c.rgb},0.5)` : "none" }}>
                {row.val}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ringRotate { to { transform: rotate(360deg); } }
        @keyframes alertPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink { 50%{opacity:0} }
        @keyframes numFlicker { 0%,90%,100%{opacity:1} 92%,97%{opacity:0.7} }
        @keyframes colonBlink { 50%{opacity:0.1} }
        @keyframes barPulse { 0%,100%{opacity:0} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
