import { useMemo } from "react";
import { Pact } from "@/hooks/usePact";
import { RankXPData } from "@/hooks/useRankXP";

interface NeuralBarProps {
  pact: Pact;
  rankData: RankXPData;
}

function fmt(n: number) {
  return n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : n.toLocaleString();
}

export function NeuralBar({ pact, rankData }: NeuralBarProps) {
  const { currentRank, nextRank, currentXP } = rankData;

  const level = useMemo(() => {
    if (!currentRank || !rankData.ranks.length) return 1;
    const index = rankData.ranks.findIndex((r) => r.id === currentRank.id);
    return index >= 0 ? index + 1 : 1;
  }, [currentRank, rankData.ranks]);

  const rankName = currentRank?.name ?? "Novice";
  const frameColor = currentRank?.frame_color ?? "#00d4ff";

  const isMaxRank = !nextRank && rankData.ranks.length > 0;
  const currentRankMin = currentRank?.min_points || 0;
  const nextRankMin = nextRank?.min_points || currentRankMin + 1000;
  const xpSpan = nextRankMin - currentRankMin;
  const xpProgress = isMaxRank ? 100 : xpSpan > 0 ? Math.min(((currentXP - currentRankMin) / xpSpan) * 100, 100) : 0;

  return (
    <div className="sticky top-0 z-[100] w-full">
      <div
        className="h-12 flex items-center justify-between px-5 backdrop-blur-[20px]"
        style={{
          backgroundColor: "rgba(2,4,10,0.97)",
          borderBottom: "1px solid rgba(0,180,255,0.10)",
        }}
      >
        {/* Left: Pact name */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[11px] font-orbitron font-bold uppercase tracking-[0.15em] text-[#ddeeff] truncate">
            {pact.name}
          </span>
          {pact.mantra && (
            <>
              <span className="text-[rgba(160,210,255,0.15)]">|</span>
              <span className="text-[10px] text-[rgba(160,210,255,0.35)] uppercase tracking-[0.15em] truncate hidden sm:inline">
                {pact.mantra}
              </span>
            </>
          )}
        </div>

        {/* Right: Rank + XP */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] font-orbitron font-bold uppercase tracking-[0.15em]"
            style={{ color: frameColor }}
          >
            {rankName}
          </span>
          <span className="text-[rgba(160,210,255,0.15)] text-[10px]">//</span>
          <span className="text-[10px] font-mono text-[rgba(160,210,255,0.5)] tabular-nums tracking-tight">
            LVL {level}
          </span>
          <span className="text-[rgba(160,210,255,0.15)] text-[10px]">//</span>
          <span className="text-[10px] font-mono text-[rgba(160,210,255,0.5)] tabular-nums tracking-tight">
            {fmt(currentXP)} XP
          </span>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="h-[2px] w-full bg-[rgba(0,180,255,0.06)]" style={{ backgroundColor: "rgba(2,4,10,0.97)" }}>
        <div
          className="h-full transition-all duration-1000 ease-out"
          style={{
            width: `${xpProgress}%`,
            backgroundColor: frameColor,
            boxShadow: `0 0 8px ${frameColor}66`,
          }}
        />
      </div>

      {/* Animated scanline sweep */}
      <div
        className="absolute bottom-0 left-0 h-px w-full overflow-hidden pointer-events-none"
      >
        <div
          className="h-full w-1/3 animate-[scanline_4s_linear_infinite]"
          style={{
            background: `linear-gradient(90deg, transparent, ${frameColor}40, transparent)`,
          }}
        />
      </div>
    </div>
  );
}
