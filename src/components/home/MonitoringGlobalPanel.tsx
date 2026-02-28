import { useMemo } from "react";
import { CornerBrackets } from "./CornerBrackets";
import { differenceInDays, format } from "date-fns";

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
  label,
  sublabel,
  completed,
  total,
  color,
  trackColor,
}: {
  label: string;
  sublabel: string;
  completed: number;
  total: number;
  color: string;
  trackColor: string;
}) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[130px] h-[130px]">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke={trackColor} strokeWidth="6" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-mono font-bold tabular-nums" style={{ color }}>
            {Math.round(pct)}%
          </span>
          <span className="text-[8px] font-orbitron uppercase tracking-[0.15em] text-[rgba(160,210,255,0.4)]">
            {label}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-orbitron uppercase tracking-[0.12em] text-[rgba(160,210,255,0.5)]">
        {sublabel}
      </span>
      <span className="text-[9px] font-mono text-[rgba(160,210,255,0.3)] tabular-nums">
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
      className="relative overflow-hidden border border-[rgba(0,180,255,0.08)] backdrop-blur-xl"
      style={{
        borderRadius: 4,
        background: "rgba(6,11,22,0.92)",
        boxShadow: "0 8px 48px rgba(0,0,0,0.9), inset 0 1px 0 rgba(0,212,255,0.06)",
      }}
    >
      <CornerBrackets />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,210,255,0.12)] to-transparent" />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-[rgba(0,180,255,0.06)]">
        <span className="text-[10px] font-orbitron uppercase tracking-[0.15em] text-[rgba(160,210,255,0.4)]">
          // MONITORING GLOBAL — CYCLE ACTUEL
        </span>
      </div>

      {/* Gauges */}
      <div className="px-5 py-6 flex items-start justify-around flex-wrap gap-6">
        <CircularGauge
          label="GOALS" sublabel="OBJECTIFS"
          completed={data.goalsCompleted} total={data.totalGoals}
          color="#00d4ff" trackColor="rgba(0,180,255,0.08)"
        />
        <CircularGauge
          label="STEPS" sublabel="ÉTAPES"
          completed={data.totalStepsCompleted} total={data.totalSteps}
          color="#f0b429" trackColor="rgba(240,180,41,0.08)"
        />
        <CircularGauge
          label="HABITS" sublabel="HABITUDES"
          completed={data.completedHabitChecks} total={data.totalHabitChecks}
          color="#00ff88" trackColor="rgba(0,255,136,0.08)"
        />
      </div>

      {/* Timeline */}
      {timeline && (
        <div className="px-5 pb-5">
          <div className="border-t border-[rgba(0,180,255,0.06)] pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-orbitron uppercase tracking-[0.12em] text-[rgba(160,210,255,0.35)]">
                TIMELINE DU CYCLE
              </span>
              <span className="text-[9px] font-mono text-primary tabular-nums">
                JOUR {timeline.elapsed}/{timeline.totalDays} — {timeline.phase}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[rgba(0,180,255,0.06)] overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${timeline.pct}%`,
                  background: "linear-gradient(90deg, #00d4ff, #0088cc)",
                  boxShadow: "0 0 10px rgba(0,212,255,0.3)",
                }}
              />
            </div>
            <div className="flex justify-between text-[8px] font-mono text-[rgba(160,210,255,0.2)]">
              {["J.01", "25%", "50%", "75%", "FIN"].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
