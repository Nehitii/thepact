"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Rank } from "@/hooks/useRankXP";

interface CurrentRankBadgeProps {
  rank: Rank | null;
  level: number;
  currentXP: number;
  progressToNext: number;
  className?: string;
  hideProgress?: boolean;
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

export function CurrentRankBadge({
  rank,
  level,
  currentXP,
  progressToNext,
  className,
  hideProgress = false,
}: CurrentRankBadgeProps) {
  const rankName = rank?.name ?? "Novice";
  const frameColor = rank?.frame_color ?? "#6b7280";
  const c = deriveColors(frameColor);

  // double rAF: avoids mount flash on transition
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={cn("flex flex-col gap-2.5 select-none", className)}>
      {/* ── Rank name + Level ──────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Accent column: top diamond + gradient bar */}
        <div className="flex flex-col items-center gap-0 shrink-0" style={{ width: 3 }}>
          {/* Diamond pip */}
          <div
            style={{
              width: 7,
              height: 7,
              background: frameColor,
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              boxShadow: `0 0 6px ${frameColor}`,
              flexShrink: 0,
            }}
          />
          {/* Bar */}
          <div
            style={{
              width: 3,
              height: 28,
              background: `linear-gradient(to bottom, ${frameColor}, transparent)`,
              boxShadow: `0 0 8px ${c.glow}`,
            }}
          />
        </div>

        {/* Name with periodic glitch */}
        <span
          className="font-orbitron font-black text-base md:text-lg tracking-[0.15em] uppercase leading-none relative"
          data-text={rankName}
          style={{
            color: c.full,
            filter: `drop-shadow(0 0 8px ${c.glow})`,
          }}
        >
          {rankName}
          {/* CSS glitch ghost layers via pseudo — injected inline for portability */}
          <style>{`
            .rank-glitch::before, .rank-glitch::after {
              content: attr(data-text);
              position: absolute;
              top: 0; left: 0;
              overflow: hidden;
            }
            .rank-glitch::before {
              color: #ff003c;
              clip-path: polygon(0 20%, 100% 20%, 100% 45%, 0 45%);
              animation: rg1 5s infinite;
              opacity: 0;
            }
            .rank-glitch::after {
              color: #00d4ff;
              clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%);
              animation: rg2 5s infinite;
              opacity: 0;
            }
            @keyframes rg1 { 0%,88%,100%{opacity:0;transform:none} 90%{opacity:.7;transform:translateX(-3px)} 92%{opacity:0} 94%{opacity:.5;transform:translateX(2px)} 96%{opacity:0} }
            @keyframes rg2 { 0%,88%,100%{opacity:0;transform:none} 91%{opacity:.6;transform:translateX(3px)} 93%{opacity:0} 95%{opacity:.4;transform:translateX(-2px)} 97%{opacity:0} }
          `}</style>
        </span>

        {/* Level chip */}
        <div
          className="font-orbitron font-black text-[9px] tracking-[0.22em] uppercase px-2.5 py-[4px] shrink-0"
          style={{
            color: c.full,
            background: c.dim,
            border: `1px solid ${c.mid}`,
            clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
            boxShadow: `inset 0 0 8px ${c.dim}`,
          }}
        >
          LVL&nbsp;{level}
        </div>
      </div>

      {/* ── Mini progress bar ──────────────────────────────── */}
      {!hideProgress && (
        <div className="flex flex-col gap-1.5 pl-4">
          {/* Track */}
          <div
            className="relative overflow-hidden"
            style={{
              height: 5,
              background: "#060f18",
              borderTop: `1px solid ${c.mid}`,
              borderBottom: `1px solid ${c.dim}`,
              clipPath: "polygon(4px 0%, calc(100% - 4px) 0%, 100% 100%, 0% 100%)",
            }}
          >
            {/* Fill */}
            <div
              className="absolute top-0 bottom-0 left-0"
              style={{
                width: mounted ? `${progressToNext}%` : "0%",
                transition: mounted ? "width 1.1s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
                background: `linear-gradient(90deg, ${frameColor}55, ${frameColor})`,
                boxShadow: `0 0 6px ${c.glow}`,
              }}
            >
              {/* Top gloss */}
              <div
                className="absolute top-0 left-0 right-0"
                style={{
                  height: 1,
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)`,
                }}
              />
            </div>
          </div>

          {/* Diamond tick dots */}
          <div className="flex justify-between">
            {[0, 25, 50, 75, 100].map((t) => (
              <div
                key={t}
                className="transition-all duration-500"
                style={{
                  width: 5,
                  height: 5,
                  background: progressToNext >= t ? frameColor : c.dim,
                  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                  boxShadow: progressToNext >= t ? `0 0 5px ${frameColor}` : "none",
                  transitionDelay: `${t * 5}ms`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
