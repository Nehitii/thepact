import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface HealthECGLineProps {
  /** 0-100. Modulates BPM and amplitude. */
  score?: number;
  /** Stroke color (CSS). Defaults to phosphor. */
  color?: string;
  /** Background grid? */
  grid?: boolean;
  /** Aspect: thin (hero) or compact (inline) */
  variant?: "hero" | "compact" | "mini";
  className?: string;
  /** Show running data points */
  showPulse?: boolean;
}

/**
 * Score-reactive ECG sinusoid SVG.
 * - 80+ score → fast, regular QRS complex (healthy 75 BPM feel)
 * - 50-79 → moderate, slight irregularity (60 BPM feel)
 * - <50 → slow, weak amplitude (40 BPM feel — degraded)
 *
 * Pure CSS animation (transform: translateX) for performance.
 */
export function HealthECGLine({
  score = 75,
  color,
  grid = false,
  variant = "hero",
  className,
  showPulse = true,
}: HealthECGLineProps) {
  const stroke = color || "hsl(var(--hud-phosphor))";

  const config = useMemo(() => {
    if (variant === "mini") return { height: 24, width: 120, ampMul: 0.6 };
    if (variant === "compact") return { height: 48, width: 320, ampMul: 0.85 };
    return { height: 64, width: 800, ampMul: 1 };
  }, [variant]);

  // BPM → animation duration (one cycle = 1 heartbeat)
  // 80+ score → 0.85s/cycle (≈70 BPM), 50-79 → 1.1s, <50 → 1.6s
  const cycleDuration = score >= 80 ? 0.85 : score >= 50 ? 1.1 : 1.6;
  const amplitude = (score >= 80 ? 14 : score >= 50 ? 10 : 6) * config.ampMul;

  // Build a single QRS heartbeat path that we'll repeat horizontally
  // Each unit = 80px wide. PQRST waveform.
  const qrsWidth = 80;
  const repeats = Math.ceil((config.width * 2) / qrsWidth) + 1;
  const cy = config.height / 2;

  const buildHeartbeat = (offsetX: number) => {
    const x = offsetX;
    // Flat baseline (0-30) → P wave (30-40) → flat (40-45) → QRS spike (45-60) → flat (60-70) → T wave (70-80)
    return `
      M ${x},${cy}
      L ${x + 25},${cy}
      Q ${x + 30},${cy - amplitude * 0.25} ${x + 35},${cy}
      L ${x + 42},${cy}
      L ${x + 46},${cy + amplitude * 0.4}
      L ${x + 50},${cy - amplitude * 1.4}
      L ${x + 54},${cy + amplitude * 0.35}
      L ${x + 58},${cy}
      L ${x + 65},${cy}
      Q ${x + 72},${cy - amplitude * 0.5} ${x + 78},${cy}
      L ${x + 80},${cy}
    `;
  };

  const fullPath = Array.from({ length: repeats }, (_, i) =>
    buildHeartbeat(i * qrsWidth)
  ).join(" ");

  const totalScrollWidth = repeats * qrsWidth;

  return (
    <div
      className={cn("relative overflow-hidden motion-reduce:opacity-50", className)}
      style={{ height: config.height }}
      aria-hidden="true"
    >
      {/* Background grid */}
      {grid && (
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(${stroke}15 1px, transparent 1px),
              linear-gradient(90deg, ${stroke}15 1px, transparent 1px)
            `,
            backgroundSize: "20px 16px",
          }}
        />
      )}

      {/* Edge fade gradients */}
      <div
        className="absolute inset-y-0 left-0 w-16 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, hsl(var(--background)) 0%, transparent 100%)`,
        }}
      />
      <div
        className="absolute inset-y-0 right-0 w-16 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(270deg, hsl(var(--background)) 0%, transparent 100%)`,
        }}
      />

      {/* Animated ECG path */}
      <div
        className="absolute inset-0 motion-reduce:hidden"
        style={{
          width: totalScrollWidth,
          animation: `health-ecg-scroll ${cycleDuration * (totalScrollWidth / qrsWidth) / 4}s linear infinite`,
        }}
      >
        <svg
          width={totalScrollWidth}
          height={config.height}
          viewBox={`0 0 ${totalScrollWidth} ${config.height}`}
          className="block"
          preserveAspectRatio="none"
        >
          {/* Baseline glow */}
          <line
            x1="0"
            y1={cy}
            x2={totalScrollWidth}
            y2={cy}
            stroke={stroke}
            strokeWidth="0.5"
            opacity="0.15"
          />
          {/* Main ECG */}
          <path
            d={fullPath}
            fill="none"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 4px ${stroke})` }}
          />
          {/* Echo trail */}
          <path
            d={fullPath}
            fill="none"
            stroke={stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.15"
            style={{ filter: `blur(2px)` }}
          />
        </svg>
      </div>

      {/* Static fallback for motion-reduce */}
      <div className="absolute inset-0 hidden motion-reduce:block">
        <svg
          width="100%"
          height={config.height}
          viewBox={`0 0 ${qrsWidth * 4} ${config.height}`}
          preserveAspectRatio="none"
        >
          <path
            d={Array.from({ length: 4 }, (_, i) => buildHeartbeat(i * qrsWidth)).join(" ")}
            fill="none"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Live cursor / scanning beam */}
      {showPulse && (
        <div
          className="absolute top-0 bottom-0 w-[2px] motion-reduce:hidden z-[5]"
          style={{
            left: "82%",
            background: `linear-gradient(180deg, transparent, ${stroke}, transparent)`,
            boxShadow: `0 0 8px ${stroke}, 0 0 16px ${stroke}`,
            animation: `health-ecg-cursor-pulse ${cycleDuration}s ease-in-out infinite`,
          }}
        />
      )}
    </div>
  );
}
