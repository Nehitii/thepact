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
      <SelectTrigger className="w-[180px] h-9 bg-card/60 backdrop-blur border-border/50 text-xs font-mono">
        <CalendarDays className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs font-mono">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
