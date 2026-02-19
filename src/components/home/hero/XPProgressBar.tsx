"use client";

import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// ─── inline texture assets ───────────────────────────────────────────────────

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg width='20' height='12' viewBox='0 0 20 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0L20 6L10 12L0 6Z' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`;

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : n.toLocaleString();
}

function deriveColors(hex: string) {
  return {
    full: hex,
    glow: `${hex}99`,
    mid: `${hex}44`,
    dim: `${hex}18`,
    text: `${hex}99`,
  };
}

// ─── types ───────────────────────────────────────────────────────────────────

interface XPProgressBarProps {
  currentXP: number;
  currentRankXP: number;
  nextRankXP: number;
  nextRankName: string;
  isMaxRank: boolean;
  frameColor?: string;
  className?: string;
  showLabels?: boolean;
}

// ─── main component ──────────────────────────────────────────────────────────

export function XPProgressBar({
  currentXP,
  currentRankXP,
  nextRankXP,
  nextRankName,
  isMaxRank,
  frameColor = "#00ffa3",
  className,
  showLabels = true,
}: XPProgressBarProps) {
  // double rAF: guarantees CSS transition fires after first paint (no glitch)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const progress = useMemo(() => {
    if (isMaxRank) return 100;
    const span = nextRankXP - currentRankXP;
    if (span === 0) return 0;
    return Math.min(Math.max(((currentXP - currentRankXP) / span) * 100, 0), 100);
  }, [currentXP, currentRankXP, nextRankXP, isMaxRank]);

  const c = deriveColors(frameColor);
  const xpInRank = currentXP - currentRankXP;
  const xpSpan = nextRankXP - currentRankXP;
  const xpNeeded = nextRankXP - currentXP;
  const displayPct = mounted ? progress : 0;
  const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
  const tx = `width 1.2s ${easing}`;
  const txLeft = `left 1.2s ${easing}`;

  if (isMaxRank) return <MaxRankBanner color={c.full} />;

  return (
    <div className={cn("w-full space-y-2", className)}>
      {/* ── Header ──────────────────────────────────────────── */}
      {showLabels && (
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-orbitron text-[9px] tracking-[0.3em] uppercase shrink-0" style={{ color: c.text }}>
              next
            </span>
            <span
              className="font-orbitron font-black text-sm tracking-[0.12em] uppercase truncate"
              style={{ color: c.full, filter: `drop-shadow(0 0 8px ${c.glow})` }}
            >
              {nextRankName}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[10px] tabular-nums" style={{ color: c.text }}>
              {fmt(xpInRank)}
              <span style={{ color: c.mid }}>/</span>
              {fmt(xpSpan)}
            </span>
            <span
              className="font-orbitron font-bold text-[9px] tracking-widest uppercase px-2 py-[3px]"
              style={{
                color: c.full,
                background: c.dim,
                border: `1px solid ${c.mid}`,
                clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)",
              }}
            >
              -{fmt(xpNeeded)} xp
            </span>
          </div>
        </div>
      )}

      {/* ── Progress track ──────────────────────────────────── */}
      <div className="relative" style={{ height: 14 }}>
        {/* Track shell — clipped, contains fill layers */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: "polygon(8px 0%, calc(100% - 8px) 0%, 100% 100%, 0% 100%)",
            background: "#060f18",
            borderTop: `1px solid ${c.mid}`,
            borderBottom: `1px solid ${c.dim}`,
          }}
        >
          {/* Faint grid columns */}
          {[25, 50, 75].map((p) => (
            <div
              key={p}
              className="absolute top-0 bottom-0 w-px"
              style={{ left: `${p}%`, background: `${frameColor}18` }}
            />
          ))}

          {/* ── Fill ── */}
          <div className="absolute top-0 bottom-0 left-0" style={{ width: `${displayPct}%`, transition: tx }}>
            {/* 1) Base colour gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, ${frameColor}55 0%, ${frameColor}99 55%, ${frameColor} 100%)`,
              }}
            />

            {/* 2) Hex mesh texture */}
            <div
              className="absolute inset-0 opacity-[0.13]"
              style={{ backgroundImage: HEX_PATTERN, backgroundSize: "20px 12px" }}
            />

            {/* 3) Horizontal scanlines */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 3px)",
              }}
            />

            {/* 4) Shimmer sweep (background-position, no transform) */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
                backgroundSize: "40% 100%",
                backgroundRepeat: "no-repeat",
                animation: "xp-shimmer 2.8s ease-in-out infinite",
              }}
            />

            {/* 5) Top gloss edge */}
            <div
              className="absolute top-0 left-0 right-0"
              style={{
                height: 2,
                background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.65), ${frameColor}, transparent)`,
              }}
            />
          </div>
        </div>

        {/* ── Orb tip — own stacking layer, NOT inside the clipped track ── */}
        {progress > 1 && (
          <div
            className="absolute top-1/2 z-10 pointer-events-none"
            style={{ left: `${displayPct}%`, transform: "translate(-50%, -50%)", transition: txLeft }}
          >
            {/* Expanding halo ring */}
            <div
              className="absolute rounded-full"
              style={{
                width: 28,
                height: 28,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle, ${c.mid} 0%, transparent 70%)`,
                animation: "orb-halo 2s ease-in-out infinite",
              }}
            />
            {/* Inner ring */}
            <div
              className="absolute rounded-full"
              style={{
                width: 16,
                height: 16,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                border: `1.5px solid ${c.mid}`,
                animation: "orb-ring 2s ease-in-out infinite",
              }}
            />
            {/* Core sphere */}
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: `radial-gradient(circle at 35% 30%, #fff 0%, ${frameColor} 55%, ${frameColor}88 100%)`,
                boxShadow: `0 0 6px ${frameColor}, 0 0 12px ${c.glow}, 0 0 20px ${c.mid}`,
              }}
            />
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      {showLabels && (
        <>
          <div className="flex items-center justify-between px-0.5">
            <span className="font-mono text-[10px] tabular-nums" style={{ color: c.text }}>
              {currentXP.toLocaleString()} XP
            </span>
            <span
              className="font-orbitron font-black text-[10px] tracking-widest tabular-nums"
              style={{ color: c.full, filter: `drop-shadow(0 0 6px ${c.glow})` }}
            >
              {Math.round(progress)}%
            </span>
            <span className="font-mono text-[10px] tabular-nums" style={{ color: c.text }}>
              {nextRankXP.toLocaleString()} XP
            </span>
          </div>

          {/* Diamond tick markers */}
          <div className="flex justify-between px-1">
            {[0, 25, 50, 75, 100].map((t) => (
              <div key={t} className="flex flex-col items-center gap-1">
                <div
                  className="w-[5px] h-[5px] rotate-45 transition-all duration-500"
                  style={{
                    background: progress >= t ? frameColor : c.dim,
                    boxShadow: progress >= t ? `0 0 5px ${frameColor}` : "none",
                  }}
                />
                <span
                  className="font-mono text-[8px] transition-colors duration-500"
                  style={{ color: progress >= t ? c.text : `${frameColor}25` }}
                >
                  {t === 0 ? "0" : `${t}%`}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes xp-shimmer {
          0%   { background-position: -40% 0; }
          100% { background-position: 220% 0; }
        }
        @keyframes orb-halo {
          0%, 100% { opacity: 0.5; transform: translate(-50%,-50%) scale(1);   }
          50%       { opacity: 0;   transform: translate(-50%,-50%) scale(1.8); }
        }
        @keyframes orb-ring {
          0%, 100% { opacity: 0.7; transform: translate(-50%,-50%) scale(1);   }
          50%       { opacity: 0.2; transform: translate(-50%,-50%) scale(1.4); }
        }
      `}</style>
    </div>
  );
}

// ─── MaxRankBanner ────────────────────────────────────────────────────────────

function MaxRankBanner({ color }: { color: string }) {
  const c = deriveColors(color);
  return (
    <div
      className="relative overflow-hidden flex items-center justify-center gap-3 px-6 py-3"
      style={{
        background: `linear-gradient(90deg, transparent, ${c.dim}, transparent)`,
        border: `1px solid ${c.mid}`,
        clipPath: "polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)",
      }}
    >
      <div
        className="absolute inset-y-0 w-20 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${c.mid}, transparent)`,
          animation: "max-sweep 3s ease-in-out infinite",
        }}
      />
      <Diamond color={color} />
      <span
        className="font-orbitron font-black text-sm tracking-[0.3em] uppercase z-10"
        style={{ color, filter: `drop-shadow(0 0 10px ${color})` }}
      >
        Max Rank Achieved
      </span>
      <Diamond color={color} />
      <style>{`
        @keyframes max-sweep {
          0%   { left: -5rem; }
          60%  { left: calc(100% + 2rem); }
          100% { left: calc(100% + 2rem); }
        }
      `}</style>
    </div>
  );
}

function Diamond({ color }: { color: string }) {
  return (
    <div className="w-2.5 h-2.5 rotate-45 shrink-0 z-10" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
  );
}
