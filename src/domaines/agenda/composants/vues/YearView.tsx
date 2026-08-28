import { useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, format, parseISO, isToday, type Locale,
} from "date-fns";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { useTranslation } from "react-i18next";
import { cn } from "@/socle/outils/utils";
import type { CalendarEvent, CalendarSourceType } from "@/domaines/agenda/types";
import { SOURCES, ORDRE_SOURCES, sourceDe } from "@/domaines/agenda/logique/sources";

/* L annee : douze cartes du meme metal que le reste. Elles etaient des
   tuiles arrondies, et leurs points de couleur venaient de classes
   Tailwind — bg-blue-400, bg-purple-400 — qui n avaient rien a voir avec
   les teintes reellement employees sur les bandes du calendrier. La
   legende ne parlait pas la meme langue que la carte. */

interface YearViewProps {
  viewDate: Date;
  events: CalendarEvent[];
  onMonthClick: (month: Date) => void;
}

function MiniMois({ mois, events, courant, onClick, locale, t }: {
  mois: Date;
  events: CalendarEvent[];
  courant: boolean;
  onClick: () => void;
  locale?: Locale;
  t: (k: string, d?: string, o?: Record<string, unknown>) => string;
}) {
  const jours = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(mois), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(mois), { weekStartsOn: 1 }),
  }), [mois]);

  const { parJour, total } = useMemo(() => {
    const m = new Map<string, Set<CalendarSourceType>>();
    let n = 0;
    for (const ev of events) {
      const d = parseISO(ev.start_time);
      if (!isSameMonth(d, mois)) continue;
      n++;
      const cle = format(d, "yyyy-MM-dd");
      if (!m.has(cle)) m.set(cle, new Set());
      m.get(cle)!.add(sourceDe(ev._source));
    }
    return { parJour: m, total: n };
  }, [events, mois]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("cal-an-tuile", courant && "est-mois-courant")}
      aria-label={t("calendar.openMonth", "Open {{month}}", { month: format(mois, "MMMM yyyy", { locale }) })}
    >
      <span className="cal-an-tete">
        <span className="cal-an-nom">{format(mois, "MMM", { locale })}</span>
        {total > 0 && <span className="cal-an-compte">{total}</span>}
      </span>

      <span className="cal-an-grille">
        {jours.map((d) => {
          const dedans = isSameMonth(d, mois);
          const sources = parJour.get(format(d, "yyyy-MM-dd"));
          const auj = isToday(d);
          return (
            <span
              key={d.toISOString()}
              className={cn("cal-an-jour", !dedans && "hors-mois", auj && "est-auj")}
            >
              {format(d, "d")}
              {sources && sources.size > 0 && !auj && (
                <span className="cal-an-points" aria-hidden="true">
                  {ORDRE_SOURCES.filter((s) => sources.has(s)).slice(0, 3).map((s) => (
                    <i key={s} style={{ ["--cal-teinte" as string]: SOURCES[s].teinte } as React.CSSProperties} />
                  ))}
                </span>
              )}
            </span>
          );
        })}
      </span>
    </button>
  );
}

export function YearView({ viewDate, events, onMonthClick }: YearViewProps) {
  const locale = useDateFnsLocale();
  const { t } = useTranslation();
  const annee = viewDate.getFullYear();
  const mois = useMemo(() => Array.from({ length: 12 }, (_, i) => new Date(annee, i, 1)), [annee]);
  const moisCourant = new Date();

  return (
    <div className="cal-an">
      {mois.map((m) => (
        <MiniMois
          key={m.getMonth()}
          mois={m}
          events={events}
          courant={isSameMonth(m, moisCourant)}
          onClick={() => onMonthClick(m)}
          locale={locale}
          t={t as never}
        />
      ))}
    </div>
  );
}
