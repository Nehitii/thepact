import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { aLHeure } from "@/domaines/agenda/logique/temps";

/* LA SAISIE RAPIDE
 *
 * Elle etait restee un composant de bibliotheque au milieu d une page
 * refaite : coins arrondis, fond gris, champ a bord doux. Elle prend le
 * meme metal que le reste — la plaque, le rail, le biseau — en plus
 * petit, parce qu elle ne demande qu une chose.
 */

interface EventQuickAddProps {
  date: Date;
  open: boolean;
  /* Le declencheur de Radix appelle onOpenChange(true) au clic ET a la
     touche Entree. Faute de recevoir cette ouverture, la case avait du
     poser un onDoubleClick a la main — un chemin que le clavier ne peut
     pas emprunter, puisque Entree produit un clic, jamais un double. */
  onOpen: () => void;
  onClose: () => void;
  onSave: (data: { title: string; start_time: string; end_time: string; all_day: boolean }) => void;
  children: React.ReactNode;
}

export function EventQuickAdd({ date, open, onOpen, onClose, onSave, children }: EventQuickAddProps) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const [title, setTitle] = useState("");

  const handleSave = () => {
    if (!title.trim()) return;
    /* Une vraie date locale, serialisee avec son fuseau : la chaine collee
       « aaaa-mm-jjT09:00:00 » etait relue par Postgres dans le fuseau du
       serveur, et deplacait le rendez-vous. */
    onSave({
      title: title.trim(),
      start_time: aLHeure(date, 9).toISOString(),
      end_time: aLHeure(date, 10).toISOString(),
      all_day: false,
    });
    setTitle("");
    onClose();
  };

  return (
    <Popover open={open} onOpenChange={(o) => (o ? onOpen() : onClose())}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto border-0 bg-transparent p-0 shadow-none"
      >
        <div className="cal cal-dlg cal-qa">
          <div className="cal-dlg-rail">
            <b>{format(date, "dd.MM", { locale })}</b>
            <i />
            <span>{format(date, "EEEE", { locale })}</span>
          </div>

          <div className="cal-dlg-corps">
            <div className="cal-dlg-champ">
              <label className="cal-dlg-etiq" htmlFor="cal-qa-titre">
                {t("calendar.eventTitle", "Event title")}
              </label>
              <input
                id="cal-qa-titre"
                className="h-9 w-full px-2.5"
                placeholder={t("calendar.eventTitle", "Event title")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                autoFocus
              />
              <p className="cal-dlg-indice">{t("calendar.quickAddHint")}</p>
            </div>

            <div className="cal-dlg-actions">
              <button
                type="button"
                className={"cal-outil est-large " + (title.trim() ? "est-primaire" : "est-inerte")}
                onClick={handleSave}
                aria-disabled={!title.trim()}
              >
                {t("common.create")}
              </button>
              <button type="button" className="cal-outil" onClick={onClose}>
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
