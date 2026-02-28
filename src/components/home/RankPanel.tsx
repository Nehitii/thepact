import { useMemo } from "react";
import { RankXPData } from "@/hooks/useRankXP";
import { CornerBrackets } from "./CornerBrackets";

interface RankPanelProps {
  rankData: RankXPData;
  className?: string;
}

function fmtXP(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)} ${n >= 1000 ? "" : ""}`.trim().replace(/(\d)/, "$1").replace(".", " ").replace(/\s+/g, " ") : String(n);
}

function formatNum(n: number) {
  return n.toLocaleString("fr-FR");
}

export function RankPanel({ rankData, className = "" }: RankPanelProps) {
  const { currentRank, nextRank, currentXP, progressInCurrentRank, xpToNextRank, ranks } = rankData;

  const level = useMemo(() => {
    if (!currentRank || !ranks.length) return 1;
    const idx = ranks.findIndex((r) => r.id === currentRank.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [currentRank, ranks]);

  const rankName = currentRank?.name ?? "—";
  const frameColor = currentRank?.frame_color ?? "#00d4ff";
  const currentMin = currentRank?.min_points || 0;
  const nextMin = nextRank?.min_points || currentMin + 1000;

  // Segmented bar: 10 segments
  const segments = 10;
  const filledSegments = Math.round((progressInCurrentRank / 100) * segments);

  return (
    <div
      className={`relative rounded p-4 md:p-5 ${className}`}
      style={{
        backgroundColor: "rgba(6,11,22,0.92)",
        border: "1px solid rgba(0,180,255,0.08)",
      }}
    >
      <CornerBrackets />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff33] to-transparent" />

      {/* Top row: hex badge + rank info */}
      <div className="flex items-start gap-4 mb-4">
        {/* Hexagonal level badge */}
        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon
              points="50,5 91,27 91,73 50,95 9,73 9,27"
              fill="rgba(0,212,255,0.06)"
              stroke={frameColor}
              strokeWidth="2"
            />
            <text
              x="50" y="56"
              textAnchor="middle"
              fill={frameColor}
              fontSize="28"
              fontWeight="700"
              className="font-orbitron"
            >
              {level}
            </text>
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[8px] font-orbitron uppercase tracking-[0.15em] text-[rgba(160,210,255,0.3)]">
            TIER {level} — CLASSE {Math.ceil(level / 2)}
          </p>
          <h2 className="text-xl md:text-2xl font-orbitron font-black tracking-tight text-[#ddeeff] truncate mt-0.5">
            {rankName}
          </h2>
          <p className="text-[9px] font-orbitron uppercase tracking-[0.12em] text-[rgba(160,210,255,0.3)] mt-1">
            RANG ACTUEL
          </p>
        </div>
      </div>

      {/* XP readout */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-mono font-bold text-[#f0a030] tabular-nums">
            {formatNum(currentXP)}
          </span>
          <span className="text-[10px] font-mono text-[rgba(240,160,48,0.5)]">XP</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-mono font-bold text-[#00d4ff] tabular-nums">
            - {formatNum(xpToNextRank)} XP
          </span>
          <p className="text-[8px] font-orbitron uppercase tracking-[0.12em] text-[rgba(160,210,255,0.3)]">
            RESTANT
          </p>
        </div>
      </div>

      {/* Segmented XP bar */}
      <div className="mb-1">
        <div className="flex gap-[2px]">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-2 rounded-[1px] transition-colors duration-500"
              style={{
                backgroundColor: i < filledSegments ? frameColor : "rgba(0,180,255,0.08)",
                boxShadow: i < filledSegments ? `0 0 4px ${frameColor}44` : "none",
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] font-mono text-[rgba(160,210,255,0.25)]">0</span>
          <span className="text-[8px] font-mono text-[rgba(160,210,255,0.35)]">
            {Math.round(progressInCurrentRank)}%
          </span>
          <span className="text-[8px] font-mono text-[rgba(160,210,255,0.25)]">
            {formatNum(nextMin)} XP
          </span>
        </div>
      </div>

      {/* Next rank box */}
      {nextRank && (
        <div
          className="mt-3 rounded px-3 py-2 flex items-center justify-between"
          style={{
            backgroundColor: "rgba(0,180,255,0.04)",
            border: "1px solid rgba(0,180,255,0.08)",
          }}
        >
          <div>
            <p className="text-[8px] font-orbitron uppercase tracking-[0.12em] text-[rgba(160,210,255,0.3)]">
              PROCHAIN RANG
            </p>
            <p className="text-xs font-orbitron font-bold text-[#f0a030] mt-0.5">
              {nextRank.name} — LVL {level + 1}
            </p>
          </div>
          <span className="text-[10px] font-mono text-[rgba(160,210,255,0.4)]">
            {formatNum(nextMin)} XP
          </span>
        </div>
      )}
    </div>
  );
}
