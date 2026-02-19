import { cn } from "@/lib/utils";
import { Rank } from "@/hooks/useRankXP";
import { useEffect, useRef, useState } from "react";

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
  const rankName = rank?.name || "Novice";
  const frameColor = rank?.frame_color || "#6b7280";
  const [animated, setAnimated] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Trigger animation on mount
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Derive a dimmed/glow version of the frame color
  const glowColor = frameColor + "55"; // ~33% alpha for glow
  const dimColor = frameColor + "22"; // subtle tint bg

  return (
    <div
      className={cn("relative flex flex-col gap-0 select-none", className)}
      style={{ fontFamily: "'Orbitron', 'Share Tech Mono', monospace" }}
    >
      {/* ── Top Row ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Decorative left accent bar */}
        <div
          className="w-[3px] h-8 rounded-full flex-shrink-0"
          style={{
            background: `linear-gradient(to bottom, ${frameColor}, transparent)`,
            boxShadow: `0 0 8px ${frameColor}`,
          }}
        />

        {/* Rank name with glow */}
        <span
          className="font-black text-lg md:text-xl tracking-[0.15em] uppercase leading-none"
          style={{
            color: frameColor,
            textShadow: `0 0 12px ${glowColor}, 0 0 24px ${glowColor}`,
            letterSpacing: "0.15em",
          }}
        >
          {rankName}
        </span>

        {/* Level badge — clipped hexagonal shape via clip-path */}
        <div className="relative flex-shrink-0 ml-1">
          <div
            className="relative px-2.5 py-[3px] text-[9px] font-black tracking-[0.2em] uppercase"
            style={{
              color: frameColor,
              background: dimColor,
              border: `1px solid ${frameColor}55`,
              clipPath: "polygon(6px 0%, calc(100% - 6px) 0%, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0% 50%)",
              boxShadow: `inset 0 0 8px ${glowColor}`,
            }}
          >
            LVL&nbsp;{level}
          </div>
        </div>
      </div>

      {/* ── Progress Bar ─────────────────────────────────────── */}
      {!hideProgress && (
        <div className="mt-3 flex flex-col gap-1.5">
          {/* XP label + percentage */}
          <div className="flex items-center justify-between px-[2px]">
            <span className="text-[9px] tracking-[0.2em] uppercase opacity-60" style={{ color: frameColor }}>
              XP Progress
            </span>
            <span
              className="text-[9px] tracking-[0.1em] font-bold tabular-nums"
              style={{ color: frameColor, opacity: 0.8 }}
            >
              {Math.round(progressToNext)}%
            </span>
          </div>

          {/* Track */}
          <div
            className="relative h-[6px] w-full rounded-none overflow-hidden"
            style={{
              background: dimColor,
              boxShadow: `inset 0 0 0 1px ${frameColor}22`,
            }}
          >
            {/* Filled portion */}
            <div
              ref={barRef}
              className="absolute inset-y-0 left-0 transition-[width] duration-[1200ms] ease-out"
              style={{
                width: animated ? `${progressToNext}%` : "0%",
                background: `linear-gradient(90deg, ${frameColor}88, ${frameColor})`,
                boxShadow: `0 0 8px ${frameColor}, 0 0 16px ${glowColor}`,
              }}
            />

            {/* Animated shimmer sweep */}
            <div
              className="absolute inset-y-0 left-0 pointer-events-none"
              style={{
                width: animated ? `${progressToNext}%` : "0%",
                transition: "width 1200ms ease-out",
                overflow: "hidden",
              }}
            >
              <div
                className="absolute inset-y-0 w-12"
                style={{
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)`,
                  animation: "shimmer-sweep 2.4s ease-in-out 0.8s infinite",
                }}
              />
            </div>

            {/* Tick marks every 25% */}
            {[25, 50, 75].map((pct) => (
              <div
                key={pct}
                className="absolute top-0 bottom-0 w-px"
                style={{
                  left: `${pct}%`,
                  background: `${frameColor}33`,
                }}
              />
            ))}
          </div>

          {/* Segment dots */}
          <div className="flex justify-between px-[1px]">
            {[0, 25, 50, 75, 100].map((pct) => (
              <div
                key={pct}
                className="w-[5px] h-[5px] rounded-full transition-all duration-700"
                style={{
                  background: progressToNext >= pct ? frameColor : `${frameColor}22`,
                  boxShadow: progressToNext >= pct ? `0 0 6px ${frameColor}` : "none",
                  transitionDelay: `${pct * 8}ms`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Shimmer keyframe injection */}
      <style>{`
        @keyframes shimmer-sweep {
          0%   { transform: translateX(-100%); }
          60%  { transform: translateX(350%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
