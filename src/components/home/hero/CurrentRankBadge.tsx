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

  // Defer bar animation to avoid mount-flash glitch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Derived colours — all from frameColor, computed once
  const c = {
    full: frameColor,
    glow: `${frameColor}88`,
    mid: `${frameColor}44`,
    dim: `${frameColor}18`,
    text: `${frameColor}cc`,
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* ── Name + Level row ──────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Vertical accent bar */}
        <div
          className="w-[3px] h-7 rounded-full shrink-0"
          style={{
            background: `linear-gradient(to bottom, ${c.full}, transparent)`,
            boxShadow: `0 0 8px ${c.glow}`,
          }}
        />

        {/* Rank name */}
        <span
          className="font-orbitron font-black text-base md:text-lg tracking-[0.15em] uppercase leading-none"
          style={{
            color: c.full,
            filter: `drop-shadow(0 0 8px ${c.glow})`,
          }}
        >
          {rankName}
        </span>

        {/* Level chip — parallelogram shape */}
        <div
          className="px-2.5 py-[3px] font-orbitron font-black text-[9px] tracking-[0.2em] uppercase shrink-0"
          style={{
            color: c.full,
            background: c.dim,
            border: `1px solid ${c.mid}`,
            clipPath: "polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%)",
          }}
        >
          LVL {level}
        </div>
      </div>

      {/* ── Progress bar ──────────────────────────────────── */}
      {!hideProgress && (
        <div className="flex flex-col gap-1.5 pl-[7px]">
          {/* Track */}
          <div
            className="relative h-[5px] w-full overflow-hidden"
            style={{
              background: c.dim,
              border: `1px solid ${c.mid}`,
              clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)",
            }}
          >
            {/* Fill */}
            <div
              className="absolute top-0 bottom-0 left-0"
              style={{
                width: mounted ? `${progressToNext}%` : "0%",
                transition: mounted ? "width 1s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
                background: `linear-gradient(90deg, ${c.mid}, ${c.full})`,
                boxShadow: `0 0 6px ${c.glow}`,
              }}
            />
          </div>

          {/* Dot indicators */}
          <div className="flex justify-between">
            {[0, 25, 50, 75, 100].map((t) => (
              <div
                key={t}
                className="w-[5px] h-[5px] rounded-full"
                style={{
                  background: progressToNext >= t ? c.full : c.dim,
                  boxShadow: progressToNext >= t ? `0 0 5px ${c.full}` : "none",
                  transition: "background 0.5s, box-shadow 0.5s",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
