import { cn } from "@/lib/utils";

type ShimmerVariant = "area" | "bar" | "line" | "radar" | "block";

interface PrismShimmerProps {
  variant?: ShimmerVariant;
  className?: string;
}

/**
 * PrismShimmer — cinetic loading placeholder mimicking the chart silhouette.
 * Uses a sweep gradient + accent-colored backbone.
 */
export function PrismShimmer({ variant = "block", className }: PrismShimmerProps) {
  return (
    <div className={cn("prism-shimmer w-full h-full", className)} aria-hidden>
      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        {variant === "area" && (
          <path
            d="M0 30 L15 24 L30 26 L45 18 L60 22 L75 12 L90 16 L100 10 L100 40 L0 40 Z"
            fill="hsl(var(--prism-cyan) / 0.18)"
            stroke="hsl(var(--prism-cyan) / 0.45)"
            strokeWidth="0.5"
          />
        )}
        {variant === "line" && (
          <path
            d="M0 25 L15 20 L30 28 L45 14 L60 22 L75 8 L90 18 L100 12"
            fill="none"
            stroke="hsl(var(--prism-cyan) / 0.45)"
            strokeWidth="0.6"
            strokeLinecap="round"
          />
        )}
        {variant === "bar" && (
          <g fill="hsl(var(--prism-cyan) / 0.25)">
            {[8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88].map((x, i) => {
              const h = 8 + (i % 5) * 5;
              return <rect key={x} x={x} y={40 - h} width="5" height={h} rx="0.5" />;
            })}
          </g>
        )}
        {variant === "radar" && (
          <g
            fill="none"
            stroke="hsl(var(--prism-cyan) / 0.35)"
            strokeWidth="0.4"
            transform="translate(50 20)"
          >
            <polygon points="0,-15 13,-7.5 13,7.5 0,15 -13,7.5 -13,-7.5" />
            <polygon points="0,-10 8.7,-5 8.7,5 0,10 -8.7,5 -8.7,-5" />
            <polygon points="0,-5 4.3,-2.5 4.3,2.5 0,5 -4.3,2.5 -4.3,-2.5" />
          </g>
        )}
        {variant === "block" && (
          <rect x="2" y="2" width="96" height="36" rx="1" fill="hsl(var(--prism-cyan) / 0.12)" />
        )}
      </svg>
    </div>
  );
}