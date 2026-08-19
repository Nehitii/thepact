import { CalendarPage } from "@/components/calendar";
import { DSPageShell, DSPageHeader, DSBackground } from "@/components/ds";
import { useTranslation } from "react-i18next";
import "@/styles/calendar.css";

export default function Calendar() {
  const { t } = useTranslation();

  /* Le titre et son accent se collent sans separateur : « Calendar » plus
     « Plan » donnait CALENDARPLAN, un mot qui n existe pas. Ailleurs dans
     l application l accent est la QUEUE du mot — FIN|ANCE, HE|ALTH,
     WISH|LIST. On coupe donc le titre traduit lui-meme, ce qui tient dans
     les deux langues : CALEND|AR, CALENDRI|ER. */
  const titre = t("calendar.title", "Calendar");
  const coupe = Math.max(1, titre.length - 2);

  return (
    <DSPageShell width="xl" background={<DSBackground variant="cyber" />}>
      <div className="space-y-4">
        <DSPageHeader
          variant="hud"
          systemLabel="CAL.01 // TIMELINE"
          title={titre.slice(0, coupe)}
          titleAccent={titre.slice(coupe)}
        />
        <CalendarPage />
      </div>
    </DSPageShell>
  );
}
