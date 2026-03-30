import { memo } from "react";
import { CheckSquare, Target, Footprints, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { CalendarSourceType } from "@/hooks/useCalendarEvents";

interface SourceFilterChipsProps {
  active: Set<CalendarSourceType>;
  onToggle: (source: CalendarSourceType) => void;
}

const chips: { key: CalendarSourceType; icon: typeof CalendarDays; colorClass: string }[] = [
  { key: "event", icon: CalendarDays, colorClass: "text-blue-400 border-blue-400/50 bg-blue-400/10" },
  { key: "todo", icon: CheckSquare, colorClass: "text-orange-400 border-orange-400/50 bg-orange-400/10" },
  { key: "goal", icon: Target, colorClass: "text-purple-400 border-purple-400/50 bg-purple-400/10" },
  { key: "step", icon: Footprints, colorClass: "text-teal-400 border-teal-400/50 bg-teal-400/10" },
];

export const SourceFilterChips = memo(({ active, onToggle }: SourceFilterChipsProps) => {
  const { t } = useTranslation();

  const labels: Record<CalendarSourceType, string> = {
    event: t("calendar.sourceEvent", "Events"),
    todo: t("calendar.sourceTodo", "Todos"),
    goal: t("calendar.sourceGoal", "Goals"),
    step: t("calendar.sourceStep", "Steps"),
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {chips.map(({ key, icon: Icon, colorClass }) => {
        const isActive = active.has(key);
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all",
              isActive ? colorClass : "text-muted-foreground border-border/30 bg-transparent opacity-50"
            )}
          >
            <Icon className="h-3 w-3" />
            {labels[key]}
          </button>
        );
      })}
    </div>
  );
});

SourceFilterChips.displayName = "SourceFilterChips";
