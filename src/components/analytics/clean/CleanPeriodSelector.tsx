import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { AnalyticsPeriod } from "../PeriodSelector";

interface Props {
  value: AnalyticsPeriod;
  onChange: (v: AnalyticsPeriod) => void;
}

export function CleanPeriodSelector({ value, onChange }: Props) {
  const { t } = useTranslation();
  const options: { value: AnalyticsPeriod; label: string }[] = [
    { value: "30d", label: t("analytics.period.30d", "30j") },
    { value: "90d", label: t("analytics.period.90d", "90j") },
    { value: "6m", label: t("analytics.period.6m", "6 mois") },
    { value: "all", label: t("analytics.period.all", "Tout") },
  ];
  return (
    <div
      role="tablist"
      aria-label="Période"
      className="inline-flex items-center gap-0 rounded-lg border border-border/60 bg-card/40 p-0.5"
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="clean-period-active"
                className="absolute inset-0 bg-primary rounded-md"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}