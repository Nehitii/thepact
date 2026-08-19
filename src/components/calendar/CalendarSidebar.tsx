import { memo, useMemo } from "react";
import {
  format, parseISO, getDaysInMonth, isSameMonth,
  formatDistanceToNowStrict, isBefore,
} from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";

/* LA TELEMETRIE
 *
 * L ancienne barre laterale listait cinq rendez-vous a venir, et
 * disparaissait quand il n y en avait aucun — c est-a-dire exactement
 * quand un calendrier a le plus besoin de dire quelque chose.
 *
 * Elle mesure desormais le mois : ce qui vient, ce qu il pese, combien
 * de jours il occupe. Un mois vide n est plus un trou, c est une
 * information — et elle s affiche.
 */

interface CalendarSidebarProps {
  events: CalendarEvent[];
  viewDate: Date;
  onEventClick: (ev: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
}

export const CalendarSidebar = memo(({ events, viewDate, onEventClick, onDayClick }: CalendarSidebarProps) => {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();

  const mesures = useMemo(() => {
    const maintenant = new Date();
    const tries = [...events].sort((a, b) => a.start_time.localeCompare(b.start_time));

    const aVenir = tries.filter((e) => !isBefore(parseISO(e.end_time), maintenant));
    const prochain = aVenir[0] ?? tries[0] ?? null;

    const evenements = tries.filter((e) => !e._source || e._source === "event").length;
    const echeances = tries.length - evenements;

    const parJour = new Map<string, number>();
    for (const e of tries) {
      const cle = format(parseISO(e.start_time), "yyyy-MM-dd");
      parJour.set(cle, (parJour.get(cle) ?? 0) + 1);
    }
    let plusCharge: { cle: string; n: number } | null = null;
    for (const [cle, n] of parJour) {
      if (!plusCharge || n > plusCharge.n) plusCharge = { cle, n };
    }

    const joursDuMois = getDaysInMonth(viewDate);
    return {
      prochain,
      prochainEstAVenir: aVenir.length > 0,
      total: tries.length,
      evenements,
      echeances,
      joursOccupes: parJour.size,
      joursDuMois,
      plusCharge,
      liste: (aVenir.length ? aVenir : tries).slice(0, 4),
    };
  }, [events, viewDate]);

  const barres = Math.round((mesures.joursOccupes / Math.max(1, mesures.joursDuMois)) * 10);

  return (
    <div className="cal-tel">
      <div className="cal-tel-bloc est-signal">
        <span className="cal-tel-nom">
          {mesures.prochainEstAVenir ? t("calendar.tel.next", "Next") : t("calendar.tel.first", "First")}
        </span>
        {mesures.prochain ? (
          <>
            <span className="cal-tel-val">
              {mesures.prochain.all_day
                ? format(parseISO(mesures.prochain.start_time), "dd.MM")
                : format(parseISO(mesures.prochain.start_time), "HH:mm")}
            </span>
            <span className="cal-tel-note">
              {mesures.prochain.title}
              {mesures.prochainEstAVenir && (
                <> — {formatDistanceToNowStrict(parseISO(mesures.prochain.start_time), { locale, addSuffix: true })}</>
              )}
            </span>
          </>
        ) : (
          <>
            <span className="cal-tel-val">—</span>
            <span className="cal-tel-note">{t("calendar.tel.nothingAhead", "Nothing ahead")}</span>
          </>
        )}
      </div>

      <div className="cal-tel-bloc">
        <span className="cal-tel-nom">{t("calendar.tel.load", "Month load")}</span>
        <span className="cal-tel-val">{mesures.total}</span>
        <span className="cal-tel-note">
          {t("calendar.tel.breakdown", "{{events}} events, {{deadlines}} deadlines", {
            events: mesures.evenements,
            deadlines: mesures.echeances,
          })}
        </span>
        <div className="cal-tel-jauge" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} className={i < barres ? "est-plein" : undefined} />
          ))}
        </div>
      </div>

      <div className="cal-tel-bloc">
        <span className="cal-tel-nom">{t("calendar.tel.busyDays", "Busy days")}</span>
        <span className="cal-tel-val">{mesures.joursOccupes} / {mesures.joursDuMois}</span>
        {mesures.plusCharge && (
          <span className="cal-tel-note">
            {t("calendar.tel.busiest", "Busiest: {{date}}", {
              date: format(parseISO(mesures.plusCharge.cle), "EEEE d", { locale }),
            })}
          </span>
        )}
      </div>

      {mesures.liste.length > 0 && (
        <div className="cal-tel-bloc">
          <span className="cal-tel-nom">{t("calendar.tel.upcoming", "Upcoming")}</span>
          <div className="cal-tel-liste">
            {mesures.liste.map((ev) => {
              const debut = parseISO(ev.start_time);
              const passe = isBefore(debut, new Date());
              return (
                <button
                  key={ev.id}
                  type="button"
                  className="cal-tel-item"
                  style={{ ["--cal-teinte" as string]: ev.color } as React.CSSProperties}
                  onClick={() => (isSameMonth(debut, viewDate) ? onEventClick(ev) : onDayClick(debut))}
                >
                  <em aria-hidden="true" />
                  <span>
                    <span className="cal-tel-titre">{ev.title}</span>
                    <span className={cn("cal-tel-quand", passe && "est-passe")}>
                      {format(debut, "EEE d MMM", { locale })}
                      {!ev.all_day && ` · ${format(debut, "HH:mm")}`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

CalendarSidebar.displayName = "CalendarSidebar";
