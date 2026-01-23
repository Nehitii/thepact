import { ProfileDisplaySounds } from "@/components/profile/ProfileDisplaySounds";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { SlidersHorizontal } from "lucide-react";

export default function DisplaySound() {
  return (
    <ProfileSettingsShell
      title="Display & Sound"
      subtitle="Customize your visual and audio experience"
      icon={<SlidersHorizontal className="h-7 w-7 text-primary" />}
      containerClassName="max-w-2xl"
    >
      <ProfileDisplaySounds />
    </ProfileSettingsShell>
  );
}
