import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ProfileAccountSettings } from "@/components/profile/ProfileAccountSettings";
import { ProfileDevilNote } from "@/components/profile/ProfileDevilNote";
import { useTranslation } from "react-i18next";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { User } from "lucide-react";

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Account settings
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("eur");
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  const [country, setCountry] = useState("");
  
  // Bounded Profile settings
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Pact settings
  const [pactId, setPactId] = useState<string | null>(null);
  const [projectStartDate, setProjectStartDate] = useState<Date | undefined>(undefined);
  const [projectEndDate, setProjectEndDate] = useState<Date | undefined>(undefined);
  const [customDifficultyName, setCustomDifficultyName] = useState("");
  const [customDifficultyActive, setCustomDifficultyActive] = useState(false);
  const [customDifficultyColor, setCustomDifficultyColor] = useState("#a855f7");

  // Devil Note visibility - only show when scrolled to bottom
  const [isAtBottom, setIsAtBottom] = useState(false);

  // Scroll detection for Devil Note visibility - using window scroll
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const threshold = 50; // pixels from bottom
    
    setIsAtBottom(distanceFromBottom <= threshold);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial state
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setDisplayName(data.display_name || "");
        setTimezone(data.timezone || "UTC");
        setLanguage(data.language || "en");
        setCurrency(data.currency || "eur");
        setBirthday(data.birthday ? new Date(data.birthday) : undefined);
        setCountry(data.country || "");
        setAvatarUrl(data.avatar_url || null);
        setCustomDifficultyName(data.custom_difficulty_name || "");
        setCustomDifficultyActive(data.custom_difficulty_active || false);
        setCustomDifficultyColor(data.custom_difficulty_color || "#a855f7");
      }

      // Load pact data
      const { data: pactData } = await supabase
        .from("pacts")
        .select("id, project_start_date, project_end_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (pactData) {
        setPactId(pactData.id);
        if (pactData.project_start_date) {
          setProjectStartDate(new Date(pactData.project_start_date));
        }
        if (pactData.project_end_date) {
          setProjectEndDate(new Date(pactData.project_end_date));
        }
      }
    };

    loadProfile();
  }, [user]);

  return (
    <ProfileSettingsShell
      title={t("profile.title")}
      subtitle={t("profile.subtitle")}
      icon={<User className="h-7 w-7 text-primary" />}
      floating={user ? <ProfileDevilNote isVisible={isAtBottom} /> : null}
      containerClassName="max-w-2xl"
    >
      {user ? (
        <div className="space-y-4">
          <ProfileAccountSettings
            userId={user.id}
            email={user.email || ""}
            displayName={displayName}
            timezone={timezone}
            language={language}
            currency={currency}
            birthday={birthday}
            country={country}
            onDisplayNameChange={setDisplayName}
            onTimezoneChange={setTimezone}
            onLanguageChange={setLanguage}
            onCurrencyChange={setCurrency}
            onBirthdayChange={setBirthday}
            onCountryChange={setCountry}
          />
        </div>
      ) : null}
      <div className="h-16" />
    </ProfileSettingsShell>
  );
}
