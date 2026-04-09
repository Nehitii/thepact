import { useMemo } from "react";
import { CornerBrackets } from "./CornerBrackets";
import { differenceInDays } from "date-fns";

interface MonitoringData {
  goalsCompleted: number;
  totalGoals: number;
  totalStepsCompleted: number;
  totalSteps: number;
  completedHabitChecks: number;
  totalHabitChecks: number;
}

interface MonitoringGlobalPanelProps {
  data: MonitoringData;
  projectStartDate?: string | null;
  projectEndDate?: string | null;
}

function CircularGauge({
  label, sublabel, completed, total, gradientId, gradientStops, textColor, textGlow,
}: {
  label: string; sublabel: string; completed: number; total: number;
  gradientId: string; gradientStops: [string, string]; textColor: string; textGlow: string;
}) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const dashArray = 190;
  const offset = dashArray - (pct / 100) * dashArray;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 100, height: 100 }}>
        <svg viewBox="0 0 100 100" width="100" height="100">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientStops[0]} />
              <stop offset="100%" stopColor={gradientStops[1]} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--nexus-track-bg)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={`url(#${gradientId})`} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={dashArray} strokeDashoffset={offset}
            style={{ transform: "rotate(135deg)", transformOrigin: "center", animation: "gaugeDraw 1.8s ease-out forwards" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 700, color: textColor, textShadow: textGlow }}>
            {Math.round(pct)}%
          </span>
          <span style={{ fontSize: 8, letterSpacing: 1, color: "var(--nexus-text-dim)", marginTop: 2, opacity: 0.7 }}>
            {label}
          </span>
        </div>
      </div>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: 3, color: "var(--nexus-text-dim)", textTransform: "uppercase" as const }}>
        {sublabel}
      </span>
      <span style={{ fontSize: 10, color: "var(--nexus-text-dim)", fontFamily: "'Share Tech Mono', monospace" }}>
        {completed}/{total} complétés
      </span>
    </div>
  );
}

export function MonitoringGlobalPanel({ data, projectStartDate, projectEndDate }: MonitoringGlobalPanelProps) {
  const timeline = useMemo(() => {
    if (!projectStartDate || !projectEndDate) return null;
    const start = new Date(projectStartDate);
    const end = new Date(projectEndDate);
    const now = new Date();
    const totalDays = Math.max(1, differenceInDays(end, start));
    const elapsed = Math.max(0, differenceInDays(now, start));
    const pct = Math.min(100, (elapsed / totalDays) * 100);
    const phase = pct < 25 ? "PHASE INITIALE" : pct < 50 ? "PHASE DE CROISIÈRE" : pct < 75 ? "PHASE AVANCÉE" : "PHASE FINALE";
    return { totalDays, elapsed, pct, phase };
  }, [projectStartDate, projectEndDate]);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: 4,
        background: "var(--nexus-bg)",
        border: "1px solid var(--nexus-border)",
        boxShadow: "var(--nexus-shadow)",
        backdropFilter: "blur(16px)",
        padding: 28,
      }}
    >
      <CornerBrackets />
      <div className="absolute top-0 left-0 right-0 h-px nexus-glow-top" />

      <div className="flex items-center gap-2 mb-4" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: 3, color: "var(--nexus-text-dim)", textTransform: "uppercase" as const }}>
        <span className="text-primary/60">//</span>
        Monitoring Global — Cycle Actuel
        <span className="flex-1 h-px" style={{ background: "linear-gradient(90deg, var(--nexus-separator), transparent)" }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-7">
        <CircularGauge label="GOALS" sublabel="Objectifs" completed={data.goalsCompleted} total={data.totalGoals} gradientId="g1" gradientStops={["#0080ff", "#00d4ff"]} textColor="#00d4ff" textGlow="0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" />
        <CircularGauge label="STEPS" sublabel="Étapes" completed={data.totalStepsCompleted} total={data.totalSteps} gradientId="g2" gradientStops={["#ff8c00", "#ffcc00"]} textColor="#ff8c00" textGlow="0 0 8px rgba(255,140,0,0.7), 0 0 30px rgba(255,140,0,0.25)" />
        <CircularGauge label="HABITS" sublabel="Habitudes" completed={data.completedHabitChecks} total={data.totalHabitChecks} gradientId="g3" gradientStops={["#00aa55", "#00ff88"]} textColor="#00ff88" textGlow="0 0 8px rgba(0,255,136,0.6), 0 0 24px rgba(0,255,136,0.2)" />
      </div>

      {timeline && (
        <div>
          <div className="flex justify-between items-center mb-[10px]">
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: 3, color: "var(--nexus-text-dim)", textTransform: "uppercase" as const }}>
              Timeline du Cycle
            </span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#00d4ff" }}>
              JOUR {timeline.elapsed}/{timeline.totalDays} — {timeline.phase}
            </span>
          </div>

          <div className="relative overflow-hidden" style={{ height: 22, background: "var(--nexus-track-bg)", border: "1px solid var(--nexus-border)", borderRadius: 2 }}>
            <div className="absolute top-0 left-0 h-full" style={{ width: `${timeline.pct}%`, background: "linear-gradient(90deg, rgba(0,80,200,0.22), rgba(0,212,255,0.42))", borderRight: "2px solid #00d4ff" }}>
              <div className="absolute top-0 right-[-1px] h-full" style={{ width: 2, background: "#00d4ff", boxShadow: "0 0 6px #00d4ff, 0 0 18px rgba(0,212,255,0.3)", animation: "timelineGlow 2s ease-in-out infinite" }} />
            </div>
          </div>

          <div className="flex justify-between mt-1.5">
            {[`J.1`, `J.${Math.round(timeline.totalDays * 0.25)}`, `▶ J.${timeline.elapsed}`, `J.${Math.round(timeline.totalDays * 0.75)}`, `J.${timeline.totalDays}`].map((m, i) => (
              <span key={m} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: 1, color: i === 2 ? "#00d4ff" : "var(--nexus-marker-dim)" }}>
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes gaugeDraw { from{stroke-dashoffset:190} }
        @keyframes timelineGlow {
          0%,100%{box-shadow:0 0 6px #00d4ff,0 0 18px rgba(0,212,255,0.3)}
          50%{box-shadow:0 0 14px #00d4ff,0 0 36px rgba(0,212,255,0.6)}
        }
      `}</style>
    </div>
  );
}
