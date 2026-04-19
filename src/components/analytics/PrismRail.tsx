import { motion } from "framer-motion";
import { LucideIcon, LayoutDashboard, Target, Timer, Heart, Wallet, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

export type PrismSection = "overview" | "goals" | "focus" | "health" | "finance" | "habits";

interface RailItem {
  id: PrismSection;
  label: string;
  icon: LucideIcon;
  num: string;
}

const ITEMS: RailItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, num: "01" },
  { id: "goals",    label: "Goals",    icon: Target,          num: "02" },
  { id: "focus",    label: "Focus",    icon: Timer,           num: "03" },
  { id: "health",   label: "Health",   icon: Heart,           num: "04" },
  { id: "finance",  label: "Finance",  icon: Wallet,          num: "05" },
  { id: "habits",   label: "Habits",   icon: Repeat,          num: "06" },
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
                "relative flex items-center gap-3 px-3 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider transition-all group",
                isActive
                  ? "prism-rail-active text-[hsl(var(--prism-cyan))] bg-[hsl(var(--prism-cyan))]/[0.06]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.02]",
              )}
            >
              <span className="text-[9px] opacity-50 tabular-nums">{it.num}</span>
              <Icon className="h-3.5 w-3.5" />
              <span>{it.label}</span>
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
                  "flex items-center gap-2 px-3 py-2 rounded-sm font-mono text-[11px] uppercase tracking-wider whitespace-nowrap transition-all border",
                  isActive
                    ? "border-[hsl(var(--prism-cyan))]/40 text-[hsl(var(--prism-cyan))] bg-[hsl(var(--prism-cyan))]/[0.08]"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3 w-3" />
                {it.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
