import { useState, useEffect, useLayoutEffect, useMemo, useRef, useId } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import type { CalendarEvent, CalendarEventInsert, RecurrenceRule } from "@/hooks/useCalendarEvents";
import { RecurrenceEditor } from "./RecurrenceEditor";
import { ReminderEditor } from "./ReminderEditor";
import { composerInstant, debutDeJournee, finDeJournee } from "./temps";

/* LE FORMULAIRE D EVENEMENT
 *
 * Il etait reste un dialogue de bibliotheque au milieu d une page
 * refaite : coins arrondis, champs a bord doux, pastilles rondes — un
 * vocabulaire que cette page n emploie nulle part ailleurs. Il prend le
 * meme metal : plaque biseautee, rail de coordonnees, champs carres, et
 * des couleurs qui sont des carres comme le reste.
 */

const COLORS: { hex: string; key: string }[] = [
  { hex: "#3b82f6", key: "blue" },
  { hex: "#ef4444", key: "red" },
  { hex: "#22c55e", key: "green" },
  { hex: "#f59e0b", key: "amber" },
  { hex: "#8b5cf6", key: "violet" },
  { hex: "#ec4899", key: "pink" },
  { hex: "#06b6d4", key: "cyan" },
  { hex: "#f97316", key: "orange" },
  { hex: "#14b8a6", key: "teal" },
  { hex: "#6366f1", key: "indigo" },
];

const DUREE_DEFAUT = 3600000;

interface EventDetailModalProps {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  defaultDate?: Date;
  onSave: (data: Partial<CalendarEventInsert>) => void;
  onDelete?: (id: string) => void;
}

export function EventDetailModal({ open, onClose, event, defaultDate, onSave, onDelete }: EventDetailModalProps) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const isEdit = !!event && !event._virtual;

  /* Un prefixe unique par instance : deux dialogues ouverts ne peuvent
     pas se disputer les memes identifiants. */
  const uid = useId();
  const id = (nom: string) => `${uid}-${nom}`;

  const defaultStart = defaultDate ?? new Date();
  const defaultEnd = new Date(defaultStart.getTime() + DUREE_DEFAUT);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState(COLORS[0].hex);
  const [category, setCategory] = useState("general");
  const [isBusy, setIsBusy] = useState(true);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null);
  const [reminders, setReminders] = useState<{ type: string; minutes_before: number }[]>([]);

  /* Les erreurs ne s affichent qu apres une tentative : signaler un titre
     manquant avant meme que l utilisateur ait eu le temps de le taper
     serait une reprimande, pas une aide. */
  const [soumis, setSoumis] = useState(false);
  const titreRef = useRef<HTMLInputElement>(null);

  /* Ce que l utilisateur a voulu, c est une DUREE — pas un instant de fin
     fige. On la garde pour la reporter quand il deplace le debut. */
  const dureeRef = useRef(DUREE_DEFAUT);

  /* LE DIALOGUE SE CENTRE SUR LA ZONE DE CONTENU
     Radix centre sur la fenetre. Avec 280 px de navigation a gauche, le
     dialogue parait alors pousse vers elle. On mesure l ecart entre le
     centre de la zone de travail et celui de la fenetre — et on le suit,
     car la navigation se replie. */
  const [decalage, setDecalage] = useState(0);
  useLayoutEffect(() => {
    if (!open) return;
    const zone = document.querySelector("main");
    if (!zone) return;
    const mesurer = () => {
      const r = zone.getBoundingClientRect();
      setDecalage(Math.round(r.left + r.width / 2 - window.innerWidth / 2));
    };
    mesurer();
    const obs = new ResizeObserver(mesurer);
    obs.observe(zone);
    window.addEventListener("resize", mesurer);
    return () => { obs.disconnect(); window.removeEventListener("resize", mesurer); };
  }, [open]);

  /* Le degrade du bas ne sert que s il reste quelque chose a lire — et
     il disparait des qu on est arrive en bas. Un observateur de taille ne
     suffit pas : la boite garde sa hauteur maximale pendant que son
     contenu grandit, et ne declenche donc rien. */
  const corpsRef = useRef<HTMLDivElement>(null);
  const [entier, setEntier] = useState(true);
  useLayoutEffect(() => {
    const el = corpsRef.current;
    if (!open || !el) return;
    const mesurer = () => {
      const reste = el.scrollHeight - el.clientHeight - el.scrollTop;
      setEntier(reste <= 1);
    };
    mesurer();
    const image = requestAnimationFrame(mesurer);
    const obs = new ResizeObserver(mesurer);
    obs.observe(el);
    for (const enfant of Array.from(el.children)) obs.observe(enfant);
    el.addEventListener("scroll", mesurer, { passive: true });
    return () => {
      cancelAnimationFrame(image);
      obs.disconnect();
      el.removeEventListener("scroll", mesurer);
    };
  }, [open, allDay, recurrenceRule, reminders.length, soumis]);

  useEffect(() => {
    if (event) {
      const s = parseISO(event.start_time);
      const e = parseISO(event.end_time);
      setTitle(event.title);
      setDescription(event.description ?? "");
      setLocation(event.location ?? "");
      setStartDate(format(s, "yyyy-MM-dd"));
      setStartTime(format(s, "HH:mm"));
      setEndDate(format(e, "yyyy-MM-dd"));
      setEndTime(format(e, "HH:mm"));
      setAllDay(event.all_day);
      setColor(event.color);
      setCategory(event.category);
      setIsBusy(event.is_busy);
      setRecurrenceRule(event.recurrence_rule);
      setReminders(event.reminders ?? []);
      dureeRef.current = Math.max(60000, e.getTime() - s.getTime());
    } else {
      setTitle("");
      setDescription("");
      setLocation("");
      setStartDate(format(defaultStart, "yyyy-MM-dd"));
      setStartTime(format(defaultStart, "HH:mm"));
      setEndDate(format(defaultEnd, "yyyy-MM-dd"));
      setEndTime(format(defaultEnd, "HH:mm"));
      setAllDay(false);
      setColor(COLORS[0].hex);
      setCategory("general");
      setIsBusy(true);
      setRecurrenceRule(null);
      setReminders([]);
      dureeRef.current = DUREE_DEFAUT;
    }
    setSoumis(false);
  }, [event, open]);

  /* Les bornes reelles, en dates locales. Elles ne redeviennent des
     chaines qu au dernier moment — et avec leur fuseau. */
  const bornes = useMemo(() => {
    const debut = allDay ? debutDeJournee(startDate) : composerInstant(startDate, startTime);
    const fin = allDay ? finDeJournee(endDate || startDate) : composerInstant(endDate || startDate, endTime);
    return { debut, fin };
  }, [allDay, startDate, startTime, endDate, endTime]);

  const erreurs = useMemo(() => {
    const liste: { champ: "titre" | "dates"; texte: string }[] = [];
    if (!title.trim()) {
      liste.push({ champ: "titre", texte: t("calendar.errors.titleRequired", "Give the event a title.") });
    }
    if (!bornes.debut || !bornes.fin) {
      liste.push({ champ: "dates", texte: t("calendar.errors.dateRequired", "Start and end dates are required.") });
    } else if (bornes.fin.getTime() <= bornes.debut.getTime()) {
      liste.push({ champ: "dates", texte: t("calendar.errors.endBeforeStart", "The end must come after the start.") });
    }
    return liste;
  }, [title, bornes, t]);

  const erreurTitre = soumis ? erreurs.find((e) => e.champ === "titre") : undefined;
  const erreurDates = soumis ? erreurs.find((e) => e.champ === "dates") : undefined;

  /* Deplacer le debut deplace la fin d autant. Sans cela, avancer un
     rendez-vous de 21 h a 14 h laissait la fin a 21 h — un evenement de
     sept heures ; et en le reculant, une fin avant son propre debut. */
  const deplacerDebut = (date: string, heure: string) => {
    setStartDate(date);
    setStartTime(heure);
    const debut = allDay ? debutDeJournee(date) : composerInstant(date, heure);
    if (!debut) return;
    const fin = new Date(debut.getTime() + dureeRef.current);
    setEndDate(format(fin, "yyyy-MM-dd"));
    if (!allDay) setEndTime(format(fin, "HH:mm"));
  };

  const reglerFin = (date: string, heure: string) => {
    setEndDate(date);
    setEndTime(heure);
    const debut = allDay ? debutDeJournee(startDate) : composerInstant(startDate, startTime);
    const fin = allDay ? finDeJournee(date) : composerInstant(date, heure);
    if (debut && fin) dureeRef.current = Math.max(60000, fin.getTime() - debut.getTime());
  };

  /* Le bouton restait actif sur un formulaire vide et ne faisait rien :
     zero ecriture, zero message, le dialogue ouvert. On clique toujours,
     mais on obtient desormais une reponse. */
  const handleSave = () => {
    setSoumis(true);
    if (erreurs.length > 0) {
      if (!title.trim()) titreRef.current?.focus();
      return;
    }
    onSave({
      title: title.trim(),
      description: description || null,
      location: location || null,
      start_time: bornes.debut!.toISOString(),
      end_time: bornes.fin!.toISOString(),
      all_day: allDay,
      color,
      category,
      is_busy: isBusy,
      recurrence_rule: recurrenceRule,
      reminders,
      tags: [],
    });
    onClose();
  };

  const reference = bornes.debut ? format(bornes.debut, "yyyy.MM.dd", { locale }) : "————.——.——";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="cal cal-dlg sm:max-w-lg max-h-[92vh] border-0 bg-transparent p-0 shadow-none [&>button]:hidden"
        style={{ ["--cal-dlg-decalage" as string]: `${decalage}px` } as React.CSSProperties}
      >
        <div className="cal-dlg-rail">
          <b>CAL.01</b>
          <i />
          <DialogTitle asChild>
            {/* « Event » nomme le BOUTON de la barre ; le dialogue, lui,
                doit dire ce qu il ouvre. */}
            <span>{isEdit ? t("calendar.editEvent", "Edit event") : t("calendar.newEventTitle", "New event")}</span>
          </DialogTitle>
          <i />
          <span>{reference}</span>
        </div>

        <div ref={corpsRef} className={`cal-dlg-corps${entier ? " est-entier" : ""}`}>
          {/* Une invite n est pas un libelle : elle s efface des qu on tape. */}
          <div className="cal-dlg-champ">
            <label className="cal-dlg-etiq" htmlFor={id("titre")}>
              {t("calendar.eventTitle", "Event title")}
            </label>
            <input
              id={id("titre")}
              ref={titreRef}
              className="h-10 w-full px-3 text-base font-medium"
              placeholder={t("calendar.eventTitle", "Event title")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!erreurTitre}
              aria-describedby={erreurTitre ? id("err-titre") : undefined}
              autoFocus
            />
            {erreurTitre && (
              <p id={id("err-titre")} role="alert" className="cal-dlg-erreur">{erreurTitre.texte}</p>
            )}
          </div>

          {/* Un <label for> ne mord pas sur un bouton : l interrupteur se
              nomme donc par aria-labelledby. */}
          <div className="cal-dlg-ligne" style={{ borderTop: 0, paddingTop: 0 }}>
            <span id={id("lbl-journee")} className="cal-dlg-etiq">{t("calendar.allDay", "All day")}</span>
            <Switch checked={allDay} onCheckedChange={setAllDay} aria-labelledby={id("lbl-journee")} />
          </div>

          <div>
            <div className="cal-dlg-duo">
              <div className="cal-dlg-champ">
                <label className="cal-dlg-etiq" htmlFor={id("debut-date")}>{t("calendar.startDate", "Start")}</label>
                <input
                  id={id("debut-date")}
                  type="date"
                  className="h-9 w-full px-2.5"
                  value={startDate}
                  onChange={(e) => deplacerDebut(e.target.value, startTime)}
                />
              </div>
              {!allDay && (
                <div className="cal-dlg-champ">
                  <label className="cal-dlg-etiq" htmlFor={id("debut-heure")}>{t("calendar.startTime", "Time")}</label>
                  <input
                    id={id("debut-heure")}
                    type="time"
                    /* Deux champs nommes « Heure » dans le meme formulaire :
                       la mise en page les distingue, l annonce non. */
                    aria-label={t("calendar.startTimeFull", "Start time")}
                    className="h-9 w-full px-2.5"
                    value={startTime}
                    onChange={(e) => deplacerDebut(startDate, e.target.value)}
                  />
                </div>
              )}
              <div className="cal-dlg-champ">
                <label className="cal-dlg-etiq" htmlFor={id("fin-date")}>{t("calendar.endDate", "End")}</label>
                <input
                  id={id("fin-date")}
                  type="date"
                  className="h-9 w-full px-2.5"
                  value={endDate}
                  onChange={(e) => reglerFin(e.target.value, endTime)}
                  aria-invalid={!!erreurDates}
                  aria-describedby={erreurDates ? id("err-dates") : undefined}
                />
              </div>
              {!allDay && (
                <div className="cal-dlg-champ">
                  <label className="cal-dlg-etiq" htmlFor={id("fin-heure")}>{t("calendar.endTime", "Time")}</label>
                  <input
                    id={id("fin-heure")}
                    type="time"
                    aria-label={t("calendar.endTimeFull", "End time")}
                    className="h-9 w-full px-2.5"
                    value={endTime}
                    onChange={(e) => reglerFin(endDate, e.target.value)}
                    aria-invalid={!!erreurDates}
                    aria-describedby={erreurDates ? id("err-dates") : undefined}
                  />
                </div>
              )}
            </div>
            {erreurDates && (
              <p id={id("err-dates")} role="alert" className="cal-dlg-erreur">{erreurDates.texte}</p>
            )}
          </div>

          <div>
            <span id={id("lbl-couleur")} className="cal-dlg-etiq">{t("calendar.color", "Color")}</span>
            <div className="cal-dlg-couleurs" role="group" aria-labelledby={id("lbl-couleur")}>
              {COLORS.map(({ hex, key }) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  aria-label={t(`calendar.colors.${key}`, key)}
                  aria-pressed={color === hex}
                  className="cal-dlg-couleur"
                  style={{ ["--cal-teinte" as string]: hex } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          <div className="cal-dlg-champ">
            <label className="cal-dlg-etiq" htmlFor={id("lieu")}>{t("calendar.location", "Location")}</label>
            <input
              id={id("lieu")}
              className="h-9 w-full px-2.5 text-sm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("common.optional", "Optional")}
            />
          </div>

          <div className="cal-dlg-champ">
            <label className="cal-dlg-etiq" htmlFor={id("description")}>{t("calendar.description", "Description")}</label>
            <textarea
              id={id("description")}
              className="w-full min-h-[68px] px-2.5 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <RecurrenceEditor rule={recurrenceRule} onChange={setRecurrenceRule} />
          <ReminderEditor reminders={reminders} onChange={setReminders} />

          <div className="cal-dlg-ligne">
            <span id={id("lbl-occupe")} className="cal-dlg-etiq">{t("calendar.markBusy", "Mark as busy")}</span>
            <Switch checked={isBusy} onCheckedChange={setIsBusy} aria-labelledby={id("lbl-occupe")} />
          </div>
        </div>

        {/* Hors du corps qui defile : « Creer » ne doit pas se trouver sous
            le pli d un formulaire qui fait huit cents pixels. */}
        <div className="cal-dlg-actions">
            <button type="button" onClick={handleSave} className="cal-outil est-primaire est-large">
              {isEdit ? t("common.saveChanges") : t("common.create")}
            </button>
            <button type="button" onClick={onClose} className="cal-outil">
              {t("common.cancel")}
            </button>
            {isEdit && onDelete && event && (
              <button
                type="button"
                onClick={() => { onDelete(event.id); onClose(); }}
                className="cal-outil est-danger est-icone"
                aria-label={t("calendar.deleteEvent", "Delete event")}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
