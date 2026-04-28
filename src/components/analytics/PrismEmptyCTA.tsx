import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PrismEmptyCTAProps {
  message?: string;
  ctaLabel?: string;
  to?: string;
  onClick?: () => void;
  /** Decorative variant icon — radar | scope | wave */
  visual?: "radar" | "scope" | "wave";
}

export function PrismEmptyCTA({
  message = "NO SIGNAL DETECTED",
  ctaLabel,
  to,
  onClick,
  visual = "radar",
}: PrismEmptyCTAProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-4 text-center">
      <Visual variant={visual} />
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
        {message}
      </span>
      {ctaLabel && (
        to ? (
          <Link
            to={to}
            onClick={onClick}
            className={cn(
              "touch-target inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[hsl(var(--prism-cyan))]/30 bg-[hsl(var(--prism-cyan))]/[0.05] hover:bg-[hsl(var(--prism-cyan))]/[0.12] hover:border-[hsl(var(--prism-cyan))]/55 transition-colors font-mono text-[10px] uppercase tracking-[0.2em] prism-text-cyan",
            )}
          >
            {ctaLabel}
            <ArrowRight className="h-3 w-3" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClick}
            className="touch-target inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[hsl(var(--prism-cyan))]/30 bg-[hsl(var(--prism-cyan))]/[0.05] hover:bg-[hsl(var(--prism-cyan))]/[0.12] hover:border-[hsl(var(--prism-cyan))]/55 transition-colors font-mono text-[10px] uppercase tracking-[0.2em] prism-text-cyan"
          >
            {ctaLabel}
            <ArrowRight className="h-3 w-3" />
          </button>
        )
      )}
    </div>
  );
}

function Visual({ variant }: { variant: "radar" | "scope" | "wave" }) {
  if (variant === "wave") {
    return (
      <svg width="64" height="20" viewBox="0 0 64 20" className="opacity-70" aria-hidden>
        <path
          d="M0 10 Q8 2, 16 10 T32 10 T48 10 T64 10"
          fill="none"
          stroke="hsl(var(--prism-cyan) / 0.5)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (variant === "scope") {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" className="opacity-70" aria-hidden>
        <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--prism-cyan) / 0.35)" strokeWidth="0.7" />
        <circle cx="24" cy="24" r="13" fill="none" stroke="hsl(var(--prism-cyan) / 0.25)" strokeWidth="0.6" strokeDasharray="2 3" />
        <line x1="0" y1="24" x2="48" y2="24" stroke="hsl(var(--prism-cyan) / 0.2)" strokeWidth="0.5" />
        <line x1="24" y1="0" x2="24" y2="48" stroke="hsl(var(--prism-cyan) / 0.2)" strokeWidth="0.5" />
        <circle cx="24" cy="24" r="2" fill="hsl(var(--prism-cyan))" />
      </svg>
    );
  }
  // radar
  return (
    <div
      className="relative h-12 w-12 rounded-full border border-[hsl(var(--prism-cyan)/0.3)] flex items-center justify-center"
      style={{ animation: "prism-pulse-cyan 2.4s ease-in-out infinite" }}
    >
      <span
        className="absolute inset-1 rounded-full motion-reduce:hidden"
        style={{
          background:
            "conic-gradient(from 0deg, hsl(var(--prism-cyan) / 0.45), transparent 30%)",
          animation: "prism-orbit-spin 3.5s linear infinite",
        }}
      />
      <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--prism-cyan))]" />
    </div>
  );
}