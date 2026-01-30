import { ProfileDisplaySounds } from "@/components/profile/ProfileDisplaySounds";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DisplaySound() {
  const { t } = useTranslation();
  
  return (
    <ProfileSettingsShell
      title={t("settings.displaySound.title")}
      subtitle={t("settings.displaySound.subtitle")}
      icon={<SlidersHorizontal className="h-7 w-7 text-primary" />}
      containerClassName="max-w-2xl"
    >
      <ProfileDisplaySounds />
    </ProfileSettingsShell>
  );
}
