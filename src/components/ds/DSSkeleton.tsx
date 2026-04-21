import { cn } from "@/lib/utils";

interface DSSkeletonProps {
  className?: string;
  label?: string;
  /** Render compact (no centered label) for inline placeholders. */
  compact?: boolean;
}

/**
 * Pacte OS — Loading skeleton with sweeping HUD scan.
 * Use as a child of a sized container.
 */
export function DSSkeleton({ className, label = "ACQUIRING SIGNAL...", compact = false }: DSSkeletonProps) {
  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden rounded-sm",
        "bg-[hsl(var(--ds-surface-1)/0.4)] border border-[hsl(var(--ds-accent-primary)/0.12)]",
        className,
      )}
    >
      {/* Sweeping scan line */}
      <div
        className="pointer-events-none absolute inset-y-0 w-1/3 ds-skeleton-sweep motion-reduce:hidden"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--ds-accent-primary) / 0.18), transparent)",
          animation: "ds-skeleton-sweep 1.4s linear infinite",
        }}
      />
      {/* Subtle horizontal grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(0deg, hsl(var(--ds-accent-primary)) 1px, transparent 1px)",
          backgroundSize: "100% 14px",
        }}
      />
      {!compact && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--ds-accent-primary)/0.7)]">
            [ {label} ]
          </span>
        </div>
      )}
    </div>
  );
}