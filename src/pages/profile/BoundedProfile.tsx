import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProfileBoundedProfile } from "@/components/profile/ProfileBoundedProfile";
import { useTranslation } from "react-i18next";
import { ConsoleReglages } from "@/components/profile/ConsoleReglages";
import { Panneau } from "@/components/profile/console-ui";

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
    <ConsoleReglages
      titre={t("settings.boundedProfile.title")}
      note={t("settings.boundedProfile.subtitle")}
    >
      {/* Seule section a n avoir porte aucun panneau : l editeur
          dessinait sa propre mise en page et detonnait au milieu des
          six autres. Il vit maintenant dans le meme cadre. */}
      <Panneau code="Ta carte publique" etat={t("settings.console.synced", "synchronisé")} ton="actif">
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
      </Panneau>
    </ConsoleReglages>
  );
}
