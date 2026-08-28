import { useEffect, useMemo, useRef, useState } from "react";
import {
  format, parseISO, isSameDay, isToday, differenceInMinutes, startOfDay,
} from "date-fns";
import { useTranslation } from "react-i18next";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { useVisibleInterval } from "@/socle/hooks/useVisibleInterval";
import { cn } from "@/socle/outils/utils";
import type { CalendarEvent } from "@/domaines/agenda/types";
import { estImportee, iconeDe } from "@/domaines/agenda/logique/sources";

/* LA GRILLE HORAIRE — une seule fois
 *
 * Le jour et la semaine etaient deux fichiers qui faisaient la meme
 * chose sans la faire pareil : hauteur d heure de 56 contre 48, deux
 * en-tetes differents, deux lignes du moment (rouges toutes les deux, la
 * couleur que l application reserve a ce qui ne va pas), et deux blocs
 * d evenement dont le texte reprenait la teinte brute — le defaut de
 * contraste que la bande avait pourtant deja corrige ailleurs.
 *
 * Il n y a plus qu une grille, configuree par le nombre de colonnes.
 * Elles ne peuvent plus diverger.
 */

const HEURES = Array.from({ length: 24 }, (_, i) => i);
const HAUTEUR_MINIMALE = 22;

interface GrilleHoraireProps {
  jours: Date[];
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onCellClick: (date: Date) => void;
}

interface Pose {
  ev: CalendarEvent;
  haut: number;
  hauteur: number;
  colonne: number;
  colonnes: number;
}

/* Deux rendez-vous qui se chevauchent se partagent la largeur. Sans cela
   le second recouvre le premier, et l un des deux devient invisible. */
function poser(evenements: CalendarEvent[], jour: Date, hauteurHeure: number): Pose[] {
  const bornes = evenements
    .map((ev) => {
      const debut = parseISO(ev.start_time);
      const fin = parseISO(ev.end_time);
      const d = isSameDay(debut, jour) ? differenceInMinutes(debut, startOfDay(jour)) : 0;
      const f = isSameDay(fin, jour) ? differenceInMinutes(fin, startOfDay(jour)) : 24 * 60;
      return { ev, d: Math.max(0, d), f: Math.min(24 * 60, Math.max(f, d + 15)) };
    })
    .sort((a, b) => a.d - b.d || b.f - a.f);

  const poses: Pose[] = [];
  let grappe: typeof bornes = [];
  let finDeGrappe = -1;

  const vider = () => {
    if (!grappe.length) return;
    const finsParColonne: number[] = [];
    const attribuees = grappe.map((b) => {
      let c = finsParColonne.findIndex((fin) => fin <= b.d);
      if (c === -1) { c = finsParColonne.length; finsParColonne.push(0); }
      finsParColonne[c] = b.f;
      return { ...b, colonne: c };
    });
    const colonnes = finsParColonne.length;
    for (const a of attribuees) {
      poses.push({
        ev: a.ev,
        haut: (a.d / 60) * hauteurHeure,
        hauteur: Math.max(HAUTEUR_MINIMALE, ((a.f - a.d) / 60) * hauteurHeure),
        colonne: a.colonne,
        colonnes,
      });
    }
    grappe = [];
    finDeGrappe = -1;
  };

  for (const b of bornes) {
    if (grappe.length && b.d >= finDeGrappe) vider();
    grappe.push(b);
    finDeGrappe = Math.max(finDeGrappe, b.f);
  }
  vider();
  return poses;
}

export function GrilleHoraire({ jours, events, onEventClick, onCellClick }: GrilleHoraireProps) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const defilRef = useRef<HTMLDivElement>(null);
  const [hauteurHeure, setHauteurHeure] = useState(52);

  /* La hauteur d une heure vit dans la feuille de style — elle change
     sous un pointeur grossier — et le placement des blocs doit s y
     accorder au lieu de la redeclarer en JavaScript. */
  useEffect(() => {
    const lire = () => {
      const el = defilRef.current;
      if (!el) return;
      const v = parseFloat(getComputedStyle(el).getPropertyValue("--cal-h-heure"));
      if (v > 0) setHauteurHeure(v);
    };
    lire();
    const mq = window.matchMedia("(pointer: coarse)");
    mq.addEventListener("change", lire);
    return () => mq.removeEventListener("change", lire);
  }, []);

  const [maintenant, setMaintenant] = useState(() => new Date());
  useVisibleInterval(() => setMaintenant(new Date()), 60_000);

  // On ouvre sur l heure courante plutot que sur minuit.
  useEffect(() => {
    const el = defilRef.current;
    if (!el) return;
    el.scrollTop = Math.max(0, (new Date().getHours() - 1) * hauteurHeure);
  }, [hauteurHeure, jours.length]);

  const parJour = useMemo(() => {
    return jours.map((jour) => {
      const duJour = events.filter((ev) => {
        const d = parseISO(ev.start_time);
        const f = parseISO(ev.end_time);
        return isSameDay(d, jour) || isSameDay(f, jour) || (d < jour && f > jour);
      });
      return {
        jour,
        journee: duJour.filter((e) => e.all_day),
        poses: poser(duJour.filter((e) => !e.all_day), jour, hauteurHeure),
      };
    });
  }, [jours, events, hauteurHeure]);

  const aDesEcheances = parJour.some((c) => c.journee.length > 0);
  const minutesDuJour = maintenant.getHours() * 60 + maintenant.getMinutes();

  return (
    /* Sept colonnes dans 345 px font 40 px chacune : illisible, et
       intouchable. Sous 720 px de conteneur la grille garde un plancher
       et defile dans SON cadre — la page, elle, ne bouge pas. */
    <div className="cal-tg-cadre">
    <div className="cal-tg" style={{ ["--cal-tg-cols" as string]: jours.length } as React.CSSProperties}>
      <div className="cal-tg-tetes">
        <div className="cal-tg-tete" aria-hidden="true" />
        {jours.map((jour) => (
          <div key={jour.toISOString()} className={cn("cal-tg-tete", isToday(jour) && "est-auj")}>
            <span className="cal-abrev">{format(jour, "EEE", { locale })}</span>
            <span className="cal-num">{format(jour, "d")}</span>
          </div>
        ))}
      </div>

      {aDesEcheances && (
        <div className="cal-tg-journee">
          <div className="cal-tg-journee-nom">{t("calendar.allDayShort", "Day")}</div>
          {parJour.map(({ jour, journee }) => (
            <div key={jour.toISOString()} className="cal-tg-journee-col">
              {journee.map((ev) => {
                const Icone = iconeDe(ev);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => onEventClick(ev)}
                    className="cal-evt est-compact"
                    data-importe={estImportee(ev._source)}
                    style={{ ["--cal-teinte" as string]: ev.color } as React.CSSProperties}
                    title={ev.title}
                  >
                    <span className="cal-evt-filet" aria-hidden="true" />
                    <Icone className="cal-evt-heure w-2.5 h-2.5" aria-hidden="true" />
                    <span className="cal-evt-titre">{ev.title}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div ref={defilRef} className="cal-tg-corps">
        <div className="cal-tg-heures">
          {HEURES.map((h) => (
            <div key={h} className="cal-tg-heure">{String(h).padStart(2, "0")}:00</div>
          ))}
        </div>

        {parJour.map(({ jour, poses }) => (
          <div key={jour.toISOString()} className={cn("cal-tg-col", isToday(jour) && "est-auj")}>
            {HEURES.map((h) => (
              <button
                key={h}
                type="button"
                className="cal-tg-creneau"
                aria-label={t("calendar.addAtHour", "New event on {{date}} at {{hour}}", {
                  date: format(jour, "EEEE d MMMM", { locale }),
                  hour: `${String(h).padStart(2, "0")}:00`,
                })}
                onClick={() => {
                  const d = new Date(jour);
                  d.setHours(h, 0, 0, 0);
                  onCellClick(d);
                }}
              />
            ))}

            {poses.map(({ ev, haut, hauteur, colonne, colonnes }) => (
              <button
                key={ev.id}
                type="button"
                onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                className="cal-tg-bloc"
                data-importe={estImportee(ev._source)}
                title={`${format(parseISO(ev.start_time), "HH:mm")} – ${format(parseISO(ev.end_time), "HH:mm")} · ${ev.title}`}
                style={{
                  ["--cal-teinte" as string]: ev.color,
                  top: haut,
                  height: hauteur,
                  left: `calc(2px + ${(colonne / colonnes) * 100}%)`,
                  width: `calc(${(1 / colonnes) * 100}% - 5px)`,
                  right: "auto",
                } as React.CSSProperties}
              >
                <span className="cal-tg-titre">{ev.title}</span>
                {hauteur >= 34 && (
                  <span className="cal-tg-h">
                    {format(parseISO(ev.start_time), "HH:mm")} – {format(parseISO(ev.end_time), "HH:mm")}
                  </span>
                )}
              </button>
            ))}

            {isToday(jour) && (
              <div
                className="cal-tg-maintenant"
                style={{ top: (minutesDuJour / 60) * hauteurHeure }}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
