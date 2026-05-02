import { ReactNode } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { DSAccent } from "./DSPanel";

type Visual = "radar" | "scope" | "wave" | "icon";

const ACCENT_VAR: Record<DSAccent, string> = {
  primary:  "var(--ds-accent-primary)",
  success:  "var(--ds-accent-success)",
  warning:  "var(--ds-accent-warning)",
  critical: "var(--ds-accent-critical)",
  special:  "var(--ds-accent-special)",
};

interface DSEmptyStateProps {
  /** Uppercase mono label, e.g. "NO SIGNAL DETECTED" */
  message?: string;
  /** Long-form description below the message */
  description?: string;
  /** CTA label (renders pill button) */
  ctaLabel?: string;
  /** Internal route for the CTA (uses <Link>) */
  to?: string;
  /** Click handler if no internal route */
  onClick?: () => void;
  /** Decorative motif: radar pulse, crosshair scope, wave, or a Lucide icon */
  visual?: Visual;
  /** Lucide icon (used when visual="icon") */
  icon?: LucideIcon;
  /** Accent color */
  accent?: DSAccent;
  className?: string;
  /** Custom slot rendered after the CTA (e.g. secondary action) */
  extra?: ReactNode;
}

/**
 * Pacte OS — Canonical empty state.
 * Replaces PrismEmptyCTA / EmptyState / CyberEmpty visual dialects.
 * Uses `--ds-current-accent` so it inherits panel accent automatically when nested.
 */
export function DSEmptyState({
  message = "NO SIGNAL DETECTED",
  description,
  ctaLabel,
  to,
  onClick,
  visual = "radar",
  icon: Icon,
  accent = "primary",
  className,
  extra,
}: DSEmptyStateProps) {
  const cta = ctaLabel ? (
    to ? (
      <Link
        to={to}
        onClick={onClick}
        className="touch-target inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[hsl(var(--ds-current-accent,var(--ds-accent-primary))/0.30)] bg-[hsl(var(--ds-current-accent,var(--ds-accent-primary))/0.05)] hover:bg-[hsl(var(--ds-current-accent,var(--ds-accent-primary))/0.12)] hover:border-[hsl(var(--ds-current-accent,var(--ds-accent-primary))/0.55)] transition-colors font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--ds-current-accent,var(--ds-accent-primary)))]"
      >
        {ctaLabel}
        <ArrowRight className="h-3 w-3" />
      </Link>
    ) : (
      <button
        type="button"
        onClick={onClick}
        className="touch-target inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[hsl(var(--ds-current-accent,var(--ds-accent-primary))/0.30)] bg-[hsl(var(--ds-current-accent,var(--ds-accent-primary))/0.05)] hover:bg-[hsl(var(--ds-current-accent,var(--ds-accent-primary))/0.12)] hover:border-[hsl(var(--ds-current-accent,var(--ds-accent-primary))/0.55)] transition-colors font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--ds-current-accent,var(--ds-accent-primary)))]"
      >
        {ctaLabel}
        <ArrowRight className="h-3 w-3" />
      </button>
    )
  ) : null;

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col items-center justify-center gap-3 px-4 text-center",
        className,
      )}
      style={{ ["--ds-current-accent" as any]: ACCENT_VAR[accent] }}
    >
      <Visual variant={visual} icon={Icon} />
      <span className="ds-text-label">{message}</span>
      {description && (
        <p className="text-xs text-ds-text-muted/70 max-w-xs">{description}</p>
      )}
      {cta}
      {extra}
    </div>
  );
}

function Visual({ variant, icon: Icon }: { variant: Visual; icon?: LucideIcon }) {
  if (variant === "icon" && Icon) {
    return (
      <div
        className="relative h-12 w-12 rounded-full border flex items-center justify-center"
        style={{
          borderColor: "hsl(var(--ds-current-accent, var(--ds-accent-primary)) / 0.3)",
          boxShadow: "var(--ds-glow-sm)",
        }}
      >
        <Icon className="h-5 w-5" style={{ color: "hsl(var(--ds-current-accent, var(--ds-accent-primary)))", strokeWidth: 1.75 }} />
      </div>
    );
  }
  if (variant === "wave") {
    return (
      <svg width="64" height="20" viewBox="0 0 64 20" className="opacity-70" aria-hidden>
        <path
          d="M0 10 Q8 2, 16 10 T32 10 T48 10 T64 10"
          fill="none"
          stroke="hsl(var(--ds-current-accent, var(--ds-accent-primary)) / 0.5)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (variant === "scope") {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" className="opacity-70" aria-hidden>
        <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--ds-current-accent, var(--ds-accent-primary)) / 0.35)" strokeWidth="0.7" />
        <circle cx="24" cy="24" r="13" fill="none" stroke="hsl(var(--ds-current-accent, var(--ds-accent-primary)) / 0.25)" strokeWidth="0.6" strokeDasharray="2 3" />
        <line x1="0" y1="24" x2="48" y2="24" stroke="hsl(var(--ds-current-accent, var(--ds-accent-primary)) / 0.2)" strokeWidth="0.5" />
        <line x1="24" y1="0" x2="24" y2="48" stroke="hsl(var(--ds-current-accent, var(--ds-accent-primary)) / 0.2)" strokeWidth="0.5" />
        <circle cx="24" cy="24" r="2" fill="hsl(var(--ds-current-accent, var(--ds-accent-primary)))" />
      </svg>
    );
  }
  // radar (default)
  return (
    <div
      className="relative h-12 w-12 rounded-full border flex items-center justify-center"
      style={{
        borderColor: "hsl(var(--ds-current-accent, var(--ds-accent-primary)) / 0.3)",
        animation: "ds-pulse-dot 2.4s ease-in-out infinite",
      }}
    >
      <span
        className="absolute inset-1 rounded-full motion-reduce:hidden"
        style={{
          background:
            "conic-gradient(from 0deg, hsl(var(--ds-current-accent, var(--ds-accent-primary)) / 0.45), transparent 30%)",
          animation: "ds-ring-rotate 3.5s linear infinite",
        }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "hsl(var(--ds-current-accent, var(--ds-accent-primary)))" }}
      />
    </div>
  );
}