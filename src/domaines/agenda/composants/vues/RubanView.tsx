import { useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO,
  isToday, isSameDay, isWeekend, startOfDay, endOfDay, isBefore, isAfter, max, min,
} from "date-fns";
import { useTranslation } from "react-i18next";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { useVisibleInterval } from "@/socle/hooks/useVisibleInterval";
import { cn } from "@/socle/outils/utils";
import type { CalendarEvent } from "@/domaines/agenda/types";

/* LE RUBAN
 *
 * Une grille de mois dit CE QUE vous avez. Un ruban dit COMMENT votre
 * temps est fait : une ligne par jour, un axe horaire dessous, et les
 * evenements poses a leur vraie place. Les trous se voient, les blocs se
 * voient, et surtout les collisions se voient — deux rendez-vous qui se
 * chevauchent occupent deux etages, on ne peut pas les manquer.
 *
 * Les jours vides se replient a une ligne fine : un mois entier tient
 * dans un ecran et se parcourt d un coup d oeil, ce qu une grille ou
 * chaque case pese 112 px ne permet pas.
 */

interface RubanViewProps {
  viewDate: Date;
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
}

/* Avant six heures il ne se passe rien qui merite un dix-huitieme de la
   largeur. L axe couvre 06 h -> 24 h ; ce qui deborde est ramene au bord. */
const H0 = 6;
const H1 = 24;
const REPERES = [6, 9, 12, 15, 18, 21, 24];

const HAUTEUR_ETAGE = 25;
const HAUTEUR_BLOC = 22;

const enHeures = (d: Date) => d.getHours() + d.getMinutes() / 60;
const placer = (h: number) => Math.max(0, Math.min(100, ((h - H0) / (H1 - H0)) * 100));

interface Pose {
  ev: CalendarEvent;
  gauche: number;
  largeur: number;
  etage: number;
}

/* Empilement : chaque bloc prend le premier etage libre. C est ce qui
   rend une collision visible au lieu de la cacher derriere un « +2 ». */
function empiler(evenements: CalendarEvent[], jour: Date): Pose[] {
  const finsParEtage: number[] = [];
  return evenements.map((ev) => {
    const debut = parseISO(ev.start_time);
    const fin = parseISO(ev.end_time);
    // Un evenement qui deborde sur un autre jour est ramene aux bornes.
    const h0 = isSameDay(debut, jour) ? enHeures(debut) : 0;
    const h1 = isSameDay(fin, jour) ? enHeures(fin) : 24;
    const g = placer(h0);
    // Un rendez-vous d un quart d heure doit rester cliquable.
    const l = Math.max(4.5, placer(Math.max(h1, h0 + 0.25)) - g);

    let etage = finsParEtage.findIndex((f) => f <= g + 0.01);
    if (etage === -1) { etage = finsParEtage.length; finsParEtage.push(0); }
    finsParEtage[etage] = g + l;
    return { ev, gauche: g, largeur: l, etage };
  });
}

export function RubanView({ viewDate, events, onEventClick, onDayClick }: RubanViewProps) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();

  /* L aiguille avance chaque minute — et s arrete quand l onglet est
     cache, comme le reste de l application. */
  const [maintenant, setMaintenant] = useState(() => new Date());
  useVisibleInterval(() => setMaintenant(new Date()), 60_000);

  const jours = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(viewDate), end: endOfMonth(viewDate) }),
    [viewDate],
  );

  /* Un evenement qui court sur deux jours apparait sur les deux. Il etait
     indexe sur sa seule date de DEBUT — dans une grille de mois le trou
     passait inapercu, dans un ruban qui montre les journees une par une
     il saute aux yeux. */
  const parJour = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    const poser = (cle: string, ev: CalendarEvent) => {
      if (!m.has(cle)) m.set(cle, []);
      m.get(cle)!.push(ev);
    };
    const premier = startOfMonth(viewDate);
    const dernier = endOfMonth(viewDate);

    for (const ev of events) {
      const d0 = parseISO(ev.start_time);
      const d1 = parseISO(ev.end_time);
      if (Number.isNaN(d0.getTime())) continue;
      if (Number.isNaN(d1.getTime()) || !isAfter(d1, d0)) {
        poser(format(d0, "yyyy-MM-dd"), ev);
        continue;
      }
      // On ne deroule que la partie visible : un evenement d un an ne
      // doit pas couter trois cent soixante-cinq tours pour un mois.
      const debut = max([startOfDay(d0), premier]);
      const fin = min([endOfDay(d1), dernier]);
      if (isBefore(fin, debut)) continue;
      for (const jour of eachDayOfInterval({ start: debut, end: fin })) {
        poser(format(jour, "yyyy-MM-dd"), ev);
      }
    }
    for (const liste of m.values()) liste.sort((a, b) => a.start_time.localeCompare(b.start_time));
    return m;
  }, [events, viewDate]);

  const heureCourante = enHeures(maintenant);
  const aiguilleVisible = heureCourante >= H0 && heureCourante <= H1;

  return (
    <div className="cal-ruban">
      <div className="cal-rb-axe" aria-hidden="true">
        <div />
        <div className="cal-rb-axe-piste">
          {REPERES.map((h) => (
            <span key={h} className="cal-rb-heure" style={{ left: `${placer(h)}%` }}>
              {String(h).padStart(2, "0")}
            </span>
          ))}
        </div>
      </div>

      {jours.map((jour) => {
        const liste = parJour.get(format(jour, "yyyy-MM-dd")) ?? [];
        const journee = liste.filter((e) => e.all_day);
        const horaires = liste.filter((e) => !e.all_day);
        const poses = empiler(horaires, jour);
        const etages = poses.length ? Math.max(...poses.map((p) => p.etage)) + 1 : 0;
        const haut = journee.length ? 18 : 14;
        const vide = liste.length === 0;
        const auj = isToday(jour);

        return (
          <div
            key={jour.toISOString()}
            className={cn(
              "cal-rb-ligne",
              vide && "est-vide",
              isWeekend(jour) && "est-weekend",
              auj && "est-auj",
            )}
          >
            <button
              type="button"
              className="cal-rb-timbre"
              onClick={() => onDayClick(jour)}
              aria-label={t("calendar.openDay", "Open {{date}}", {
                date: format(jour, "EEEE d MMMM", { locale }),
              })}
            >
              <span className="cal-rb-jour">{format(jour, "EEE", { locale })}</span>
              <span className="cal-rb-num">{format(jour, "d")}</span>
            </button>

            <div
              className="cal-rb-piste"
              style={etages > 1 ? { minHeight: haut + etages * HAUTEUR_ETAGE + 4 } : undefined}
            >
              {journee.map((ev) => (
                <button
                  key={ev.id + format(jour, "-yyyyMMdd")}
                  type="button"
                  onClick={() => onEventClick(ev)}
                  className="cal-rb-jourentier"
                  style={{ ["--cal-teinte" as string]: ev.color } as React.CSSProperties}
                >
                  {ev.title}
                </button>
              ))}

              {poses.map(({ ev, gauche, largeur, etage }) => (
                <button
                  key={ev.id + format(jour, "-yyyyMMdd")}
                  type="button"
                  onClick={() => onEventClick(ev)}
                  className="cal-rb-bloc"
                  title={`${format(parseISO(ev.start_time), "HH:mm")} – ${format(parseISO(ev.end_time), "HH:mm")} · ${ev.title}`}
                  style={{
                    ["--cal-teinte" as string]: ev.color,
                    left: `${gauche}%`,
                    width: `${largeur}%`,
                    top: haut + etage * HAUTEUR_ETAGE,
                    height: HAUTEUR_BLOC,
                  } as React.CSSProperties}
                >
                  <span className="cal-rb-h">
                    {isSameDay(parseISO(ev.start_time), jour) ? format(parseISO(ev.start_time), "HH:mm") : "\u2190"}
                  </span>
                  <span className="truncate">{ev.title}</span>
                </button>
              ))}

              {auj && aiguilleVisible && (
                <div className="cal-rb-aiguille" style={{ left: `${placer(heureCourante)}%` }} aria-hidden="true" />
              )}
            </div>
          </div>
        );
      })}

      {events.length === 0 && (
        <p className="cal-rb-vide">{t("calendar.noEvents", "No events in this period")}</p>
      )}
    </div>
  );
}
