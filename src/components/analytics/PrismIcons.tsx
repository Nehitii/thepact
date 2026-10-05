import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (p: IconProps) => ({
  width: p.size ?? 24,
  height: p.size ?? 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

/** Overview — radar sweep: ring + 4 cardinal ticks + center dot */
export const OverviewIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" opacity="0.55" />
    <circle cx="12" cy="12" r="3.5" opacity="0.85" />
    <line x1="12" y1="2.5" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="21.5" />
    <line x1="2.5" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="21.5" y2="12" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

/** Goals — concentric target with crosshair */
export const GoalsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" opacity="0.45" />
    <circle cx="12" cy="12" r="6" opacity="0.7" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="3" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="21" />
    <line x1="3" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="21" y2="12" />
  </svg>
);

/** Focus — hexagonal hourglass */
export const FocusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 4h14l-7 8 7 8H5l7-8z" opacity="0.85" />
    <line x1="7" y1="4" x2="17" y2="4" strokeWidth="2" />
    <line x1="7" y1="20" x2="17" y2="20" strokeWidth="2" />
    <line x1="9.5" y1="9" x2="14.5" y2="9" opacity="0.5" />
  </svg>
);

/** Health — ECG line */
export const HealthIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2 12h4l2-6 3 12 3-9 2 3h6" />
    <circle cx="20" cy="12" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

/** Finance — ascending curve over a baseline */
export const FinanceIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="3" y1="20" x2="21" y2="20" opacity="0.4" />
    <line x1="3" y1="20" x2="3" y2="4" opacity="0.4" />
    <path d="M5 17 Q 9 14 12 11 T 20 4" />
    <line x1="3" y1="13" x2="21" y2="13" strokeDasharray="2 3" opacity="0.35" />
    <circle cx="20" cy="4" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

/** Habits — 3×3 grid partially filled */
export const HabitsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.85" stroke="none" />
    <rect x="9.5" y="3" width="5" height="5" rx="0.5" opacity="0.55" />
    <rect x="16" y="3" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.85" stroke="none" />
    <rect x="3" y="9.5" width="5" height="5" rx="0.5" opacity="0.55" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.85" stroke="none" />
    <rect x="16" y="9.5" width="5" height="5" rx="0.5" opacity="0.55" />
    <rect x="3" y="16" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.85" stroke="none" />
    <rect x="9.5" y="16" width="5" height="5" rx="0.5" opacity="0.55" />
    <rect x="16" y="16" width="5" height="5" rx="0.5" opacity="0.55" />
  </svg>
);
