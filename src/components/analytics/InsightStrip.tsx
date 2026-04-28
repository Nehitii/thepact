import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useRef, MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { PrismSparkline } from "./PrismSparkline";
import { PrismAnimatedNumber } from "./PrismAnimatedNumber";

export interface VitalSign {
  id?: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: number;
  sparkline?: number[];
  accent?: "cyan" | "magenta" | "lime" | "violet" | "amber";
  /** Optional progress 0..1 — renders a discreet ring behind the icon */
  progress?: number;
  /** Numeric raw value used to drive AnimatedNumber when value is a number */
  rawNumber?: number;
  /** Optional formatter when rawNumber is provided */
  format?: (n: number) => string;
}

interface InsightStripProps {
  signs: VitalSign[];
  onSignClick?: (sign: VitalSign, index: number) => void;
}

const ACCENT_TEXT: Record<string, string> = {
  cyan: "prism-text-cyan",
  magenta: "prism-text-magenta",
  lime: "prism-text-lime",
  violet: "prism-text-violet",
  amber: "prism-text-amber",
};

const ACCENT_VAR: Record<string, string> = {
  cyan: "var(--prism-cyan)",
  magenta: "var(--prism-magenta)",
  lime: "var(--prism-lime)",
  violet: "var(--prism-violet)",
  amber: "var(--prism-amber)",
};

export function InsightStrip({ signs, onSignClick }: InsightStripProps) {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
      style={{ perspective: 800 }}
    >
      {signs.map((s, idx) => (
        <KpiCard key={s.label + idx} sign={s} index={idx} onClick={onSignClick} />
      ))}
    </div>
  );
}

interface KpiCardProps {
  sign: VitalSign;
  index: number;
  onClick?: (sign: VitalSign, index: number) => void;
}

function KpiCard({ sign, index, onClick }: KpiCardProps) {
  const Icon = sign.icon;
  const accent = sign.accent || "cyan";
  const hasDelta = typeof sign.delta === "number" && !isNaN(sign.delta);
  const TrendIcon =
    sign.delta && sign.delta > 0 ? TrendingUp : sign.delta && sign.delta < 0 ? TrendingDown : Minus;
  const trendColor =
    sign.delta && sign.delta > 0
      ? "prism-text-lime"
      : sign.delta && sign.delta < 0
        ? "prism-text-magenta"
        : "text-muted-foreground";

  // 3D tilt on hover (springed)
  const ref = useRef<HTMLButtonElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 200, damping: 18 });
  const sy = useSpring(my, { stiffness: 200, damping: 18 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-5, 5]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [4, -4]);

  const handleMove = (e: MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const handleLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const interactive = !!onClick;

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={interactive ? () => onClick!(sign, index) : undefined}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      style={{
        ["--prism-panel-border" as any]: ACCENT_VAR[accent],
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "prism-panel prism-kpi-tilt relative p-3.5 text-left w-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--prism-cyan))]/40",
        interactive ? "cursor-pointer" : "cursor-default",
      )}
      aria-label={
        interactive
          ? `${sign.label}: ${sign.value}. Open inspector.`
          : `${sign.label}: ${sign.value}`
      }
      tabIndex={interactive ? 0 : -1}
    >
      <span className="prism-corner-bracket tl" />
      <span className="prism-corner-bracket tr" />
      <span className="prism-corner-bracket bl" />
      <span className="prism-corner-bracket br" />

      <div
        className="relative flex items-center justify-between mb-2"
        style={{ transform: "translateZ(20px)" }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="relative inline-flex items-center justify-center h-4 w-4">
            {typeof sign.progress === "number" && (
              <ProgressRing progress={sign.progress} colorVar={ACCENT_VAR[accent]} />
            )}
            <Icon
              className={cn(
                "h-3 w-3 flex-shrink-0 relative",
                ACCENT_TEXT[accent],
              )}
            />
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80 truncate">
            {sign.label}
          </span>
        </div>
        {hasDelta && (
          <div className={cn("flex items-center gap-0.5 flex-shrink-0", trendColor)}>
            <TrendIcon className="h-2.5 w-2.5" />
            <span className="font-mono text-[9px] tabular-nums">
              {sign.delta! > 0 ? "+" : ""}
              {sign.delta!.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      <div
        className="relative flex items-end justify-between gap-2"
        style={{ transform: "translateZ(15px)" }}
      >
        <p
          className={cn(
            "font-mono font-bold text-xl md:text-2xl tabular-nums leading-none truncate",
            ACCENT_TEXT[accent],
          )}
        >
          {typeof sign.rawNumber === "number" ? (
            <PrismAnimatedNumber value={sign.rawNumber} format={sign.format} />
          ) : (
            sign.value
          )}
        </p>

        {sign.sparkline && (
          <PrismSparkline
            values={sign.sparkline.slice(-10)}
            color={ACCENT_VAR[accent]}
            width={64}
            height={20}
          />
        )}
      </div>

      {/* Inspector hint dot */}
      {interactive && (
        <span
          aria-hidden
          className="absolute top-1.5 right-1.5 h-1 w-1 rounded-full opacity-50 group-hover:opacity-100"
          style={{
            background: `hsl(${ACCENT_VAR[accent]})`,
            boxShadow: `0 0 4px hsl(${ACCENT_VAR[accent]} / 0.7)`,
          }}
        />
      )}
    </motion.button>
  );
}

function ProgressRing({ progress, colorVar }: { progress: number; colorVar: string }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  const dash = c * Math.max(0, Math.min(1, progress));
  return (
    <svg
      className="absolute inset-0 -m-1.5 h-7 w-7"
      viewBox="0 0 18 18"
      aria-hidden
    >
      <circle
        cx="9"
        cy="9"
        r={r}
        fill="none"
        stroke={`hsl(${colorVar} / 0.18)`}
        strokeWidth="1"
      />
      <circle
        cx="9"
        cy="9"
        r={r}
        fill="none"
        stroke={`hsl(${colorVar})`}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 9 9)"
        style={{ filter: `drop-shadow(0 0 3px hsl(${colorVar} / 0.6))` }}
      />
    </svg>
  );
}
