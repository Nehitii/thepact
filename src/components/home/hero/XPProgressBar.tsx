"use client";

import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : n.toLocaleString();
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

// ─── component ───────────────────────────────────────────────────────────────

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
  // Defer fill animation until after first paint — avoids width-jump glitch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const progress = useMemo(() => {
    if (isMaxRank) return 100;
    const span = nextRankXP - currentRankXP;
    if (span === 0) return 0;
    return Math.min(Math.max(((currentXP - currentRankXP) / span) * 100, 0), 100);
  }, [currentXP, currentRankXP, nextRankXP, isMaxRank]);

  const xpInRank = currentXP - currentRankXP;
  const xpSpan = nextRankXP - currentRankXP;
  const xpNeeded = nextRankXP - currentXP;

  // Colour derivations — all computed once from frameColor
  const c = {
    full: frameColor,
    glow: `${frameColor}99`, // 60 % alpha
    mid: `${frameColor}44`, // 27 %
    dim: `${frameColor}18`, // 9  %
    text: `${frameColor}bb`, // 73 %
  };

  // ── MAX RANK ────────────────────────────────────────────────────────────────
  if (isMaxRank) {
    return (
      <div className={cn("w-full max-w-3xl mx-auto", className)}>
        <MaxRankBanner color={c.full} />
      </div>
    );
  }

  // ── NORMAL ──────────────────────────────────────────────────────────────────
  return (
    <div className={cn("w-full max-w-3xl mx-auto space-y-2", className)}>
      {/* ── Header ──────────────────────────────────────────────── */}
      {showLabels && (
        <div className="flex items-end justify-between gap-3">
          {/* Destination */}
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-orbitron text-[9px] tracking-[0.3em] uppercase shrink-0" style={{ color: c.text }}>
              next
            </span>
            <span
              className="font-orbitron font-black text-sm md:text-base tracking-[0.12em] uppercase truncate"
              style={{ color: c.full, filter: `drop-shadow(0 0 8px ${c.glow})` }}
            >
              {nextRankName}
            </span>
          </div>

          {/* XP counters */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[10px] tabular-nums" style={{ color: c.text }}>
              {fmt(xpInRank)}
              <span style={{ color: c.mid }}>/</span>
              {fmt(xpSpan)}
            </span>
            <Chip color={c.full}>-{fmt(xpNeeded)} xp</Chip>
          </div>
        </div>
      )}

      {/* ── Track + Fill ────────────────────────────────────────── */}
      <div className="relative h-5">
        {/* Outer border frame — clipped corners give cyberpunk feel */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: "polygon(6px 0%, calc(100% - 6px) 0%, 100% 100%, 0% 100%)",
            background: c.dim,
            border: `1px solid ${c.mid}`,
          }}
        />

        {/* Scanline grid ticks */}
        {[25, 50, 75].map((p) => (
          <div
            key={p}
            className="absolute top-0 bottom-0 w-px z-10"
            style={{ left: `${p}%`, background: `${frameColor}25` }}
          />
        ))}

        {/* Fill — width transition only, no transform, no mixed origin */}
        <div
          className="absolute top-0 bottom-0 left-0 overflow-hidden"
          style={{
            width: mounted ? `${progress}%` : "0%",
            transition: mounted ? "width 1.1s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            clipPath: "polygon(6px 0%, calc(100% - 6px) 0%, 100% 100%, 0% 100%)",
          }}
        >
          {/* Gradient fill */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg,
                ${frameColor}50 0%,
                ${frameColor}90 50%,
                ${frameColor}   100%)`,
            }}
          />
          {/* Flowing shimmer — uses background-position, not transform */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(90deg,
                transparent 0%,
                ${frameColor}55 50%,
                transparent 100%)`,
              backgroundSize: "50% 100%",
              backgroundRepeat: "no-repeat",
              animation: "xp-shimmer 2.2s linear infinite",
            }}
          />
          {/* Top highlight edge */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${frameColor}, transparent)` }}
          />
        </div>

        {/* Tip orb — positioned absolutely, independent layer */}
        {progress > 1 && (
          <div
            className="absolute top-1/2 z-20 pointer-events-none"
            style={{
              left: mounted ? `${progress}%` : "0%",
              transform: "translate(-50%, -50%)",
              transition: mounted ? "left 1.1s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            }}
          >
            {/* Halo ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                width: 20,
                height: 20,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle, ${c.mid} 0%, transparent 70%)`,
                animation: "orb-pulse 2s ease-in-out infinite",
              }}
            />
            {/* Core dot */}
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: `0 0 6px 2px ${c.full}, 0 0 14px 4px ${c.glow}`,
              }}
            />
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      {showLabels && (
        <div className="flex items-center justify-between px-0.5">
          <div className="flex gap-0 flex-1">
            {[0, 25, 50, 75, 100].map((t, i) => (
              <div
                key={t}
                className="flex-1 flex"
                style={{ justifyContent: i === 0 ? "flex-start" : i === 4 ? "flex-end" : "center" }}
              >
                <span
                  className="font-orbitron text-[8px] tabular-nums"
                  style={{ color: frameColor, opacity: progress >= t ? 0.45 : 0.13 }}
                >
                  {t}%
                </span>
              </div>
            ))}
          </div>
          <span
            className="font-orbitron font-black text-xs tracking-widest ml-4 tabular-nums"
            style={{ color: c.full, filter: `drop-shadow(0 0 6px ${c.glow})` }}
          >
            {Math.round(progress)}%
          </span>
        </div>
      )}

      <style>{`
        @keyframes xp-shimmer {
          0%   { background-position: -50% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes orb-pulse {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1);   }
          50%       { opacity: 1.0; transform: translate(-50%, -50%) scale(1.6); }
        }
      `}</style>
    </div>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="font-orbitron font-bold text-[9px] tracking-widest uppercase px-2 py-[3px] rounded-sm"
      style={{
        color,
        background: `${color}15`,
        border: `1px solid ${color}40`,
      }}
    >
      {children}
    </span>
  );
}

function MaxRankBanner({ color }: { color: string }) {
  return (
    <div
      className="relative overflow-hidden flex items-center justify-center gap-3 px-6 py-3 rounded-sm"
      style={{
        background: `linear-gradient(90deg, transparent, ${color}12, transparent)`,
        border: `1px solid ${color}40`,
      }}
    >
      {/* Sweep */}
      <div
        className="absolute inset-y-0 w-32 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
          animation: "max-sweep 3s ease-in-out infinite",
        }}
      />
      <Diamond color={color} />
      <span
        className="font-orbitron font-black text-xs sm:text-sm tracking-[0.3em] uppercase z-10"
        style={{ color, filter: `drop-shadow(0 0 10px ${color})` }}
      >
        Max Rank Achieved
      </span>
      <Diamond color={color} />
      <style>{`
        @keyframes max-sweep {
          0%   { left: -8rem; }
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
