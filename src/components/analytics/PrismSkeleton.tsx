import { cn } from "@/lib/utils";

interface PrismSkeletonProps {
  className?: string;
  label?: string;
}

export function PrismSkeleton({ className, label = "ACQUIRING SIGNAL..." }: PrismSkeletonProps) {
  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden rounded-sm bg-[hsl(var(--prism-panel-bg)/0.4)] border border-[hsl(var(--prism-cyan)/0.12)]",
        className,
      )}
    >
      {/* Sweeping scan line */}
      <div
        className="pointer-events-none absolute inset-y-0 w-1/3 motion-reduce:hidden"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--prism-cyan) / 0.18), transparent)",
          animation: "prism-skeleton-sweep 1.4s linear infinite",
        }}
      />
      {/* Subtle horizontal grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(0deg, hsl(var(--prism-cyan)) 1px, transparent 1px)",
          backgroundSize: "100% 14px",
        }}
      />
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--prism-cyan)/0.7)]"
          style={{ animation: "prism-pulse-cyan 2s ease-in-out infinite" }}
        >
          [ {label} ]
        </span>
      </div>
    </div>
  );
}
