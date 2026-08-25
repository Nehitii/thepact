import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePactSettings } from "@/components/profile/ProfilePactSettings";
import { Loader2 } from "lucide-react";
import { usePactMutation } from "@/hooks/usePactMutation";
import { ConsoleReglages } from "@/components/profile/ConsoleReglages";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

export default function PactSettings() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  /* Deux adresses, une page : « ce que le pacte est » d un cote,
     « ce qu il exige » de l autre. Les donnees ne sont chargees
     qu une fois, quel que soit le volet ouvert. */
  const volet = pathname.endsWith("/pact-rules") ? "exigence" : "identite";
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
  }, [updatePact, pactName, pactMantra, pactSymbol, titleFont, titleEffect]);

  if (!user) return null;

  if (isLoading) {
    return (
      <ConsoleReglages titre={t("settings.pact.title", "Mon pacte")}>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </ConsoleReglages>
    );
  }

  return (
    <ConsoleReglages
      titre={t("settings.pact.title", "Mon pacte")}
      /* Une phrase par volet : la meme servait les deux, et annoncait
         l echeance et la difficulte a une section qui ne porte que le
         nom et le symbole. */
      note={volet === "exigence"
        ? t("settings.pact.rulesSubtitle", "Son échéance, ta difficulté, tes rangs — et ce qui s’efface.")
        : t("settings.pact.identitySubtitle", "Ce que ton pacte est : son nom, sa raison, son symbole.")}
    >
      <ProfilePactSettings
        volet={volet}
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
    </ConsoleReglages>
  );
}
