import { CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

export type AnalyticsPeriod = "30d" | "90d" | "6m" | "all";

interface PeriodSelectorProps {
  value: AnalyticsPeriod;
  onChange: (value: AnalyticsPeriod) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const { t } = useTranslation();

  const options = [
    { value: "30d", label: "T_MINUS_30_DAYS" },
    { value: "90d", label: "T_MINUS_90_DAYS" },
    { value: "6m", label: "T_MINUS_06_MONTHS" },
    { value: "all", label: "ALL_SYSTEM_RECORDS" },
  ];

  return (
    <Select value={value} onValueChange={(v) => onChange(v as AnalyticsPeriod)}>
      <SelectTrigger className="w-[200px] h-9 bg-black border border-cyan-900 text-cyan-400 text-xs font-mono rounded-none focus:ring-1 focus:ring-cyan-500 focus:ring-offset-0">
        <CalendarDays className="h-3.5 w-3.5 mr-2 text-cyan-600" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-black border-cyan-900 text-cyan-400 font-mono rounded-none">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="text-xs hover:bg-cyan-950 focus:bg-cyan-950 focus:text-cyan-300"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
