import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Pact } from "@/hooks/usePact";
import { RankXPData } from "@/hooks/useRankXP";
import { BondIcon } from "@/components/ui/bond-icon";
import { useAuth } from "@/contexts/AuthContext";
import { useBondBalance } from "@/hooks/useShop";

interface NeuralBarProps {
  pact: Pact;
  rankData: RankXPData;
}

export function NeuralBar({ pact, rankData }: NeuralBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());

  const { data: bondBalanceData } = useBondBalance(user?.id);
  const bondBalance = bondBalanceData?.balance ?? 0;

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

  const timeStr = format(now, "HH:mm:ss");
  const dateStr = format(now, "EEE dd MMM yyyy", { locale: fr }).toUpperCase();

  return (
    <div className="sticky top-0 z-[100] w-full">
      {/* Main bar */}
      <header className="neural-bar h-12 flex items-center justify-between px-6 overflow-hidden relative backdrop-blur-xl">
        {/* Scanline sweep */}
        <div className="neural-bar-scanline absolute bottom-0 h-px pointer-events-none" />

        {/* Left: SYS + progress + coords */}
        <div className="flex items-center gap-3 flex-1">
          <span className="uppercase font-mono text-[9px] tracking-[2px] text-muted-foreground/60">
            SYS
          </span>

          {/* Global progress track */}
          <div
            className="overflow-hidden shrink-0 rounded-sm bg-primary/10"
            style={{ width: 120, height: 4 }}
          >
            <div
              className="h-full neural-bar-progress"
              style={{ width: `${xpProgress}%` }}
            />
          </div>

          {/* Pact name + ID */}
          <span className="hidden sm:inline truncate max-w-[200px] font-mono text-[9px] tracking-[1px] text-primary/35">
            {pact.name} // ID:{pact.id.slice(0, 8)}
          </span>
        </div>

        {/* Center: Clock */}
        <div className="flex-1 text-center">
          <div className="font-mono text-[15px] tracking-[3px] text-primary neural-bar-clock">
            {timeStr}
          </div>
          <div className="font-mono text-[8px] tracking-[3px] uppercase mt-px text-muted-foreground/60">
            {dateStr}
          </div>
        </div>

        {/* Right: Freq bars + Customize */}
        <div className="flex-1 flex justify-end items-center gap-4">
          {/* Freq indicator */}
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="flex gap-[2px] items-end h-[14px]">
              {[4, 8, 12, 6, 10].map((h, i) => (
                <div
                  key={i}
                  className="rounded-[1px] bg-primary"
                  style={{
                    width: 3,
                    height: h,
                    animation: `freqAnim 0.8s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
            <span className="font-mono text-[9px] text-primary/30">
              2.4GHz
            </span>
          </div>

          {/* Bond display */}
          <div className="hidden sm:flex items-center gap-1.5">
            <BondIcon size={14} />
            <span
              className="font-mono text-[11px] tracking-[1px]"
              style={{ color: "#ffcc00", textShadow: "0 0 6px rgba(255,204,0,0.4)" }}
            >
              {bondBalance.toLocaleString("fr-FR")}
            </span>
          </div>

          {/* Customize button */}
          <button
            onClick={() => navigate("/profile")}
            className="neural-bar-btn flex items-center gap-2 cursor-pointer uppercase transition-all font-mono text-[10px] tracking-[2px] text-primary rounded-[4px]"
            style={{
              padding: "6px 14px",
              clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
            }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
            CUSTOMIZE
          </button>
        </div>
      </header>

      {/* CSS keyframes */}
      <style>{`
        @keyframes scanline { to { left: 140%; } }
        @keyframes pulseBar { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes freqAnim { from{opacity:0.28;transform:scaleY(0.6)} to{opacity:0.9;transform:scaleY(1)} }
      `}</style>
    </div>
  );
}
