import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ProfilePactSettings } from "@/components/profile/ProfilePactSettings";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { ScrollText } from "lucide-react";

export default function PactSettings() {
  const { user } = useAuth();
  const [pactId, setPactId] = useState<string | null>(null);
  const [projectStartDate, setProjectStartDate] = useState<Date | undefined>(undefined);
  const [projectEndDate, setProjectEndDate] = useState<Date | undefined>(undefined);
  const [customDifficultyName, setCustomDifficultyName] = useState("");
  const [customDifficultyActive, setCustomDifficultyActive] = useState(false);
  const [customDifficultyColor, setCustomDifficultyColor] = useState("#a855f7");

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      // Load profile data
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

    loadData();
  }, [user]);

  if (!user) return null;

  return (
    <ProfileSettingsShell
      title="Pact Settings"
      subtitle="Configure your pact timeline and custom difficulty"
      icon={<ScrollText className="h-7 w-7 text-primary" />}
      containerClassName="max-w-2xl"
    >
      <ProfilePactSettings
        userId={user.id}
        pactId={pactId}
        projectStartDate={projectStartDate}
        projectEndDate={projectEndDate}
        customDifficultyName={customDifficultyName}
        customDifficultyActive={customDifficultyActive}
        customDifficultyColor={customDifficultyColor}
        onProjectStartDateChange={setProjectStartDate}
        onProjectEndDateChange={setProjectEndDate}
        onCustomDifficultyNameChange={setCustomDifficultyName}
        onCustomDifficultyActiveChange={setCustomDifficultyActive}
        onCustomDifficultyColorChange={setCustomDifficultyColor}
      />
    </ProfileSettingsShell>
  );
}
