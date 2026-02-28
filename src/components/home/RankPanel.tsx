import { useMemo } from "react";
import { RankXPData } from "@/hooks/useRankXP";
import { CornerBrackets } from "./CornerBrackets";

interface RankPanelProps {
  rankData: RankXPData;
  className?: string;
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
  const currentMin = currentRank?.min_points || 0;
  const nextMin = nextRank?.min_points || currentMin + 1000;

  // Split rank name for accent on last 2 chars
  const nameBase = rankName.length > 2 ? rankName.slice(0, -2) : "";
  const nameAccent = rankName.length > 2 ? rankName.slice(-2) : rankName;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        padding: 0,
        borderRadius: 4,
        border: "1px solid rgba(0,140,255,0.25)",
        background: "linear-gradient(160deg, rgba(0,15,40,0.97) 0%, rgba(3,8,20,0.99) 100%)",
        boxShadow: "0 8px 48px rgba(0,0,0,0.9), inset 0 1px 0 rgba(0,212,255,0.06)",
      }}
    >
      <CornerBrackets />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,210,255,0.4), transparent)" }} />

      {/* Header: Hex + Identity */}
      <div className="flex items-start gap-5" style={{ padding: "20px 24px 0" }}>
        {/* Hexagon SVG */}
        <div className="relative shrink-0">
          <svg
            viewBox="0 0 80 92"
            style={{
              width: 80, height: 92,
              filter: "drop-shadow(0 0 8px rgba(0,212,255,0.5))",
              animation: "hexPulse 4s ease-in-out infinite",
            }}
          >
            <defs>
              <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0040aa" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0090cc" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="hexStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0080ff" />
                <stop offset="100%" stopColor="#00d4ff" />
              </linearGradient>
            </defs>
            <polygon points="40,4 76,23 76,69 40,88 4,69 4,23" fill="url(#hexGrad)" stroke="url(#hexStroke)" strokeWidth="1.5" />
            <polygon points="40,12 68,27 68,65 40,80 12,65 12,27" fill="none" stroke="rgba(0,212,255,0.2)" strokeWidth="1" />
            <polygon points="40,4 52,10 52,18 40,12 28,18 28,10" fill="rgba(0,212,255,0.15)" />
            <polygon points="40,88 52,82 52,74 40,80 28,74 28,82" fill="rgba(0,212,255,0.08)" />
            <line x1="12" y1="46" x2="68" y2="46" stroke="rgba(0,212,255,0.1)" strokeWidth="1" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 22, fontWeight: 900,
                color: "#00d4ff",
                lineHeight: 1,
              }}
            >
              {level}
            </span>
            <span
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 7, letterSpacing: 2,
                color: "rgba(0,212,255,0.5)",
                textTransform: "uppercase" as const,
              }}
            >
              LEVEL
            </span>
          </div>
        </div>

        {/* Identity info */}
        <div className="flex-1" style={{ paddingTop: 6 }}>
          <div
            className="flex items-center gap-1.5"
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 8, letterSpacing: 3,
              color: "rgba(0,212,255,0.45)",
              textTransform: "uppercase" as const,
              marginBottom: 6,
            }}
          >
            <span style={{ width: 16, height: 1, background: "rgba(0,212,255,0.35)", display: "inline-block" }} />
            TIER {Math.ceil(level / 10)} · CLASSE S
          </div>

          <div
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 22, fontWeight: 900,
              letterSpacing: 4,
              color: "#ddeeff",
              textTransform: "uppercase" as const,
              lineHeight: 1,
            }}
          >
            {nameBase}<span style={{ color: "#00d4ff", textShadow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" }}>{nameAccent}</span>
          </div>

          {/* Divider */}
          <div style={{ width: "100%", height: 1, background: "linear-gradient(90deg, rgba(0,212,255,0.3), rgba(0,212,255,0.05), transparent)", margin: "14px 0" }} />

          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "rgba(160,210,255,0.5)", letterSpacing: 2, lineHeight: 1.8 }}>
            RANG ACTUEL<br />
            <span style={{ color: "#ddeeff", fontSize: 11 }}>{rankName} · Classe Neurale S</span>
          </div>
        </div>
      </div>

      {/* XP Section */}
      <div style={{ padding: "0 24px 20px" }}>
        <div style={{ width: "100%", height: 1, background: "linear-gradient(90deg, rgba(0,212,255,0.3), rgba(0,212,255,0.05), transparent)", margin: "16px 0 10px" }} />

        {/* XP numbers */}
        <div className="flex justify-between items-baseline" style={{ marginBottom: 10 }}>
          <div>
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 28, fontWeight: 700,
                color: "#00d4ff",
                textShadow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)",
                lineHeight: 1,
              }}
            >
              {formatNum(currentXP)}
            </span>
            <span
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 9, color: "rgba(160,210,255,0.5)",
                letterSpacing: 2, marginLeft: 4,
              }}
            >
              XP
            </span>
          </div>
          <div className="text-right">
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 11, color: "rgba(255,140,0,0.7)",
                letterSpacing: 1,
              }}
            >
              − {formatNum(xpToNextRank)} XP
            </div>
            <div
              style={{
                fontSize: 8, color: "rgba(160,210,255,0.5)",
                letterSpacing: 2, textTransform: "uppercase" as const,
                marginTop: 2,
              }}
            >
              RESTANT
            </div>
          </div>
        </div>

        {/* XP Bar - continuous with segments overlay */}
        <div className="relative" style={{ marginBottom: 8 }}>
          <div
            className="relative overflow-hidden"
            style={{
              height: 12,
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(0,212,255,0.12)",
              borderRadius: 1,
            }}
          >
            <div
              className="relative"
              style={{
                height: "100%",
                width: `${progressInCurrentRank}%`,
                background: "linear-gradient(90deg, #0044cc 0%, #0088ff 50%, #00d4ff 100%)",
                borderRadius: 1,
                animation: "xpShimmer 3s ease-in-out infinite",
              }}
            >
              {/* Segment overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: "repeating-linear-gradient(90deg, transparent 0px, transparent 14px, rgba(0,0,0,0.25) 14px, rgba(0,0,0,0.25) 16px)",
                }}
              />
              {/* Top shine */}
              <div
                className="absolute top-0 left-0 right-0"
                style={{
                  height: "40%",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.12), transparent)",
                  borderRadius: 1,
                }}
              />
              {/* Glow edge */}
              <div
                className="absolute top-0 right-0"
                style={{
                  width: 3, height: "100%",
                  background: "#00d4ff",
                  boxShadow: "0 0 8px rgba(0,212,255,1), 0 0 16px rgba(0,212,255,0.6)",
                  borderRadius: 1,
                  animation: "edgePulse 1.5s ease-in-out infinite",
                }}
              />
            </div>
            <span
              className="absolute"
              style={{
                top: "50%", right: 8,
                transform: "translateY(-50%)",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 8, color: "rgba(255,255,255,0.6)",
                letterSpacing: 1,
              }}
            >
              {Math.round(progressInCurrentRank)}%
            </span>
          </div>
        </div>

        {/* Bar labels */}
        <div
          className="flex justify-between"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 8, color: "rgba(160,210,255,0.5)",
            letterSpacing: 1,
          }}
        >
          <span>0</span>
          <span>{formatNum(nextMin)} XP</span>
        </div>

        {/* Next rank */}
        {nextRank && (
          <div
            className="relative flex items-center justify-between overflow-hidden"
            style={{
              marginTop: 14,
              padding: "10px 14px",
              background: "rgba(255,140,0,0.04)",
              border: "1px solid rgba(255,140,0,0.12)",
              borderRadius: 3,
            }}
          >
            {/* Left amber bar */}
            <div
              className="absolute top-0 left-0 bottom-0"
              style={{
                width: 3,
                background: "linear-gradient(180deg, #ff8c00, rgba(255,140,0,0.2))",
                boxShadow: "0 0 6px rgba(255,140,0,0.5)",
              }}
            />
            <div style={{ paddingLeft: 10 }}>
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 7, letterSpacing: 3,
                  color: "rgba(160,210,255,0.5)",
                  textTransform: "uppercase" as const,
                  marginBottom: 3,
                }}
              >
                PROCHAIN RANG
              </div>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 12, fontWeight: 700, letterSpacing: 3,
                  color: "#ff8c00",
                  textShadow: "0 0 8px rgba(255,140,0,0.7), 0 0 30px rgba(255,140,0,0.25)",
                  textTransform: "uppercase" as const,
                }}
              >
                {nextRank.name} · LVL {level + 1}
              </div>
            </div>
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 13, color: "rgba(255,140,0,0.6)",
                letterSpacing: 2,
              }}
            >
              <span style={{ color: "#ff8c00", fontSize: 16 }}>{formatNum(nextMin)}</span> XP
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes hexPulse {
          0%,100%{filter:drop-shadow(0 0 6px rgba(0,212,255,0.4))}
          50%{filter:drop-shadow(0 0 16px rgba(0,212,255,0.9)) drop-shadow(0 0 30px rgba(0,212,255,0.3))}
        }
        @keyframes xpShimmer {
          0%,100%{box-shadow:0 0 6px rgba(0,212,255,0.4)}
          50%{box-shadow:0 0 12px rgba(0,212,255,0.8), 0 0 24px rgba(0,212,255,0.2)}
        }
        @keyframes edgePulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
