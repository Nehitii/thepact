import { CalendarPage } from "@/components/calendar";
import { ModuleHeader } from "@/components/layout";
import { CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Calendar() {
  const { t } = useTranslation();
  return (
    <div className="p-4 md:p-6 space-y-4">
      <ModuleHeader
        icon={CalendarDays}
        title={t("calendar.title", "Calendar")}
        subtitle={t("calendar.subtitle", "Plan, organize, conquer.")}
      />
      <CalendarPage />
    </div>
  );
}
