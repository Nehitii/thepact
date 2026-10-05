import { CalendarPage } from "@/components/calendar";
import { DSPageShell, DSPageHeader, DSBackground } from "@/components/ds";
import { useTranslation } from "react-i18next";

export default function Calendar() {
  const { t } = useTranslation();
  return (
    <DSPageShell width="xl" background={<DSBackground variant="cyber" />}>
      <div className="space-y-4">
        <DSPageHeader
          variant="hud"
          systemLabel="CAL.01"
          title={t("calendar.title", "Calendar")}
          titleAccent="Plan"
        />
        <CalendarPage />
      </div>
    </DSPageShell>
  );
}
