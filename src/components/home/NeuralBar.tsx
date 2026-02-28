import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Pact } from "@/hooks/usePact";
import { RankXPData } from "@/hooks/useRankXP";
import { BondIcon } from "@/components/ui/bond-icon";

interface NeuralBarProps {
  pact: Pact;
  rankData: RankXPData;
  bondBalance?: number;
}

export function NeuralBar({ pact, rankData, bondBalance = 0 }: NeuralBarProps) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { currentRank, nextRank, currentXP } = rankData;
  const currentRankMin = currentRank?.min_points || 0;
  const nextRankMin = nextRank?.min_points || currentRankMin + 1000;
  const isMaxRank = !nextRank && rankData.ranks.length > 0;
  const xpSpan = nextRankMin - currentRankMin;
  const xpProgress = isMaxRank ? 100 : xpSpan > 0 ? Math.min(((currentXP - currentRankMin) / xpSpan) * 100, 100) : 0;
  const frameColor = currentRank?.frame_color ?? "#00d4ff";

  const timeStr = format(now, "HH:mm:ss");
  const dateStr = format(now, "EEE dd MMM yyyy", { locale: fr }).toUpperCase();

  const pactCode = useMemo(() => {
    if (!pact.id) return "0000";
    return pact.id.slice(0, 4).toUpperCase();
  }, [pact.id]);

  return (
    <div className="sticky top-0 z-[100] w-full">
      <div
        className="h-12 flex items-center justify-between px-4 backdrop-blur-[20px]"
        style={{
          backgroundColor: "rgba(2,4,10,0.97)",
          borderBottom: "1px solid rgba(0,180,255,0.10)",
        }}
      >
        {/* Left: SYS + XP bar + Pact name */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-[9px] font-orbitron font-bold uppercase tracking-[0.2em] text-[#00d4ff]">
            SYS
          </span>
          {/* Inline XP bar */}
          <div className="w-16 h-[3px] rounded-full bg-[rgba(0,180,255,0.1)] overflow-hidden shrink-0">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${xpProgress}%`, backgroundColor: frameColor }}
            />
          </div>
          <span className="text-[10px] font-orbitron font-bold uppercase tracking-[0.12em] text-[#ddeeff] truncate">
            {pact.name}
          </span>
          <span className="text-[9px] font-mono text-[rgba(160,210,255,0.25)] tracking-tight hidden sm:inline">
            #{pactCode}
          </span>
        </div>

        {/* Center: Clock */}
        <div className="flex flex-col items-center shrink-0 px-4">
          <span className="text-[14px] font-mono font-bold text-[#00d4ff] tabular-nums tracking-wide leading-none">
            {timeStr}
          </span>
          <span className="text-[8px] font-mono text-[rgba(160,210,255,0.3)] tracking-[0.15em] leading-none mt-0.5">
            {dateStr}
          </span>
        </div>

        {/* Right: Bonds + Customize */}
        <div className="flex items-center gap-3 shrink-0 flex-1 justify-end">
          <div className="flex items-center gap-1.5">
            <BondIcon size={14} />
            <span className="text-[11px] font-mono font-bold text-[#f0c050] tabular-nums">
              {bondBalance.toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[rgba(0,180,255,0.15)] bg-[rgba(0,180,255,0.04)] hover:bg-[rgba(0,180,255,0.08)] transition-colors"
          >
            <Settings size={12} className="text-[rgba(160,210,255,0.5)]" />
            <span className="text-[9px] font-orbitron uppercase tracking-[0.12em] text-[rgba(160,210,255,0.5)] hidden sm:inline">
              Customize
            </span>
          </button>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="h-[2px] w-full" style={{ backgroundColor: "rgba(2,4,10,0.97)" }}>
        <div
          className="h-full transition-all duration-1000 ease-out"
          style={{
            width: `${xpProgress}%`,
            backgroundColor: frameColor,
            boxShadow: `0 0 8px ${frameColor}66`,
          }}
        />
      </div>

      {/* Scanline sweep */}
      <div className="absolute bottom-0 left-0 h-px w-full overflow-hidden pointer-events-none">
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
