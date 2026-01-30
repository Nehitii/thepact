import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ProfileBoundedProfile } from "@/components/profile/ProfileBoundedProfile";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { UserCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function BoundedProfile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setDisplayName(data.display_name || "");
        setAvatarUrl(data.avatar_url || null);
      }
    };

    loadProfile();
  }, [user]);

  if (!user) return null;

  return (
    <ProfileSettingsShell
      title={t("settings.boundedProfile.title")}
      subtitle={t("settings.boundedProfile.subtitle")}
      icon={<UserCircle2 className="h-7 w-7 text-primary" />}
      containerClassName="max-w-2xl"
    >
      <ProfileBoundedProfile
        userId={user.id}
        displayName={displayName}
        avatarUrl={avatarUrl}
        avatarFrame=""
        personalQuote=""
        displayedBadges={[]}
        onAvatarUrlChange={setAvatarUrl}
        onAvatarFrameChange={() => {}}
        onPersonalQuoteChange={() => {}}
        onDisplayedBadgesChange={() => {}}
      />
    </ProfileSettingsShell>
  );
}
