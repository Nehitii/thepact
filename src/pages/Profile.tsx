import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ProfileAccountSettings } from "@/components/profile/ProfileAccountSettings";
import { ProfileDevilNote } from "@/components/profile/ProfileDevilNote";
import { useTranslation } from "react-i18next";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { User, Loader2, Fingerprint } from "lucide-react";
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
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setInitialData({
          email: user.email || "",
          displayName: data.display_name || "",
          timezone: data.timezone || "UTC",
          language: data.language || "en",
          currency: data.currency || "eur",
          birthday: data.birthday ? new Date(data.birthday) : undefined,
          country: data.country || "",
        });
      }
      setLoading(false);
    };
    loadData();
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
          <div className="space-y-6">
            <Skeleton className="h-[300px] w-full bg-primary/5 rounded-3xl" />
            <Skeleton className="h-[400px] w-full bg-primary/5 rounded-3xl" />
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
