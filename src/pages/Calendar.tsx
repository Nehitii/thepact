import { CalendarPage } from "@/components/calendar";
import { ModuleHeader } from "@/components/layout";
import { useTranslation } from "react-i18next";

export default function Calendar() {
  const { t } = useTranslation();
  return (
    <div className="p-4 md:p-6 space-y-4">
      <ModuleHeader
        systemLabel="CAL.01"
        title={t("calendar.title", "Calendar")}
        titleAccent="Plan"
      />
      <CalendarPage />
    </div>
  );
}
