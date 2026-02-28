import { useState, useEffect, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { CornerBrackets } from "./CornerBrackets";

interface CountdownPanelProps {
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  goalsCompleted: number;
  totalGoals: number;
}

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

export function CountdownPanel({ projectStartDate, projectEndDate, goalsCompleted, totalGoals }: CountdownPanelProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { days, hours, minutes, seconds, progressPct, phase, color } = useMemo(() => {
    if (!projectEndDate) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, progressPct: 0, phase: "STANDBY", color: "rgba(160,210,255,0.4)" };
    }
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

    const remainingPct = 100 - pct;
    let phase = "PHASE AVANCEE";
    let color = "#f04040";
    if (remainingPct > 75) { phase = "PHASE INITIALE"; color = "#40c060"; }
    else if (remainingPct > 25) { phase = "PHASE INTERMEDIAIRE"; color = "#f0a030"; }

    return { days: d, hours: h, minutes: m, seconds: s, progressPct: pct, phase, color };
  }, [now, projectStartDate, projectEndDate]);

  if (!projectEndDate) return null;

  const ticks = [
    { label: "DEBUT", pct: 0 },
    { label: "25%", pct: 25 },
    { label: "50%", pct: 50 },
    { label: "75%", pct: 75 },
    { label: "FIN", pct: 100 },
  ];

  return (
    <div
      className="relative rounded p-4 md:p-5 overflow-hidden"
      style={{
        backgroundColor: "rgba(6,11,22,0.92)",
        border: `1px solid ${color}22`,
      }}
    >
      <CornerBrackets color={`${color}66`} />

      {/* Red tinted gradient bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 30% 40%, ${color}08, transparent)`,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={14} style={{ color }} />
          <span className="text-[9px] font-orbitron uppercase tracking-[0.15em]" style={{ color }}>
            ALERTE CRITIQUE
          </span>
          <span className="text-[rgba(160,210,255,0.15)] text-[9px]">—</span>
          <span className="text-[9px] font-orbitron uppercase tracking-[0.12em] text-[rgba(160,210,255,0.3)]">
            {phase}
          </span>
        </div>

        {/* Main countdown + operation box */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start">
          {/* Countdown */}
          <div className="flex-1">
            <div className="flex items-baseline gap-1 md:gap-2 justify-center md:justify-start">
              {[
                { val: days, label: "JOURS" },
                { val: hours, label: "HEURES" },
                { val: minutes, label: "MIN" },
                { val: seconds, label: "SEC" },
              ].map((t, i) => (
                <div key={t.label} className="flex flex-col items-center">
                  <span
                    className="text-3xl md:text-4xl font-mono font-black tabular-nums leading-none"
                    style={{ color }}
                  >
                    {pad(t.val)}
                  </span>
                  <span className="text-[7px] font-orbitron uppercase tracking-[0.12em] text-[rgba(160,210,255,0.3)] mt-1">
                    {t.label}
                  </span>
                  {i < 3 && (
                    <span className="absolute text-lg font-mono" style={{ color: `${color}44` }}>
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Status text */}
            <p className="text-[8px] font-mono uppercase tracking-[0.1em] text-[rgba(160,210,255,0.25)] mt-3 text-center md:text-left">
              PHASE EN COURS — COMPTE A REBOURS ACTIF
            </p>
          </div>

          {/* Operation box */}
          <div
            className="shrink-0 rounded px-4 py-3 w-full md:w-48"
            style={{
              backgroundColor: `${color}08`,
              border: `1px solid ${color}22`,
            }}
          >
            <p className="text-[8px] font-orbitron uppercase tracking-[0.12em] text-[rgba(160,210,255,0.3)]">
              OPERATION ASCENSION
            </p>
            <p className="text-xs font-orbitron font-bold text-[#ddeeff] mt-1">
              {goalsCompleted} / {totalGoals}
            </p>
            <p className="text-[8px] font-mono text-[rgba(160,210,255,0.25)] mt-0.5">
              OBJECTIFS COMPLETES
            </p>
            <div className="mt-2">
              <span
                className="inline-block text-[8px] font-orbitron uppercase tracking-[0.1em] px-2 py-0.5 rounded"
                style={{
                  color,
                  backgroundColor: `${color}15`,
                  border: `1px solid ${color}33`,
                }}
              >
                {progressPct > 75 ? "CRITIQUE" : progressPct > 25 ? "ATTENTION" : "STABLE"}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,180,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, #40c060, #f0a030, #f04040)`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            {ticks.map((t) => (
              <span key={t.label} className="text-[7px] font-mono text-[rgba(160,210,255,0.25)]">
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
