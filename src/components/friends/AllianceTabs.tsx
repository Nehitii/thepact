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
    <div className="border-y border-[hsl(var(--ds-border-default)/0.2)] bg-[hsl(var(--ds-surface-2)/0.5)] px-2 sm:px-3 overflow-x-auto scrollbar-none">
      <TabsList className="bg-transparent p-0 gap-0 h-auto flex-nowrap">
        {items.map((it) => {
          const active = activeTab === it.value;
          const colorVar = ACCENT_VAR[it.accent ?? "primary"];
          const Icon = it.icon;
          return (
            <TabsTrigger
              key={it.value}
              value={it.value}
              className={cn(
                "relative flex items-center gap-2 px-3 sm:px-4 py-3 rounded-none border-0 whitespace-nowrap",
                "transition-all duration-200 group data-[state=active]:bg-transparent",
                active ? "opacity-100" : "opacity-50 hover:opacity-100",
              )}
              style={
                active
                  ? {
                      background: `hsl(${colorVar} / 0.08)`,
                      color: `hsl(${colorVar})`,
                      boxShadow: `inset 2px 0 0 0 hsl(${colorVar})`,
                    }
                  : undefined
              }
            >
              {/* Micro brackets active */}
              {active && (
                <>
                  <span
                    className="absolute top-0 left-0 h-1.5 w-1.5 border-t border-l"
                    style={{ borderColor: `hsl(${colorVar} / 0.7)` }}
                  />
                  <span
                    className="absolute bottom-0 left-0 h-1.5 w-1.5 border-b border-l"
                    style={{ borderColor: `hsl(${colorVar} / 0.7)` }}
                  />
                </>
              )}

              <Icon className="h-4 w-4 shrink-0" />
              <span
                className={cn(
                  "font-orbitron text-[11px] uppercase tracking-[0.2em] hidden sm:inline",
                  active && "font-bold",
                )}
              >
                {it.label}
              </span>
              {it.count != null && it.count > 0 && (
                <span
                  className="ml-1 font-mono text-[9px] tabular-nums px-1.5 py-0.5 rounded-[2px] border"
                  style={{
                    color: active ? `hsl(${colorVar})` : "hsl(var(--ds-text-muted))",
                    borderColor: active
                      ? `hsl(${colorVar} / 0.4)`
                      : "hsl(var(--ds-border-subtle) / 0.2)",
                    background: active
                      ? `hsl(${colorVar} / 0.06)`
                      : "hsl(var(--ds-surface-3) / 0.4)",
                  }}
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
