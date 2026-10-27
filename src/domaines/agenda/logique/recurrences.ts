/* DEPLIER UNE RECURRENCE EN OCCURRENCES.
 *
 * Cent quarante lignes sorties de `useCalendarEvents.ts`, qui en
 * faisait 600. Une regle de recurrence n existe qu une fois en base ;
 * le calendrier a besoin de toutes les dates qu elle implique dans la
 * fenetre affichee. Ces occurrences sont VIRTUELLES : elles ne sont
 * jamais ecrites.
 *
 * `MAX_STEPS` borne le TRAVAIL, jamais le nombre d occurrences de la
 * regle — confondre les deux faisait disparaitre du calendrier des
 * evenements parfaitement valides.
 *
 * Ni React, ni requete : des dates et des boucles.
 */
import {
  addDays, addWeeks, addMonths, addYears,
  differenceInCalendarDays, differenceInCalendarMonths, differenceInCalendarYears,
  endOfDay, isAfter, isBefore, parseISO, startOfWeek,
} from "date-fns";
import type { CalendarEvent } from "@/domaines/agenda/types";

// ─── Recurrence expansion ───────────────────────────────────
export const DAY_MAP: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

/** Rang d un jour dans une semaine qui commence le lundi. */
export const rankInWeek = (day: number) => (day + 6) % 7;

export const MAX_STEPS = 5000;

export function expandRecurrences(event: CalendarEvent, rangeStart: Date, rangeEnd: Date): CalendarEvent[] {
  const rule = event.recurrence_rule;
  if (!rule) return [event];

  const eventStart = parseISO(event.start_time);
  const eventEnd = parseISO(event.end_time);
  if (Number.isNaN(eventStart.getTime())) return [event];

  const duration = Math.max(0, eventEnd.getTime() - eventStart.getTime());
  const interval = Math.max(1, rule.interval || 1);
  const until = rule.until ? endOfDay(parseISO(rule.until)) : null;
  /** Le nombre d occurrences que la regle produit — sans defaut arbitraire. */
  const total = rule.count && rule.count > 0 ? rule.count : Infinity;

  const results: CalendarEvent[] = [];
  /* Une occurrence qui se termine avant la fenetre ne nous interesse pas :
     c est cet instant-la qu on vise du premier coup, au lieu de derouler
     la serie depuis son origine. */
  const target = new Date(rangeStart.getTime() - duration);

  const emit = (start: Date, idx: number) => {
    if (until && isAfter(start, until)) return;
    const end = new Date(start.getTime() + duration);
    if (isBefore(end, rangeStart) || isAfter(start, rangeEnd)) return;
    results.push(makeVirtualOccurrence(event, start, end, idx));
  };

  /* HEBDOMADAIRE SUR PLUSIEURS JOURS
     La regle designe des JOURS a l interieur de semaines actives. Le code
     precedent avancait un curseur par semaines entieres depuis la date de
     depart, puis FILTRAIT sur le jour de la semaine — le curseur retombant
     toujours sur le jour de depart, une regle « lundi, mercredi,
     vendredi » creee un lundi ne produisait que des lundis, et creee un
     mardi ne produisait rien du tout. */
  const days = rule.freq === "weekly" && rule.byDay?.length
    ? [...new Set(rule.byDay.map((d) => DAY_MAP[d]).filter((n) => n !== undefined))]
        .sort((a, b) => rankInWeek(a) - rankInWeek(b))
    : null;

  if (days && days.length > 0) {
    const weekZero = startOfWeek(eventStart, { weekStartsOn: 1 });
    const startRank = rankInWeek(eventStart.getDay());
    // La semaine d origine ne compte que les jours a partir du depart.
    const firstWeekDays = days.filter((d) => rankInWeek(d) >= startRank);

    const weeksAway = Math.floor(
      differenceInCalendarDays(startOfWeek(target, { weekStartsOn: 1 }), weekZero) / 7
    );
    let k = Math.max(0, Math.floor(weeksAway / interval));
    let steps = 0;

    while (steps++ < MAX_STEPS) {
      const weekStart = addWeeks(weekZero, k * interval);
      if (isAfter(weekStart, rangeEnd)) break;
      if (until && isAfter(weekStart, until)) break;

      const ofWeek = k === 0 ? firstWeekDays : days;
      const base = k === 0 ? 0 : firstWeekDays.length + (k - 1) * days.length;
      if (base >= total) break;

      for (let i = 0; i < ofWeek.length; i++) {
        const idx = base + i;
        if (idx >= total) break;
        const day = addDays(weekStart, rankInWeek(ofWeek[i]));
        day.setHours(eventStart.getHours(), eventStart.getMinutes(), eventStart.getSeconds(), 0);
        emit(day, idx);
      }
      k++;
    }
    return results;
  }

  const advanceFn = rule.freq === "daily" ? addDays
    : rule.freq === "weekly" ? addWeeks
    : rule.freq === "monthly" ? addMonths
    : addYears;

  /* On saute directement au premier rang utile : un quotidien de 2018 n a
     pas a couter deux mille tours pour afficher un mois de 2026. Un rang
     de marge absorbe les arrondis de fuseau et d heure d ete. */
  const away = rule.freq === "daily" ? differenceInCalendarDays(target, eventStart)
    : rule.freq === "weekly" ? differenceInCalendarDays(target, eventStart) / 7
    : rule.freq === "monthly" ? differenceInCalendarMonths(target, eventStart)
    : differenceInCalendarYears(target, eventStart);
  let idx = Math.max(0, Math.floor(away / interval) - 1);
  let steps = 0;

  while (idx < total && steps++ < MAX_STEPS) {
    const start = idx === 0 ? eventStart : advanceFn(eventStart, interval * idx);
    if (isAfter(start, rangeEnd)) break;
    if (until && isAfter(start, until)) break;
    emit(start, idx);
    idx++;
  }

  return results;
}

export function makeVirtualOccurrence(event: CalendarEvent, start: Date, end: Date, idx: number): CalendarEvent {
  /* L original n est rendu tel quel que si l occurrence tombe VRAIMENT sur
     lui. Avec une regle « lundi, mercredi, vendredi » creee un mardi, la
     premiere occurrence est un mercredi : la renvoyer comme l original
     l aurait affichee le mardi, et rendue deplacable a tort. */
  if (idx === 0 && start.getTime() === parseISO(event.start_time).getTime()) return event;
  return {
    ...event,
    id: `${event.id}_r${idx}`,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    _virtual: true,
    _originalStart: event.start_time,
  };
}
