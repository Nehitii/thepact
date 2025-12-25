import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ProfilePactSettings } from "@/components/profile/ProfilePactSettings";

export default function PactSettings() {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-[#00050B] relative overflow-hidden">
      {/* Deep space background with radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      {/* Sci-fi grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(91, 180, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(91, 180, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="pt-8 space-y-4 animate-fade-in">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 text-primary/70 hover:text-primary transition-colors font-rajdhani"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Profile</span>
          </button>

          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_20px_rgba(91,180,255,0.6)] font-orbitron">
            Pact Settings
          </h1>
          <p className="text-primary/70 tracking-wide font-rajdhani">
            Configure your pact timeline and custom difficulty
          </p>
        </div>

        {/* Content */}
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
      </div>
    </div>
  );
}
