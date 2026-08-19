import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, MapPin, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import type { CalendarEvent, CalendarEventInsert } from "@/hooks/useCalendarEvents";
import { RecurrenceEditor } from "./RecurrenceEditor";
import { ReminderEditor } from "./ReminderEditor";
import { composerInstant, debutDeJournee, finDeJournee } from "./temps";

const COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
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
  const isEdit = !!event && !event._virtual;

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
  const [color, setColor] = useState(COLORS[0]);
  const [category, setCategory] = useState("general");
  const [isBusy, setIsBusy] = useState(true);
  const [recurrenceRule, setRecurrenceRule] = useState<any>(null);
  const [reminders, setReminders] = useState<{ type: string; minutes_before: number }[]>([]);

  /* Les erreurs ne s affichent qu apres une tentative : signaler un titre
     manquant avant meme que l utilisateur ait eu le temps de le taper
     serait une reprimande, pas une aide. */
  const [soumis, setSoumis] = useState(false);
  const titreRef = useRef<HTMLInputElement>(null);

  /* Ce que l utilisateur a voulu, c est une DUREE — pas un instant de fin
     fige. On la garde pour la reporter quand il deplace le debut. */
  const dureeRef = useRef(DUREE_DEFAUT);

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
      setColor(COLORS[0]);
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-sm">
            {isEdit ? t("calendar.editEvent", "Edit Event") : t("calendar.newEvent", "New Event")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Title */}
          <div>
            <Input
              ref={titreRef}
              placeholder={t("calendar.eventTitle", "Event title")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-medium"
              aria-invalid={!!erreurTitre}
              aria-describedby={erreurTitre ? "cal-err-titre" : undefined}
              autoFocus
            />
            {erreurTitre && (
              <p id="cal-err-titre" role="alert" className="mt-1.5 text-xs text-destructive">
                {erreurTitre.texte}
              </p>
            )}
          </div>

          {/* All day toggle */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-xs">
              <Clock className="h-3.5 w-3.5" />
              {t("calendar.allDay", "All day")}
            </Label>
            <Switch checked={allDay} onCheckedChange={setAllDay} />
          </div>

          {/* Date / Time */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="ds-t-label">{t("calendar.startDate", "Start")}</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => deplacerDebut(e.target.value, startTime)}
                  className="h-9 text-xs"
                />
              </div>
              {!allDay && (
                <div>
                  <Label className="ds-t-label">{t("calendar.startTime", "Time")}</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => deplacerDebut(startDate, e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              )}
              <div>
                <Label className="ds-t-label">{t("calendar.endDate", "End")}</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => reglerFin(e.target.value, endTime)}
                  className="h-9 text-xs"
                  aria-invalid={!!erreurDates}
                  aria-describedby={erreurDates ? "cal-err-dates" : undefined}
                />
              </div>
              {!allDay && (
                <div>
                  <Label className="ds-t-label">{t("calendar.endTime", "Time")}</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => reglerFin(endDate, e.target.value)}
                    className="h-9 text-xs"
                    aria-invalid={!!erreurDates}
                    aria-describedby={erreurDates ? "cal-err-dates" : undefined}
                  />
                </div>
              )}
            </div>
            {erreurDates && (
              <p id="cal-err-dates" role="alert" className="mt-1.5 text-xs text-destructive">
                {erreurDates.texte}
              </p>
            )}
          </div>

          {/* Color picker */}
          <div>
            <Label className="ds-t-label mb-1.5 block">{t("calendar.color", "Color")}</Label>
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full transition-all ring-offset-background"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 2px var(--background), 0 0 0 4px ${c}` : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label className="ds-t-label flex items-center gap-1 mb-1">
              <MapPin className="h-3 w-3" /> {t("calendar.location", "Location")}
            </Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-9 text-xs"
              placeholder={t("common.optional", "Optional")}
            />
          </div>

          {/* Description */}
          <div>
            <Label className="ds-t-label mb-1 block">{t("calendar.description", "Description")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="text-xs min-h-[60px]" />
          </div>

          {/* Recurrence */}
          <RecurrenceEditor rule={recurrenceRule} onChange={setRecurrenceRule} />

          {/* Reminders */}
          <ReminderEditor reminders={reminders} onChange={setReminders} />

          {/* Busy */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">{t("calendar.markBusy", "Mark as busy")}</Label>
            <Switch checked={isBusy} onCheckedChange={setIsBusy} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1">
              {isEdit ? t("common.saveChanges") : t("common.create")}
            </Button>
            {isEdit && onDelete && event && (
              <Button variant="destructive" size="icon" onClick={() => { onDelete(event.id); onClose(); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
