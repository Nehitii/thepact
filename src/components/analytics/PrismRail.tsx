import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  OverviewIcon,
  GoalsIcon,
  FocusIcon,
  HealthIcon,
  FinanceIcon,
  HabitsIcon,
} from "./PrismIcons";
import type { ComponentType, SVGProps } from "react";

export type PrismSection = "overview" | "goals" | "focus" | "health" | "finance" | "habits";

type IconCmp = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

interface RailItem {
  id: PrismSection;
  label: string;
  icon: IconCmp;
  num: string;
}

const ITEMS: RailItem[] = [
  { id: "overview", label: "Overview", icon: OverviewIcon, num: "01" },
  { id: "goals",    label: "Goals",    icon: GoalsIcon,    num: "02" },
  { id: "focus",    label: "Focus",    icon: FocusIcon,    num: "03" },
  { id: "health",   label: "Health",   icon: HealthIcon,   num: "04" },
  { id: "finance",  label: "Finance",  icon: FinanceIcon,  num: "05" },
  { id: "habits",   label: "Habits",   icon: HabitsIcon,   num: "06" },
];

interface PrismRailProps {
  active: PrismSection;
  onChange: (s: PrismSection) => void;
}

export function PrismRail({ active, onChange }: PrismRailProps) {
  return (
    <>
      {/* Desktop: vertical rail */}
      <nav
        aria-label="Analytics sections"
        className="hidden lg:flex flex-col gap-1 sticky top-6 self-start w-[180px] flex-shrink-0"
      >
        <div className="font-orbitron text-[9px] uppercase tracking-[0.25em] text-muted-foreground/60 px-3 mb-2">
          // SECTIONS
        </div>
        {ITEMS.map((it) => {
          const isActive = active === it.id;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider transition-colors group",
                isActive
                  ? "text-[hsl(var(--prism-cyan))]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="prism-rail-active"
                  className="absolute inset-0 rounded-sm bg-[hsl(var(--prism-cyan))]/[0.08] border border-[hsl(var(--prism-cyan))]/25"
                  style={{
                    boxShadow:
                      "0 0 0 1px hsl(var(--prism-cyan) / 0.1), 0 0 18px -4px hsl(var(--prism-cyan) / 0.45), inset 2px 0 0 hsl(var(--prism-cyan))",
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative text-[9px] opacity-50 tabular-nums">{it.num}</span>
              <Icon
                className={cn(
                  "relative h-4 w-4 transition-all",
                  isActive
                    ? "opacity-100"
                    : "opacity-60 group-hover:opacity-90",
                )}
                style={
                  isActive
                    ? { filter: "drop-shadow(0 0 4px hsl(var(--prism-cyan) / 0.8))" }
                    : undefined
                }
              />
              <span className="relative">{it.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile/Tablet: horizontal scroll chips */}
      <nav
        aria-label="Analytics sections"
        className="lg:hidden sticky top-0 z-20 -mx-4 px-4 py-3 mb-4 backdrop-blur-xl bg-[hsl(var(--prism-bg))]/80 border-b border-[hsl(var(--prism-cyan))]/10"
      >
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {ITEMS.map((it) => {
            const isActive = active === it.id;
            const Icon = it.icon;
            return (
              <button
                key={it.id}
                onClick={() => onChange(it.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 rounded-sm font-mono text-[11px] uppercase tracking-wider whitespace-nowrap transition-colors",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="prism-rail-active-mobile"
                    className="absolute inset-0 rounded-sm bg-[hsl(var(--prism-cyan))]/[0.1] border border-[hsl(var(--prism-cyan))]/40"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative h-3.5 w-3.5",
                    isActive ? "text-[hsl(var(--prism-cyan))]" : "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "relative",
                    isActive ? "text-[hsl(var(--prism-cyan))]" : "text-muted-foreground",
                  )}
                >
                  {it.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
