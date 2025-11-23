import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Flame, Skull } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfileAccountSettings } from "@/components/profile/ProfileAccountSettings";
import { ProfilePactSettings } from "@/components/profile/ProfilePactSettings";
import { ProfileHealthSettings } from "@/components/profile/ProfileHealthSettings";
import { ProfileFinanceSettings } from "@/components/profile/ProfileFinanceSettings";
import { DevilNoteModal } from "@/components/profile/DevilNoteModal";

export default function Profile() {
  const { user, signOut } = useAuth();
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

  // Health settings
  const [age, setAge] = useState<number | undefined>(undefined);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);

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
        setAge(data.age || undefined);
        setWeight(data.weight || undefined);
        setHeight(data.height || undefined);
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
        age: age || null,
        weight: weight || null,
        height: height || null,
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
    <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="pt-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="text-muted-foreground">Configure your pact settings</p>
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

        {/* Health Settings */}
        <ProfileHealthSettings
          age={age}
          weight={weight}
          height={height}
          onAgeChange={setAge}
          onWeightChange={setWeight}
          onHeightChange={setHeight}
        />

        {/* Finance Settings */}
        <ProfileFinanceSettings />

        {/* Save Button */}
        <Button onClick={handleSave} disabled={loading} className="w-full" size="lg">
          {loading ? "Saving..." : "Save All Changes"}
        </Button>

        {/* Devil Note */}
        <Card 
          className="border-destructive/30 bg-destructive/5 backdrop-blur cursor-pointer hover:bg-destructive/10 transition-all hover:border-destructive/50"
          onClick={() => setDevilNoteOpen(true)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Skull className="h-5 w-5" />
              Devil Note
            </CardTitle>
            <CardDescription>A warning from beyond</CardDescription>
          </CardHeader>
        </Card>

        {/* Sign Out */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Sign Out
            </CardTitle>
            <CardDescription>End your current session</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Credits */}
        <div className="text-center py-6 space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Flame className="h-4 w-4 text-primary" />
            <span className="font-light tracking-wide">Version: V3.0 – The Pact</span>
          </div>
          <div className="text-xs text-muted-foreground/70 font-light tracking-wider">
            Author: G.L
          </div>
        </div>
      </div>

      <DevilNoteModal open={devilNoteOpen} onOpenChange={setDevilNoteOpen} />
      <Navigation />
    </div>
  );
}
