import { useState, useEffect, useLayoutEffect, useMemo, useRef, useId } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/socle/ui/dialog";
import { Switch } from "@/socle/ui/switch";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import type { CalendarEvent, CalendarEventInsert, RecurrenceRule } from "@/domaines/agenda/types";
import { RecurrenceEditor } from "./RecurrenceEditor";
import { ReminderEditor } from "./ReminderEditor";
import { composerInstant, debutDeJournee, finDeJournee } from "@/domaines/agenda/logique/temps";
import type { EventDetailModalProps } from "@/domaines/agenda/types";
import { COLORS } from "@/domaines/agenda/logique/apparenceDEvenement";
import { useFormulaireDEvenement } from "@/domaines/agenda/hooks/useFormulaireDEvenement";

/* LE FORMULAIRE D EVENEMENT
 *
 * Il etait reste un dialogue de bibliotheque au milieu d une page
 * refaite : coins arrondis, champs a bord doux, pastilles rondes — un
 * vocabulaire que cette page n emploie nulle part ailleurs. Il prend le
 * meme metal : plaque biseautee, rail de coordonnees, champs carres, et
 * des couleurs qui sont des carres comme le reste.
 */

export function EventDetailModal({ open, onClose, event, defaultDate, onSave, onDelete }: EventDetailModalProps) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const isEdit = !!event && !event._virtual;

  /* Un prefixe unique par instance : deux dialogues ouverts ne peuvent
     pas se disputer les memes identifiants. */
  const uid = useId();
  const id = (nom: string) => `${uid}-${nom}`;

  /* CES DEUX-LÀ ÉTAIENT DES OBJETS NEUFS À CHAQUE RENDU.
     `new Date()` sans mémorisation rend une valeur différente à chaque
     passage : inscrites dans les dépendances de l'effet qui remplit le
     formulaire, elles l'auraient relancé en boucle — et remis les champs
     à zéro pendant la frappe. C'est pour ça qu'elles en étaient absentes,
     et c'est pour ça que l'absence était un pansement. Mémorisées, elles
     peuvent y figurer, et l'effet ne repart que quand la date change. */
  /* La machine a etats vit dans `hooks/useFormulaireDEvenement.ts`.
     Ce qui reste ici est du DESSIN : centrer le calque, faire
     disparaitre un degrade, et rendre les champs. */
  const f = useFormulaireDEvenement({ event, open, defaultDate, onSave, onClose });
  const {
    title, setTitle, description, setDescription, location, setLocation,
    startDate, startTime, endDate, endTime,
    allDay, setAllDay, color, setColor, category, setCategory,
    isBusy, setIsBusy, recurrenceRule, setRecurrenceRule, reminders, setReminders,
    titreRef, erreurTitre, erreurDates, bornes,
    deplacerDebut, reglerFin, enregistrer,
  } = f;

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
  /* Ce qui change vraiment la hauteur du corps, c est l APPARITION
     d un message d erreur — pas le fait d avoir soumis. Nomme, pour
     que le tableau de dependances se verifie tout seul. */
  const messageAffiche = !!erreurTitre || !!erreurDates;
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
  }, [open, allDay, recurrenceRule, reminders.length, messageAffiche]);

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
            <button type="button" onClick={enregistrer} className="cal-outil est-primaire est-large">
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
