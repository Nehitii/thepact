import { cn } from "@/lib/utils";

/**
 * DS-aligned skeleton: surface-2 base + sweep highlight using ds-skeleton-sweep keyframe.
 * Falls back gracefully when prefers-reduced-motion is set (handled in design-tokens.css).
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--ds-radius-sm)] bg-[hsl(var(--ds-surface-2)/0.55)] border border-[hsl(var(--ds-border-subtle)/0.08)]",
        "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-[hsl(var(--ds-accent-primary)/0.06)] before:to-transparent before:animate-[ds-skeleton-sweep_1.6s_ease-in-out_infinite]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
