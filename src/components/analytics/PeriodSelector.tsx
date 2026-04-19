import { CalendarDays } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

export type AnalyticsPeriod = "30d" | "90d" | "6m" | "all";

interface PeriodSelectorProps {
  value: AnalyticsPeriod;
  onChange: (value: AnalyticsPeriod) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const { t } = useTranslation();

  const options: { value: AnalyticsPeriod; label: string }[] = [
    { value: "30d", label: t("analytics.period.30d", "Last 30 days") },
    { value: "90d", label: t("analytics.period.90d", "Last 3 months") },
    { value: "6m", label: t("analytics.period.6m", "Last 6 months") },
    { value: "all", label: t("analytics.period.all", "All time") },
  ];

  return (
    <Select value={value} onValueChange={(v) => onChange(v as AnalyticsPeriod)}>
      <SelectTrigger className="w-[180px] h-9 bg-[hsl(var(--prism-cyan))]/[0.05] border-[hsl(var(--prism-cyan))]/25 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--prism-cyan))] hover:bg-[hsl(var(--prism-cyan))]/[0.08] transition-colors rounded-sm">
        <CalendarDays className="h-3.5 w-3.5 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-[hsl(var(--prism-panel-bg))] border-[hsl(var(--prism-cyan))]/25">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-[11px] font-mono uppercase tracking-wider">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
