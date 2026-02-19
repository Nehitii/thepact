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

  // double rAF avoids mount-flash on CSS transition
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  // Scoped class name so multiple instances don't clash
  const uid = `crb-${rankName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  return (
    <div className={cn("flex flex-col gap-2.5 select-none", className)}>
      {/* ── Glitch CSS — real class so ::before/::after + attr(data-text) work ── */}
      <style>{`
        .${uid} {
          position: relative;
          display: inline-block;
        }
        .${uid}::before,
        .${uid}::after {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          overflow: hidden;
          opacity: 0;
          font: inherit;
          color: inherit;
          letter-spacing: inherit;
          text-transform: inherit;
          pointer-events: none;
        }
        .${uid}::before {
          color: #ff003c;
          clip-path: polygon(0 18%, 100% 18%, 100% 42%, 0 42%);
          animation: ${uid}-g1 5.5s infinite;
        }
        .${uid}::after {
          color: #00d4ff;
          clip-path: polygon(0 58%, 100% 58%, 100% 80%, 0 80%);
          animation: ${uid}-g2 5.5s infinite;
        }
        @keyframes ${uid}-g1 {
          0%,87%,100% { opacity:0; transform:none; }
          89%  { opacity:.75; transform:translateX(-3px); }
          91%  { opacity:0; }
          93%  { opacity:.5; transform:translateX(2px); }
          95%  { opacity:0; }
        }
        @keyframes ${uid}-g2 {
          0%,87%,100% { opacity:0; transform:none; }
          90%  { opacity:.65; transform:translateX(3px); }
          92%  { opacity:0; }
          94%  { opacity:.45; transform:translateX(-2px); }
          96%  { opacity:0; }
        }
      `}</style>

      {/* ── Name + Level row ──────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Accent column: diamond pip + gradient bar */}
        <div className="flex flex-col items-center shrink-0" style={{ width: 3 }}>
          <div
            style={{
              width: 7,
              height: 7,
              background: frameColor,
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              boxShadow: `0 0 6px ${frameColor}`,
            }}
          />
          <div
            style={{
              width: 3,
              height: 28,
              background: `linear-gradient(to bottom, ${frameColor}, transparent)`,
              boxShadow: `0 0 8px ${c.glow}`,
            }}
          />
        </div>

        {/* Rank name with glitch via real CSS class */}
        <span
          className={`${uid} font-orbitron font-black text-base md:text-lg tracking-[0.15em] uppercase leading-none`}
          data-text={rankName}
          style={{
            color: c.full,
            filter: `drop-shadow(0 0 8px ${c.glow})`,
          }}
        >
          {rankName}
        </span>

        {/* Level chip — parallelogram */}
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
            <div
              className="absolute top-0 bottom-0 left-0"
              style={{
                width: mounted ? `${progressToNext}%` : "0%",
                transition: mounted ? "width 1.1s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
                background: `linear-gradient(90deg, ${frameColor}55, ${frameColor})`,
                boxShadow: `0 0 6px ${c.glow}`,
              }}
            >
              <div
                className="absolute top-0 left-0 right-0"
                style={{
                  height: 1,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
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
