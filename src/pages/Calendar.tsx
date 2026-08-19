import { useState } from "react";
import { format } from "date-fns";
import { CalendarPage } from "@/components/calendar";
import { DSPageShell, DSBackground } from "@/components/ds";
import { useTranslation } from "react-i18next";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";
import "@/styles/calendar.css";

/* LE BANDEAU
 *
 * Il portait « CAL.01 // TIMELINE » et le titre de la page, au-dessus
 * d un rail qui disait deja « CAL.01 » : deux fois la meme identite, et
 * pas une information. Le partage est desormais net — le bandeau porte
 * l identite et l heure, le rail porte les coordonnees de la vue.
 *
 * L accent reste la queue du mot, comme ailleurs dans l application
 * (FIN|ANCE, HE|ALTH, WISH|LIST) : CALEND|AR en anglais, CALENDRI|ER en
 * francais. On coupe le titre traduit lui-meme, ce qui tient dans les
 * deux langues.
 */

export default function Calendar() {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();

  // Une minute suffit : l horloge s arrete quand l onglet est cache.
  const [maintenant, setMaintenant] = useState(() => new Date());
  useVisibleInterval(() => setMaintenant(new Date()), 60_000);

  const titre = t("calendar.title", "Calendar");
  const coupe = Math.max(1, titre.length - 2);

  return (
    <DSPageShell width="xl" background={<DSBackground variant="cyber" />}>
      <div className="cal max-w-7xl mx-auto">
        <header className="cal-entete">
          <div className="cal-entete-rail">
            <b>CAL.01</b>
            <i />
            <span>{format(maintenant, "EEE d MMM", { locale })}</span>
            <i />
            <b>{format(maintenant, "HH:mm")}</b>
          </div>
          <div className="cal-entete-corps">
            <h1 className="cal-entete-titre">
              {titre.slice(0, coupe)}
              <em>{titre.slice(coupe)}</em>
            </h1>
            <p className="cal-entete-sous">{t("calendar.subtitle", "Plan, organise, conquer.")}</p>
          </div>
        </header>

        <CalendarPage />
      </div>
    </DSPageShell>
  );
}
