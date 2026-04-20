import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type AnalyticsPeriod = "30d" | "90d" | "6m" | "all";

interface PeriodSelectorProps {
  value: AnalyticsPeriod;
  onChange: (value: AnalyticsPeriod) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const { t } = useTranslation();

  const options: { value: AnalyticsPeriod; short: string; full: string }[] = [
    { value: "30d", short: "30D", full: t("analytics.period.30d", "Last 30 days") },
    { value: "90d", short: "90D", full: t("analytics.period.90d", "Last 3 months") },
    { value: "6m",  short: "6M",  full: t("analytics.period.6m",  "Last 6 months") },
    { value: "all", short: "ALL", full: t("analytics.period.all", "All time") },
  ];

  return (
    <div
      role="tablist"
      aria-label="Analytics period"
      className="relative inline-flex items-center gap-0 rounded-sm border border-[hsl(var(--prism-cyan))]/20 bg-[hsl(var(--prism-cyan))]/[0.03] p-0.5 backdrop-blur-sm"
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            title={opt.full}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors",
              isActive
                ? "text-[hsl(var(--prism-cyan))]"
                : "text-muted-foreground/70 hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="prism-period-active"
                className="absolute inset-0 rounded-[2px] bg-[hsl(var(--prism-cyan))]/[0.12] border border-[hsl(var(--prism-cyan))]/40"
                style={{ boxShadow: "0 0 12px -2px hsl(var(--prism-cyan) / 0.5)" }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative tabular-nums">{opt.short}</span>
          </button>
        );
      })}
    </div>
  );
}
