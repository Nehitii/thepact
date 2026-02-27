import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface HUDFrameProps {
  children: ReactNode;
  className?: string;
  scanLine?: boolean;
  glowColor?: string;
  active?: boolean;
  /** Visual variant for distinct component types */
  variant?: "default" | "hero" | "metric" | "toolbar" | "chart";
  /** Accent color for left-border stripe (metric variant) */
  accentColor?: string;
}

/* Inline SVG noise as data-URI (tiny, cached) */
const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

export function HUDFrame({
  children,
  className,
  scanLine = false,
  glowColor,
  active = false,
  variant = "default",
  accentColor,
}: HUDFrameProps) {
  const borderColor = glowColor || "hsl(var(--hud-phosphor))";

  /* Variant-specific styles */
  const variantStyles = {
    default: {
      border: `1px solid ${borderColor}33`,
      boxShadow: active
        ? `0 0 30px ${borderColor}18, inset 0 1px 0 ${borderColor}15`
        : `0 0 20px ${borderColor}08`,
    },
    hero: {
      border: `1px solid ${borderColor}50`,
      boxShadow: `0 0 40px ${borderColor}20, 0 4px 30px hsl(210 100% 2% / 0.4), inset 0 1px 0 ${borderColor}20`,
    },
    metric: {
      border: `1px solid ${borderColor}25`,
      borderLeft: `3px solid ${accentColor || borderColor}`,
      boxShadow: `0 0 15px ${borderColor}08`,
    },
    toolbar: {
      border: `1px solid ${borderColor}20`,
      boxShadow: "none",
    },
    chart: {
      border: `1px solid ${borderColor}25`,
      boxShadow: `0 0 20px ${borderColor}08`,
    },
  };

  const style = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative rounded-2xl bg-hud-surface/80 backdrop-blur-md transition-all duration-300 overflow-hidden group/hud",
        active && "ring-1 ring-hud-phosphor/20",
        variant === "hero" && "rounded-3xl",
        variant === "toolbar" && "rounded-xl bg-hud-surface/50",
        className
      )}
      style={style}
    >
      {/* Inner gradient for depth — hero gets a stronger version */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          background:
            variant === "hero"
              ? `linear-gradient(180deg, ${borderColor}10 0%, transparent 50%)`
              : `linear-gradient(180deg, ${borderColor}06 0%, transparent 30%)`,
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit] mix-blend-soft-light"
        style={{ backgroundImage: NOISE_BG, opacity: 0.02 }}
      />

      {/* Top edge highlight — hero and chart get a prominent one */}
      {(variant === "hero" || variant === "chart" || variant === "default") && (
        <div
          className="absolute top-0 left-4 right-4 h-[1px] pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${borderColor}${variant === "hero" ? "80" : "40"}, transparent)`,
          }}
        />
      )}

      {/* Scan line */}
      {scanLine && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit]">
          <div
            className="absolute left-0 right-0 h-[2px] animate-hud-scan"
            style={{
              background: `linear-gradient(90deg, transparent, ${borderColor}60, transparent)`,
              boxShadow: `0 0 8px ${borderColor}40`,
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
