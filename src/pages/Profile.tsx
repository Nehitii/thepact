import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Flame } from "lucide-react";
import { ProfileAccountSettings } from "@/components/profile/ProfileAccountSettings";
import { ProfileDevilNote } from "@/components/profile/ProfileDevilNote";

export default function Profile() {
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
    <div 
      className="min-h-screen bg-[#00050B] relative overflow-hidden"
    >
      {/* Deep space background with radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      {/* Sci-fi grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(91, 180, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91, 180, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="pt-8 text-center space-y-3 animate-fade-in">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_20px_rgba(91,180,255,0.6)] font-orbitron">
            Profile
          </h1>
          <p className="text-primary/70 tracking-wide font-rajdhani">Your identity console</p>
        </div>

        {/* Menu Cards */}
        {user && (
          <div className="space-y-4">
            {/* Account Information */}
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
        )}

        {/* Credits - removed version info (moved to Terms & Legal) */}
        <div className="text-center py-6 animate-fade-in">
          <div className="flex items-center justify-center gap-2 text-sm text-primary/60">
            <Flame className="h-4 w-4 text-primary animate-glow-pulse" />
            <span className="font-light tracking-wide font-rajdhani">The Pact</span>
          </div>
        </div>

        {/* Extra space at bottom to allow scrolling to reveal Devil Note */}
        <div className="h-16" />
      </div>

      {/* Devil Note - Fixed bottom-right, only visible at bottom */}
      {user && <ProfileDevilNote isVisible={isAtBottom} />}
    </div>
  );
}
