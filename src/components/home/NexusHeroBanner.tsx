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
    { value: `${Math.round(progression)}%`, label: "PROGRESSION", color: "#00d4ff", glow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" },
    { value: `LVL ${level}`, label: "RANG", color: "#00d4ff", glow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" },
    { value: String(totalMissions), label: "MISSIONS", color: "#00d4ff", glow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" },
    { value: String(activeDays), label: "JOURS ACTIFS", color: "#ff8c00", glow: "0 0 8px rgba(255,140,0,0.7), 0 0 30px rgba(255,140,0,0.25)" },
  ], [progression, level, totalMissions, activeDays]);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        backgroundColor: "rgba(6,11,22,0.92)",
        border: "1px solid rgba(0,180,255,0.12)",
        borderRadius: 4,
        boxShadow: "0 8px 48px rgba(0,0,0,0.9), inset 0 1px 0 rgba(0,212,255,0.06)",
        padding: "48px 40px",
        textAlign: "center",
      }}
    >
      <CornerBrackets />

      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,210,255,0.4), transparent)" }} />

      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,212,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.028) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      {/* Hero glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500, height: 250,
          background: "radial-gradient(ellipse, rgba(0,90,200,0.09) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Hexagon logo */}
        <div
          className="flex items-center justify-center mb-5"
          style={{
            width: 60, height: 60,
            background: "linear-gradient(135deg, #0070ff, #00d4ff)",
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 20,
            color: "#020407",
            fontWeight: 700,
            boxShadow: "0 0 14px rgba(0,212,255,0.8), 0 0 50px rgba(0,212,255,0.2)",
            animation: "logoPulse 4s ease-in-out infinite",
          }}
        >
          N
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "clamp(32px, 6vw, 68px)",
            fontWeight: 900,
            letterSpacing: 10,
            textTransform: "uppercase" as const,
            color: "#ddeeff",
            animation: "glitchReveal 1.6s ease-out forwards",
            lineHeight: 1,
          }}
        >
          NEXUS<span style={{ color: "#00d4ff", textShadow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" }}>OS</span>
        </h1>

        <p
          style={{
            fontWeight: 200,
            fontSize: 12,
            letterSpacing: 6,
            color: "rgba(160,210,255,0.5)",
            textTransform: "uppercase" as const,
            marginTop: 10,
          }}
        >
          Neural Execution & Unified Experience System
        </p>

        {/* Stats row */}
        <div className="flex justify-center flex-wrap" style={{ gap: 48, marginTop: 32 }}>
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 24,
                  color: s.color,
                  textShadow: s.glow,
                }}
              >
                {s.value}
              </span>
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: 3,
                  color: "rgba(160,210,255,0.5)",
                  textTransform: "uppercase" as const,
                  marginTop: 4,
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes logoPulse {
          0%,100%{box-shadow:0 0 14px rgba(0,212,255,0.8),0 0 50px rgba(0,212,255,0.2)}
          50%{box-shadow:0 0 24px rgba(0,212,255,1),0 0 80px rgba(0,212,255,0.4)}
        }
        @keyframes glitchReveal {
          0%{opacity:0;clip-path:inset(0 100% 0 0)}
          60%{clip-path:inset(0 0 0 0)}
          65%{clip-path:inset(3px 0 0 0);transform:skewX(-1deg)}
          70%{clip-path:inset(0 0 0 0);transform:skewX(0)}
          75%{clip-path:inset(6px 0 2px 0)}
          80%{clip-path:inset(0 0 0 0)}
          100%{opacity:1}
        }
      `}</style>
    </div>
  );
}
