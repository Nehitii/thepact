import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Pact } from "@/hooks/usePact";
import { RankXPData } from "@/hooks/useRankXP";

interface NeuralBarProps {
  pact: Pact;
  rankData: RankXPData;
}

export function NeuralBar({ pact, rankData }: NeuralBarProps) {
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

  const timeStr = format(now, "HH:mm:ss");
  const dateStr = format(now, "EEE dd MMM yyyy", { locale: fr }).toUpperCase();

  return (
    <div className="sticky top-0 z-[100] w-full">
      {/* Main bar */}
      <header
        className="h-12 flex items-center justify-between px-6 overflow-hidden relative"
        style={{
          background: "rgba(2,4,10,0.97)",
          borderBottom: "1px solid rgba(0,210,255,0.4)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Scanline sweep */}
        <div
          className="absolute bottom-0 h-px pointer-events-none"
          style={{
            width: "60%",
            background: "linear-gradient(90deg, transparent, #00d4ff, transparent)",
            animation: "scanline 4s linear infinite",
            left: "-100%",
          }}
        />

        {/* Left: SYS + progress + coords */}
        <div className="flex items-center gap-3 flex-1">
          <span
            className="uppercase"
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9,
              color: "rgba(160,210,255,0.5)",
              letterSpacing: 2,
            }}
          >
            SYS
          </span>

          {/* Global progress track */}
          <div
            className="overflow-hidden shrink-0"
            style={{
              width: 120,
              height: 4,
              background: "rgba(0,212,255,0.07)",
              borderRadius: 2,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${xpProgress}%`,
                background: "linear-gradient(90deg, #0070ff, #00d4ff)",
                boxShadow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)",
                animation: "pulseBar 3s ease-in-out infinite",
              }}
            />
          </div>

          {/* Coords */}
          <span
            className="hidden sm:inline"
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9,
              color: "rgba(0,212,255,0.22)",
              letterSpacing: 1,
            }}
          >
            LAT 48.8566°N // LON 2.3522°E
          </span>
        </div>

        {/* Center: Clock */}
        <div className="flex-1 text-center">
          <div
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 15,
              color: "#00d4ff",
              textShadow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)",
              letterSpacing: 3,
            }}
          >
            {timeStr}
          </div>
          <div
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 8,
              color: "rgba(160,210,255,0.5)",
              letterSpacing: 3,
              textTransform: "uppercase" as const,
              marginTop: 1,
            }}
          >
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
                  className="rounded-[1px]"
                  style={{
                    width: 3,
                    height: h,
                    background: "#00d4ff",
                    animation: `freqAnim 0.8s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
            <span
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 9,
                color: "rgba(0,212,255,0.28)",
              }}
            >
              2.4GHz
            </span>
          </div>

          {/* Customize button */}
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 cursor-pointer uppercase transition-all hover:shadow-[0_0_8px_rgba(0,212,255,0.7),0_0_30px_rgba(0,212,255,0.25)]"
            style={{
              padding: "6px 14px",
              background: "rgba(0,212,255,0.05)",
              border: "1px solid rgba(0,210,255,0.4)",
              borderRadius: 4,
              color: "#00d4ff",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10,
              letterSpacing: 2,
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
