import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { composerInstant, debutDeJournee, finDeJournee } from "@/domaines/agenda/logique/temps";
import { COLORS, DUREE_DEFAUT } from "@/domaines/agenda/logique/apparenceDEvenement";
import type { CalendarEvent, CalendarEventInsert, RecurrenceRule } from "@/domaines/agenda/types";

/* LA MACHINE A ETATS DU FORMULAIRE D EVENEMENT.
 *
 * Treize champs, une synchronisation a l ouverture, deux bornes, trois
 * regles de refus et deux deplaceurs de date. Tout cela vivait dans le
 * composant, entre deux `useLayoutEffect` qui, eux, s occupent
 * vraiment de dessin — centrer le calque, faire disparaitre un degrade.
 *
 * LA MACHINE A ETATS D UN FORMULAIRE N EST PAS SON DESSIN. Separees,
 * les regles de saisie deviennent lisibles d un coup, et le composant
 * redevient ce qu il pretend etre : un rendu.
 */
export function useFormulaireDEvenement({
  event, open, defaultDate, onSave, onClose,
}: {
  event?: CalendarEvent | null;
  open: boolean;
  defaultDate?: Date;
  onSave: (data: Partial<CalendarEventInsert>) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  const defaultStart = useMemo(() => defaultDate ?? new Date(), [defaultDate]);
  const defaultEnd = useMemo(() => new Date(defaultStart.getTime() + DUREE_DEFAUT), [defaultStart]);

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
  }, [event, open, defaultStart, defaultEnd]);

  const bornes = useMemo(
    () => bornesDuFormulaire({ allDay, startDate, startTime, endDate, endTime }),
    [allDay, startDate, startTime, endDate, endTime],
  );

  const erreurs = useMemo(
    () => refusDeSaisie(title, bornes, {
      titre: t("calendar.errors.titleRequired", "Give the event a title."),
      dates: t("calendar.errors.dateRequired", "Start and end dates are required."),
      ordre: t("calendar.errors.endBeforeStart", "The end must come after the start."),
    }),
    [title, bornes, t],
  );

  const erreurTitre = soumis ? erreurs.find((e) => e.champ === "titre") : undefined;
  const erreurDates = soumis ? erreurs.find((e) => e.champ === "dates") : undefined;

  /* Deplacer le debut deplace la fin d autant. Sans cela, avancer un
     rendez-vous de 21 h a 14 h laissait la fin a 21 h — un evenement de
     sept heures ; et en le reculant, une fin avant son propre debut. */
  const deplacerDebut = (date: string, heure: string) => {
    setStartDate(date);
    setStartTime(heure);
    const debut = instantDeDebut(allDay, date, heure);
    if (!debut) return;
    const fin = new Date(debut.getTime() + dureeRef.current);
    setEndDate(format(fin, "yyyy-MM-dd"));
    if (!allDay) setEndTime(format(fin, "HH:mm"));
  };

  const reglerFin = (date: string, heure: string) => {
    setEndDate(date);
    setEndTime(heure);
    const debut = instantDeDebut(allDay, startDate, startTime);
    const fin = instantDeFin(allDay, date, heure);
    if (debut && fin) dureeRef.current = dureeRetenue(debut, fin);
  };

  /* Le bouton restait actif sur un formulaire vide et ne faisait rien :
     zero ecriture, zero message, le dialogue ouvert. On clique toujours,
     mais on obtient desormais une reponse. */
  const enregistrer = () => {
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

  return {
    title, setTitle, description, setDescription, location, setLocation,
    startDate, startTime, endDate, endTime,
    allDay, setAllDay, color, setColor, category, setCategory,
    isBusy, setIsBusy, recurrenceRule, setRecurrenceRule, reminders, setReminders,
    titreRef, bornes, erreurs, erreurTitre, erreurDates,
    deplacerDebut, reglerFin, enregistrer,
  };
}

/* ─────────────────────────────────────────────────────────────
   LES TROIS DECISIONS, SORTIES DU CROCHET POUR ETRE EPROUVEES.
   Un crochet ne s appelle pas depuis un test sans monter un rendu ;
   ces trois-la ne dependent que de leurs arguments.
   ───────────────────────────────────────────────────────────── */

export function instantDeDebut(allDay: boolean, date: string, heure: string): Date | null {
  return allDay ? debutDeJournee(date) : composerInstant(date, heure);
}

export function instantDeFin(allDay: boolean, date: string, heure: string): Date | null {
  return allDay ? finDeJournee(date) : composerInstant(date, heure);
}

/** Les bornes reelles, en dates locales. Elles ne redeviennent des
 *  chaines qu au dernier moment — et avec leur fuseau. */
export function bornesDuFormulaire({
  allDay, startDate, startTime, endDate, endTime,
}: {
  allDay: boolean; startDate: string; startTime: string; endDate: string; endTime: string;
}): { debut: Date | null; fin: Date | null } {
  const debut = instantDeDebut(allDay, startDate, startTime);
  /* UNE FIN SANS DATE PREND CELLE DU DEBUT. Un evenement d une heure se
     saisit en tapant deux heures et une seule date ; exiger la seconde
     serait un peage. */
  const fin = instantDeFin(allDay, endDate || startDate, endTime);
  return { debut, fin };
}

export interface Refus { champ: "titre" | "dates"; texte: string }

/** Les trois raisons de refuser une saisie, et leur ordre. */
export function refusDeSaisie(
  titre: string,
  bornes: { debut: Date | null; fin: Date | null },
  messages: { titre: string; dates: string; ordre: string },
): Refus[] {
  const liste: Refus[] = [];
  if (!titre.trim()) liste.push({ champ: "titre", texte: messages.titre });
  if (!bornes.debut || !bornes.fin) {
    liste.push({ champ: "dates", texte: messages.dates });
  } else if (bornes.fin.getTime() <= bornes.debut.getTime()) {
    /* `<=` et non `<` : un evenement de duree nulle ne se voit pas sur
       une grille horaire, donc il n existe pas pour qui le relit. */
    liste.push({ champ: "dates", texte: messages.ordre });
  }
  return liste;
}

/** La duree retenue quand on regle la fin. Une minute au moins : c est
 *  la plus petite duree qui laisse une trace sur une grille. */
export const dureeRetenue = (debut: Date, fin: Date) =>
  Math.max(60000, fin.getTime() - debut.getTime());
