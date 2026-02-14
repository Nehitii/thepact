import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ProfileAccountSettings } from "@/components/profile/ProfileAccountSettings";
import { ProfileDevilNote } from "@/components/profile/ProfileDevilNote";
import { useTranslation } from "react-i18next";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { Loader2, Fingerprint } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight;
    const currentScroll = window.scrollY + window.innerHeight;
    setIsAtBottom(scrollHeight - currentScroll <= 50);
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
      icon={<Fingerprint className="h-8 w-8 text-primary animate-pulse" />}
      floating={user ? <ProfileDevilNote isVisible={isAtBottom} /> : null}
      containerClassName="max-w-5xl"
    >
      <div className="relative space-y-8 pb-20">
        {loading ? (
          <div className="space-y-8">
            <Skeleton className="h-[350px] w-full bg-primary/5 rounded-[2rem]" />
            <Skeleton className="h-[250px] w-full bg-primary/5 rounded-[2rem]" />
          </div>
        ) : user && initialData ? (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <ProfileAccountSettings userId={user.id} initialData={initialData} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
            <p className="font-rajdhani uppercase tracking-widest">{t("common.loading")}</p>
          </div>
        )}
      </div>
    </ProfileSettingsShell>
  );
}
