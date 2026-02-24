import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ProfileAccountSettings } from "@/components/profile/ProfileAccountSettings";
import { ProfileDevilNote } from "@/components/profile/ProfileDevilNote";
import { useTranslation } from "react-i18next";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { User, Loader2 } from "lucide-react";

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // On ne garde qu'un seul état pour les données chargées
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    setIsAtBottom(distanceFromBottom <= 50);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!user) return;

    const loadProfileData = async () => {
      setLoading(true);
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

      if (profile) {
        setInitialData({
          email: user.email || "",
          displayName: profile.display_name || "",
          timezone: profile.timezone || "UTC",
          language: profile.language || "en",
          currency: profile.currency || "eur",
          birthday: profile.birthday ? new Date(profile.birthday) : undefined,
          country: profile.country || "",
        });
      }
      setLoading(false);
    };

    loadProfileData();
  }, [user]);

  return (
    <ProfileSettingsShell
      title={t("profile.title")}
      subtitle={t("profile.subtitle")}
      icon={<User className="h-7 w-7 text-primary" />}
      floating={user ? <ProfileDevilNote isVisible={isAtBottom} /> : null}
      containerClassName="max-w-3xl"
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : user && initialData ? (
        <div className="space-y-6">
          <ProfileAccountSettings userId={user.id} initialData={initialData} />
        </div>
      ) : null}
      <div className="h-16" />
    </ProfileSettingsShell>
  );
}
