import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/lib/supabase";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Flame, Skull } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfileAccountSettings } from "@/components/profile/ProfileAccountSettings";
import { ProfilePactSettings } from "@/components/profile/ProfilePactSettings";
import { ProfileFinanceSettings } from "@/components/profile/ProfileFinanceSettings";
import { DevilNoteModal } from "@/components/profile/DevilNoteModal";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { setCurrency: updateGlobalCurrency, refreshCurrency } = useCurrency();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [devilNoteOpen, setDevilNoteOpen] = useState(false);
  
  // Account settings
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("eur");
  
  // Pact settings
  const [projectStartDate, setProjectStartDate] = useState<Date | undefined>(undefined);
  const [customDifficultyName, setCustomDifficultyName] = useState("");
  const [customDifficultyActive, setCustomDifficultyActive] = useState(false);
  const [customDifficultyColor, setCustomDifficultyColor] = useState("#a855f7");
  const [pactId, setPactId] = useState<string | null>(null);

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
        setCustomDifficultyName(data.custom_difficulty_name || "");
        setCustomDifficultyActive(data.custom_difficulty_active || false);
        setCustomDifficultyColor(data.custom_difficulty_color || "#a855f7");
      }

      // Load pact data
      const { data: pactData } = await supabase
        .from("pacts")
        .select("id, project_start_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (pactData) {
        setPactId(pactData.id);
        if (pactData.project_start_date) {
          setProjectStartDate(new Date(pactData.project_start_date));
        }
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        timezone,
        language,
        currency,
        custom_difficulty_name: customDifficultyName.trim() || null,
        custom_difficulty_active: customDifficultyActive,
        custom_difficulty_color: customDifficultyColor,
      })
      .eq("id", user.id);

    // Update pact start date if pactId exists
    let pactError = null;
    if (pactId && projectStartDate) {
      const { error } = await supabase
        .from("pacts")
        .update({
          project_start_date: projectStartDate.toISOString().split('T')[0],
        })
        .eq("id", pactId);
      pactError = error;
    }

    if (profileError || pactError) {
      toast({
        title: "Error",
        description: profileError?.message || pactError?.message,
        variant: "destructive",
      });
    } else {
      // Immediately update currency context to trigger UI refresh everywhere
      updateGlobalCurrency(currency);
      
      // Also refresh from database to ensure consistency
      await refreshCurrency();
      
      toast({
        title: "Profile Updated",
        description: "Your settings have been saved successfully",
      });
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully",
    });
  };

  return (
    <div className="min-h-screen pb-20 bg-[#00050B] relative overflow-hidden">
      {/* Deep space background with radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
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

      <div className="max-w-2xl mx-auto p-6 space-y-8 relative z-10">
        {/* Header */}
        <div className="pt-8 text-center space-y-3 animate-fade-in">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_20px_rgba(91,180,255,0.6)] font-orbitron">
            Profile
          </h1>
          <p className="text-primary/70 tracking-wide font-rajdhani">Configure your pact settings</p>
        </div>

        {/* Account Information */}
        <ProfileAccountSettings
          email={user?.email || ""}
          displayName={displayName}
          timezone={timezone}
          language={language}
          currency={currency}
          onDisplayNameChange={setDisplayName}
          onTimezoneChange={setTimezone}
          onLanguageChange={setLanguage}
          onCurrencyChange={setCurrency}
        />

        {/* Pact Settings */}
        {user && (
          <ProfilePactSettings
            userId={user.id}
            projectStartDate={projectStartDate}
            customDifficultyName={customDifficultyName}
            customDifficultyActive={customDifficultyActive}
            customDifficultyColor={customDifficultyColor}
            onProjectStartDateChange={setProjectStartDate}
            onCustomDifficultyNameChange={setCustomDifficultyName}
            onCustomDifficultyActiveChange={setCustomDifficultyActive}
            onCustomDifficultyColorChange={setCustomDifficultyColor}
          />
        )}

        {/* Finance Settings */}
        <ProfileFinanceSettings />

        {/* Achievements Section */}
        <div className="relative group animate-fade-in">
          <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
          <Card 
            className="relative border-2 border-primary/30 bg-card/30 backdrop-blur-xl cursor-pointer hover:bg-card/40 transition-all hover:border-primary/50 overflow-hidden"
            onClick={() => window.location.href = "/achievements"}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-primary font-orbitron uppercase tracking-wider drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
                <span className="text-2xl">🏆</span>
                The Pact Achievements
              </CardTitle>
              <CardDescription className="text-primary/60 font-rajdhani">View your unlocked achievements and track your progress</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <Button
                variant="outline"
                className="w-full bg-primary/10 border-primary/30 hover:border-primary/50 hover:bg-primary/20 text-primary font-rajdhani uppercase tracking-wide"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = "/achievements";
                }}
              >
                View All Achievements
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={loading} 
          className="w-full bg-primary/20 border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/30 text-primary font-orbitron uppercase tracking-wider transition-all animate-fade-in" 
          size="lg"
        >
          {loading ? "SAVING..." : "SAVE ALL CHANGES"}
        </Button>

        {/* Devil Note */}
        <div className="relative group animate-fade-in">
          <div className="absolute inset-0 bg-destructive/5 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
          <Card 
            className="relative border-2 border-destructive/30 bg-destructive/10 backdrop-blur-xl cursor-pointer hover:bg-destructive/20 transition-all hover:border-destructive/50 overflow-hidden"
            onClick={() => setDevilNoteOpen(true)}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-[2px] border border-destructive/20 rounded-[6px]" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-destructive font-orbitron uppercase tracking-wider drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                <Skull className="h-5 w-5" />
                Devil Note
              </CardTitle>
              <CardDescription className="text-destructive/60 font-rajdhani">A warning from beyond</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Sign Out */}
        <div className="relative group animate-fade-in">
          <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl transition-all" />
          <Card className="relative border-2 border-primary/30 bg-card/30 backdrop-blur-xl overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-primary font-orbitron uppercase tracking-wider">
                <LogOut className="h-5 w-5" />
                Sign Out
              </CardTitle>
              <CardDescription className="text-primary/60 font-rajdhani">End your current session</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full bg-destructive/10 border-destructive/30 hover:border-destructive/50 hover:bg-destructive/20 text-destructive font-rajdhani uppercase tracking-wide"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Credits */}
        <div className="text-center py-6 space-y-2 animate-fade-in">
          <div className="flex items-center justify-center gap-2 text-sm text-primary/60">
            <Flame className="h-4 w-4 text-primary animate-glow-pulse" />
            <span className="font-light tracking-wide font-rajdhani">Version: V3.0 – The Pact</span>
          </div>
          <div className="text-xs text-primary/40 font-light tracking-wider font-rajdhani">
            Author: G.L
          </div>
        </div>
      </div>

      <DevilNoteModal open={devilNoteOpen} onOpenChange={setDevilNoteOpen} />
      <Navigation />
    </div>
  );
}
