import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface AllianceTabsProps {
  activeTab: string;
  items: Array<{
    value: string;
    icon: LucideIcon;
    label: string;
    count?: number;
    accent?: "primary" | "special" | "success" | "warning";
  }>;
}

const ACCENT_VAR = {
  primary: "var(--ds-accent-primary)",
  special: "var(--ds-accent-special)",
  success: "var(--ds-accent-success)",
  warning: "var(--ds-accent-warning)",
} as const;

export function AllianceTabs({ activeTab, items }: AllianceTabsProps) {
  return (
    <div className="border-b border-[hsl(var(--ds-border-default)/0.15)] px-1 overflow-x-auto scrollbar-none">
      <TabsList className="bg-transparent p-0 gap-1 h-auto flex-nowrap">
        {items.map((it) => {
          const active = activeTab === it.value;
          const colorVar = ACCENT_VAR[it.accent ?? "primary"];
          const Icon = it.icon;
          return (
            <TabsTrigger
              key={it.value}
              value={it.value}
              className={cn(
                "relative flex items-center gap-2 px-4 sm:px-5 py-4 rounded-none border-0 whitespace-nowrap",
                "transition-colors duration-200 data-[state=active]:bg-transparent",
                active
                  ? "text-[hsl(var(--ds-text-primary))]"
                  : "text-[hsl(var(--ds-text-muted)/0.55)] hover:text-[hsl(var(--ds-text-primary))]",
              )}
            >
              {/* Bottom indicator only — minimal */}
              {active && (
                <span
                  className="absolute bottom-[-1px] left-3 right-3 h-px"
                  style={{
                    background: `hsl(${colorVar})`,
                    boxShadow: `0 0 8px hsl(${colorVar} / 0.6)`,
                  }}
                  aria-hidden="true"
                />
              )}

              <Icon
                className="h-3.5 w-3.5 shrink-0"
                style={active ? { color: `hsl(${colorVar})` } : undefined}
              />
              <span
                className={cn(
                  "font-orbitron text-[10px] uppercase tracking-[0.24em] hidden sm:inline",
                  active ? "font-semibold" : "font-light",
                )}
              >
                {it.label}
              </span>
              {it.count != null && it.count > 0 && (
                <span
                  className="ml-1 font-mono text-[9px] tabular-nums opacity-70"
                  style={active ? { color: `hsl(${colorVar})` } : undefined}
                >
                  {String(it.count).padStart(2, "0")}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </div>
  );
}
