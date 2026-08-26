import { memo, useMemo } from "react";
import {
  format, parseISO, isSameMonth, isSameDay,
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

    /* « A venir » englobait ce qui avait DEJA COMMENCE : des vacances du
       16 au 31 s annoncaient encore comme a venir le 19. Ce qui court
       n est pas ce qui arrive — on separe les deux. */
    const vivants = tries.filter((e) => !isBefore(parseISO(e.end_time), maintenant));
    const enCours = vivants.filter((e) => !isBefore(maintenant, parseISO(e.start_time)));
    const aVenir = vivants.filter((e) => isBefore(maintenant, parseISO(e.start_time)));
    const prochain = aVenir[0] ?? tries[0] ?? null;

    /* Le comptage par jour, le total, le jour le plus chargé et le nombre
       de jours du mois vivaient ici pour deux blocs de mesure qui sont
       partis dans Analytics. Ce qui reste ne compte plus : il montre. */
    return {
      prochain,
      prochainEstAVenir: aVenir.length > 0,
      enCours,
      liste: (aVenir.length ? aVenir : tries).slice(0, 4),
    };
  }, [events]);


  return (
    <div className="cal-tel">
      {mesures.enCours.length > 0 && (
        <div className="cal-tel-bloc est-signal">
          <span className="cal-tel-nom">{t("calendar.tel.ongoing", "Ongoing")}</span>
          <span className="cal-tel-val">{mesures.enCours.length}</span>
          <div className="cal-tel-liste">
            {mesures.enCours.slice(0, 3).map((ev) => {
              const fin = parseISO(ev.end_time);
              return (
                <button
                  key={ev.id}
                  type="button"
                  className="cal-tel-item"
                  style={{ ["--cal-teinte" as string]: ev.color } as React.CSSProperties}
                  onClick={() => onEventClick(ev)}
                >
                  <em aria-hidden="true" />
                  <span>
                    <span className="cal-tel-titre">{ev.title}</span>
                    <span className="cal-tel-quand est-vive">
                      {t("calendar.tel.until", "until {{date}}", {
                        date: ev.all_day || !isSameDay(fin, new Date())
                          ? format(fin, "EEE d MMM", { locale })
                          : format(fin, "HH:mm"),
                      })}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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

      {/* CE QUI EST PARTI, ET OÙ.
          « Charge du mois » et « jours occupés » ne valaient que pour le
          mois affiché, dans un flanc qu'on ne consulte pas en planifiant.
          Ils vivent maintenant dans Analytics, étendus à l'année, où ils
          répondent enfin à une question de rythme.

          CE QUI RESTE EST CE QU'ON VIENT CHERCHER : ce qui court, ce qui
          vient ensuite, et la suite. « À venir » fermait la colonne — on
          le lisait après deux mesures qui ne s'adressaient pas à lui. */}
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
