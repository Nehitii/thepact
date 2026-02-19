"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const NOISE_TEXTURE =
  "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%221%22/%3E%3C/svg%3E')";

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

function formatXP(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

export function XPProgressBar({
  currentXP,
  currentRankXP,
  nextRankXP,
  nextRankName,
  isMaxRank,
  frameColor = "#00d4ff",
  className,
  showLabels = true,
}: XPProgressBarProps) {
  const [animated, setAnimated] = useState(false);
  const prevProgress = useRef(0);

  const progress = useMemo(() => {
    if (isMaxRank) return 100;
    if (nextRankXP - currentRankXP === 0) return 0;
    const p = ((currentXP - currentRankXP) / (nextRankXP - currentRankXP)) * 100;
    return Math.min(Math.max(p, 0), 100);
  }, [currentXP, currentRankXP, nextRankXP, isMaxRank]);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, []);

  const displayProgress = animated ? progress : prevProgress.current;

  const xpRemaining = nextRankXP - currentXP;
  const xpInRank = currentXP - currentRankXP;
  const xpRankSpan = nextRankXP - currentRankXP;

  // Derive secondary colors from frameColor
  const glowStrong = frameColor + "cc";
  const glowMid = frameColor + "55";
  const glowSoft = frameColor + "22";

  // ── MAX RANK ──────────────────────────────────────────────────────────────
  if (isMaxRank) {
    return (
      <div className={cn("w-full max-w-3xl mx-auto", className)}>
        <div
          className="relative overflow-hidden p-4 rounded-xl flex items-center justify-center gap-3"
          style={{
            background: `linear-gradient(135deg, ${glowSoft}, transparent 60%)`,
            border: `1px solid ${glowMid}`,
            boxShadow: `0 0 32px ${glowSoft}, inset 0 0 32px ${glowSoft}`,
          }}
        >
          {/* Animated scan line */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to right, transparent 0%, ${glowMid} 50%, transparent 100%)`,
              animation: "scan-line 2.5s ease-in-out infinite",
            }}
          />
          <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: frameColor }} />
          <span
            className="font-orbitron font-black tracking-[0.25em] text-xs sm:text-sm uppercase"
            style={{
              color: frameColor,
              textShadow: `0 0 16px ${glowStrong}`,
            }}
          >
            Max Rank Achieved
          </span>
          <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: frameColor }} />
        </div>

        <style>{`
          @keyframes scan-line {
            0%   { transform: translateX(-100%); }
            60%  { transform: translateX(200%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  // ── NORMAL ────────────────────────────────────────────────────────────────
  return (
    <div className={cn("w-full max-w-3xl mx-auto space-y-2.5", className)}>
      {/* ── Header ── */}
      {showLabels && (
        <div className="flex items-center justify-between gap-2 px-0.5">
          {/* Left: destination rank */}
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 flex-shrink-0 opacity-70" style={{ color: frameColor }} />
            <span
              className="font-orbitron text-[9px] uppercase tracking-[0.25em] opacity-50"
              style={{ color: frameColor }}
            >
              Towards
            </span>
            <span
              className="font-orbitron font-black text-xs sm:text-sm tracking-[0.15em] uppercase"
              style={{
                color: frameColor,
                textShadow: `0 0 14px ${glowStrong}`,
              }}
            >
              {nextRankName}
            </span>
          </div>

          {/* Right: XP counters */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tabular-nums opacity-50" style={{ color: frameColor }}>
              {formatXP(xpInRank)} / {formatXP(xpRankSpan)}
            </span>

            {/* "Needed" chip */}
            <div
              className="px-2 py-[2px] rounded font-orbitron font-bold text-[9px] tracking-widest uppercase tabular-nums"
              style={{
                color: frameColor,
                background: glowSoft,
                border: `1px solid ${glowMid}`,
                boxShadow: `inset 0 0 6px ${glowSoft}`,
              }}
            >
              -{formatXP(xpRemaining)}
            </div>
          </div>
        </div>
      )}

      {/* ── Bar ── */}
      <div className="relative w-full" style={{ height: "20px" }}>
        {/* Track */}
        <div
          className="absolute inset-0 rounded-sm overflow-hidden"
          style={{
            background: "#0a0e1a",
            border: `1px solid ${glowSoft}`,
            boxShadow: `inset 0 2px 8px rgba(0,0,0,0.7)`,
          }}
        >
          {/* Subtle grid lines */}
          {[20, 40, 60, 80].map((pct) => (
            <div
              key={pct}
              className="absolute top-0 bottom-0 w-px"
              style={{ left: `${pct}%`, background: `${frameColor}18` }}
            />
          ))}
        </div>

        {/* Fill */}
        <div
          className="absolute top-0 bottom-0 left-0 rounded-sm overflow-hidden transition-[width] duration-[1100ms] ease-out"
          style={{ width: `${displayProgress}%` }}
        >
          {/* Core gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, ${frameColor}44 0%, ${frameColor}bb 55%, ${frameColor} 100%)`,
            }}
          />
          {/* Animated fluid flow */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${frameColor}55 50%, transparent 100%)`,
              backgroundSize: "60% 100%",
              animation: "fluid-flow 2s linear infinite",
            }}
          />
          {/* Noise grain */}
          <div className="absolute inset-0 opacity-15 mix-blend-overlay" style={{ backgroundImage: NOISE_TEXTURE }} />
          {/* Top gloss line */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${frameColor}cc, transparent)`,
            }}
          />
        </div>

        {/* Tip glow orb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-20 transition-[left] duration-[1100ms] ease-out pointer-events-none"
          style={{ left: `${displayProgress}%` }}
        >
          {/* Outer halo */}
          <div
            className="absolute rounded-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-0"
            style={{
              width: 28,
              height: 28,
              background: `radial-gradient(circle, ${glowMid} 0%, transparent 70%)`,
              animation: "pulse-halo 1.8s ease-in-out infinite",
            }}
          />
          {/* Core orb */}
          <div
            className="absolute rounded-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-0 border-2"
            style={{
              width: 12,
              height: 12,
              background: `radial-gradient(circle at 35% 35%, #fff, ${frameColor})`,
              borderColor: frameColor,
              boxShadow: `0 0 10px ${frameColor}, 0 0 20px ${glowMid}`,
              animation: "pulse-orb 1.8s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* ── Footer ── */}
      {showLabels && (
        <div className="flex items-center justify-between px-0.5">
          {/* Tick labels */}
          <div className="flex gap-0 w-full">
            {[0, 25, 50, 75, 100].map((t, i) => (
              <div
                key={t}
                className="flex-1 flex"
                style={{ justifyContent: i === 0 ? "flex-start" : i === 4 ? "flex-end" : "center" }}
              >
                <span
                  className="font-orbitron text-[8px] tabular-nums transition-all duration-700"
                  style={{
                    color: frameColor,
                    opacity: progress >= t ? 0.5 : 0.15,
                  }}
                >
                  {t}%
                </span>
              </div>
            ))}
          </div>

          {/* Sync % */}
          <span
            className="font-orbitron font-black text-[10px] tracking-widest uppercase ml-4 tabular-nums flex-shrink-0"
            style={{
              color: frameColor,
              textShadow: `0 0 10px ${glowStrong}`,
            }}
          >
            {Math.round(progress)}%
          </span>
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes fluid-flow {
          0%   { background-position: -60% 0; }
          100% { background-position: 160% 0; }
        }
        @keyframes pulse-halo {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50%       { opacity: 1;   transform: translate(-50%, -50%) scale(1.3); }
        }
        @keyframes pulse-orb {
          0%, 100% { box-shadow: 0 0 10px ${frameColor}, 0 0 20px ${glowMid}; }
          50%       { box-shadow: 0 0 16px ${frameColor}, 0 0 32px ${glowMid}; }
        }
        @keyframes scan-line {
          0%   { transform: translateX(-100%); }
          60%  { transform: translateX(200%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
