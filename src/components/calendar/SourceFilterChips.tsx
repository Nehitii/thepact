import { memo } from "react";
import { useTranslation } from "react-i18next";
import type { CalendarSourceType } from "@/hooks/useCalendarEvents";
import { SOURCES, ORDRE_SOURCES } from "./sources";

interface SourceFilterChipsProps {
  active: Set<CalendarSourceType>;
  onToggle: (source: CalendarSourceType) => void;
}

export const SourceFilterChips = memo(({ active, onToggle }: SourceFilterChipsProps) => {
  const { t } = useTranslation();

  return (
    <div className="cal-sources" role="group" aria-label={t("calendar.sourceFilters", "Sources shown")}>
      {ORDRE_SOURCES.map((key: CalendarSourceType) => {
        const { icone: Icone, teinte, cle } = SOURCES[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            /* Une source active ne se distinguait que par l opacite. */
            aria-pressed={active.has(key)}
            className="cal-source"
            style={{ ["--cal-teinte" as string]: teinte } as React.CSSProperties}
          >
            <Icone className="h-3 w-3" aria-hidden="true" />
            {t(cle)}
          </button>
        );
      })}
    </div>
  );
});

SourceFilterChips.displayName = "SourceFilterChips";
