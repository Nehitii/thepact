import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LogOut, User, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RanksManager } from "@/components/RanksManager";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [customDifficultyName, setCustomDifficultyName] = useState("");
  const [customDifficultyActive, setCustomDifficultyActive] = useState(false);
  const [customDifficultyColor, setCustomDifficultyColor] = useState("#a855f7");

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
        setCustomDifficultyName(data.custom_difficulty_name || "");
        setCustomDifficultyActive(data.custom_difficulty_active || false);
        setCustomDifficultyColor(data.custom_difficulty_color || "#a855f7");
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        timezone,
        custom_difficulty_name: customDifficultyName.trim() || null,
        custom_difficulty_active: customDifficultyActive,
        custom_difficulty_color: customDifficultyColor,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved",
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
    <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-secondary">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="pt-8">
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Update your profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                placeholder="UTC"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Custom Difficulty */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Custom Difficulty
            </CardTitle>
            <CardDescription>Define your ultimate personal challenge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="customDifficultyName">Custom Difficulty Name</Label>
              <Input
                id="customDifficultyName"
                placeholder="Choose a name for your Custom Difficulty"
                value={customDifficultyName}
                onChange={(e) => setCustomDifficultyName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                This name will replace "Custom Difficulty" throughout the app
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customDifficultyColor">Custom Difficulty Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="customDifficultyColor"
                  type="color"
                  value={customDifficultyColor}
                  onChange={(e) => setCustomDifficultyColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <div className="flex-1">
                  <Input
                    type="text"
                    value={customDifficultyColor}
                    onChange={(e) => setCustomDifficultyColor(e.target.value)}
                    placeholder="#a855f7"
                    maxLength={7}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This color will be used for custom difficulty goals and progress tracking
              </p>
            </div>

            <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="customDifficultyActive" className="text-base">
                  Activate this Custom Difficulty in my Pact
                </Label>
                <p className="text-sm text-muted-foreground">
                  {customDifficultyActive 
                    ? "Custom difficulty is available in all goal creation and editing" 
                    : "Custom difficulty will not appear in difficulty selectors"}
                </p>
              </div>
              <Switch
                id="customDifficultyActive"
                checked={customDifficultyActive}
                onCheckedChange={setCustomDifficultyActive}
              />
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Ranks Management */}
        {user && <RanksManager userId={user.id} />}

        {/* Sign Out */}
        <Card>
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
      </div>

      <Navigation />
    </div>
  );
}
