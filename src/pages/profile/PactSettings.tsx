import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePactSettings } from "@/components/profile/ProfilePactSettings";
import { ScrollText, Loader2 } from "lucide-react";
import { usePactMutation } from "@/hooks/usePactMutation";
import {
  SettingsPageShell, StickyCommandBar,
} from "@/components/profile/settings-ui";

export default function PactSettings() {
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [pactId, setPactId] = useState<string | null>(null);
  const [pactName, setPactName] = useState("");
  const [pactMantra, setPactMantra] = useState("");
  const [pactSymbol, setPactSymbol] = useState("flame");
  const [titleFont, setTitleFont] = useState("orbitron");
  const [titleEffect, setTitleEffect] = useState("none");
  const [projectStartDate, setProjectStartDate] = useState<Date | undefined>(undefined);
  const [projectEndDate, setProjectEndDate] = useState<Date | undefined>(undefined);
  const [customDifficultyName, setCustomDifficultyName] = useState("");
  const [customDifficultyActive, setCustomDifficultyActive] = useState(false);
  const [customDifficultyColor, setCustomDifficultyColor] = useState("#a855f7");
  const [latestLog, setLatestLog] = useState<{ text: string; type: "ok" | "warn" | "info" }>({ text: "PACT CONFIG LOADED", type: "info" });

  const { updatePact, isUpdating } = usePactMutation(user?.id, pactId);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("custom_difficulty_name, custom_difficulty_active, custom_difficulty_color")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        setCustomDifficultyName(profileData.custom_difficulty_name || "");
        setCustomDifficultyActive(profileData.custom_difficulty_active || false);
        setCustomDifficultyColor(profileData.custom_difficulty_color || "#a855f7");
      }

      const { data: pactData } = await supabase
        .from("pacts")
        .select("id, name, mantra, symbol, color, project_start_date, project_end_date, title_font, title_effect")
        .eq("user_id", user.id)
        .maybeSingle();

      if (pactData) {
        setPactId(pactData.id);
        setPactName(pactData.name || "");
        setPactMantra(pactData.mantra || "");
        setPactSymbol(pactData.symbol || "flame");
        setTitleFont(pactData.title_font || "orbitron");
        setTitleEffect(pactData.title_effect || "none");
        if (pactData.project_start_date) setProjectStartDate(new Date(pactData.project_start_date));
        if (pactData.project_end_date) setProjectEndDate(new Date(pactData.project_end_date));
      }
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  const handleSavePactIdentity = useCallback(async () => {
    await updatePact({
      name: pactName.trim(),
      mantra: pactMantra.trim(),
      symbol: pactSymbol,
      title_font: titleFont,
      title_effect: titleEffect,
    });
    setLatestLog({ text: "PACT IDENTITY UPDATED", type: "ok" });
  }, [updatePact, pactName, pactMantra, pactSymbol, titleFont, titleEffect]);

  if (!user) return null;

  if (isLoading) {
    return (
      <SettingsPageShell title="Pact Settings" subtitle="PACT CONFIGURATION" icon={<ScrollText className="h-7 w-7 text-primary" />}>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title="Pact Settings"
      subtitle="Configure your pact identity, timeline, and custom difficulty"
      icon={<ScrollText className="h-7 w-7 text-primary" />}
      stickyBar={<StickyCommandBar latestLog={latestLog} />}
    >
      <ProfilePactSettings
        userId={user.id}
        pactId={pactId}
        pactName={pactName}
        pactMantra={pactMantra}
        pactSymbol={pactSymbol}
        titleFont={titleFont}
        titleEffect={titleEffect}
        onPactNameChange={setPactName}
        onPactMantraChange={setPactMantra}
        onPactSymbolChange={setPactSymbol}
        onTitleFontChange={setTitleFont}
        onTitleEffectChange={setTitleEffect}
        onSavePactIdentity={handleSavePactIdentity}
        isSavingIdentity={isUpdating}
        projectStartDate={projectStartDate}
        projectEndDate={projectEndDate}
        onProjectStartDateChange={setProjectStartDate}
        onProjectEndDateChange={setProjectEndDate}
        customDifficultyName={customDifficultyName}
        customDifficultyActive={customDifficultyActive}
        customDifficultyColor={customDifficultyColor}
        onCustomDifficultyNameChange={setCustomDifficultyName}
        onCustomDifficultyActiveChange={setCustomDifficultyActive}
        onCustomDifficultyColorChange={setCustomDifficultyColor}
      />
    </SettingsPageShell>
  );
}
