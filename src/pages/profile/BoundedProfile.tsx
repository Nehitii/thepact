import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProfileBoundedProfile } from "@/components/profile/ProfileBoundedProfile";
import { UserCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  SettingsPageShell, StickyCommandBar,
} from "@/components/profile/settings-ui";

export default function BoundedProfile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [latestLog] = useState<{ text: string; type: "ok" | "warn" | "info" }>({ text: "PROFILE CONFIG LOADED", type: "info" });

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
    <SettingsPageShell
      title={t("settings.boundedProfile.title")}
      subtitle={t("settings.boundedProfile.subtitle")}
      icon={<UserCircle2 className="h-7 w-7 text-primary" />}
      stickyBar={<StickyCommandBar latestLog={latestLog} />}
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
    </SettingsPageShell>
  );
}
