import { memo } from "react";
import { CheckSquare, Target, Footprints, CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CalendarSourceType } from "@/hooks/useCalendarEvents";

interface SourceFilterChipsProps {
  active: Set<CalendarSourceType>;
  onToggle: (source: CalendarSourceType) => void;
}

/* Les pastilles portent la teinte reelle de leur source — celle qu on
   retrouve sur les bandes du calendrier. Une legende qui n emploie pas
   les memes couleurs que la carte n est pas une legende. */
const chips: { key: CalendarSourceType; icon: typeof CalendarDays; teinte: string }[] = [
  { key: "event", icon: CalendarDays, teinte: "#3b82f6" },
  { key: "todo", icon: CheckSquare, teinte: "#f97316" },
  { key: "goal", icon: Target, teinte: "#a855f7" },
  { key: "step", icon: Footprints, teinte: "#14b8a6" },
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
    <div className="cal-sources" role="group" aria-label={t("calendar.sourceFilters", "Sources shown")}>
      {chips.map(({ key, icon: Icon, teinte }) => (
        <button
          key={key}
          type="button"
          onClick={() => onToggle(key)}
          /* Une source active ne se distinguait que par l opacite. */
          aria-pressed={active.has(key)}
          className="cal-source"
          style={{ ["--cal-teinte" as string]: teinte } as React.CSSProperties}
        >
          <Icon className="h-3 w-3" aria-hidden="true" />
          {labels[key]}
        </button>
      ))}
    </div>
  );
});

SourceFilterChips.displayName = "SourceFilterChips";
