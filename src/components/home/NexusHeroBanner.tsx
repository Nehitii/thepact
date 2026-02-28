import { useMemo } from "react";
import { CornerBrackets } from "./CornerBrackets";

interface NexusHeroBannerProps {
  progression: number;
  level: number;
  totalMissions: number;
  activeDays: number;
}

export function NexusHeroBanner({ progression, level, totalMissions, activeDays }: NexusHeroBannerProps) {
  const stats = useMemo(() => [
    { value: `${Math.round(progression)}%`, label: "PROGRESSION" },
    { value: `LVL ${level}`, label: "RANG" },
    { value: String(totalMissions), label: "MISSIONS" },
    { value: String(activeDays), label: "JOURS ACTIFS" },
  ], [progression, level, totalMissions, activeDays]);

  return (
    <div
      className="relative rounded p-6 md:p-8"
      style={{
        backgroundColor: "rgba(6,11,22,0.92)",
        border: "1px solid rgba(0,180,255,0.08)",
      }}
    >
      <CornerBrackets />

      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff33] to-transparent" />

      <div className="flex flex-col items-center text-center space-y-5">
        {/* Hexagon icon */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon
              points="50,3 93,25 93,75 50,97 7,75 7,25"
              fill="rgba(0,212,255,0.06)"
              stroke="#00d4ff"
              strokeWidth="1.5"
            />
            <text
              x="50"
              y="56"
              textAnchor="middle"
              className="font-orbitron"
              fill="#00d4ff"
              fontSize="32"
              fontWeight="700"
            >
              N
            </text>
          </svg>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-4xl md:text-5xl font-orbitron font-black tracking-tight leading-none">
            <span className="text-[#ddeeff]">NEXUS</span>
            <span className="text-[#00d4ff]">OS</span>
          </h1>
          <p className="text-[8px] md:text-[9px] font-orbitron uppercase tracking-[0.25em] text-[rgba(160,210,255,0.3)] mt-2">
            Neural Execution & Unified Experience System
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-lg pt-2">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-orbitron font-bold text-[#00d4ff] tabular-nums leading-none">
                {s.value}
              </span>
              <span className="text-[8px] font-orbitron uppercase tracking-[0.18em] text-[rgba(160,210,255,0.35)] mt-1.5">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
