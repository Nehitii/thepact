import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileMenuCard } from "./ProfileMenuCard";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Quote, 
  Trophy, 
  Target, 
  Flame, 
  Zap,
  Star,
  Shield,
  Sparkles,
  Crown
} from "lucide-react";

interface ProfileBoundedProfileProps {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  avatarFrame: string;
  personalQuote: string;
  displayedBadges: string[];
  onAvatarUrlChange: (url: string | null) => void;
  onAvatarFrameChange: (frame: string) => void;
  onPersonalQuoteChange: (quote: string) => void;
  onDisplayedBadgesChange: (badges: string[]) => void;
}

const frameStyles: Record<string, { border: string; glow: string; name: string }> = {
  default: { 
    border: "border-primary/40", 
    glow: "shadow-[0_0_20px_rgba(91,180,255,0.3)]", 
    name: "Default" 
  },
  fire: { 
    border: "border-orange-500/60", 
    glow: "shadow-[0_0_25px_rgba(249,115,22,0.5)]", 
    name: "Fire" 
  },
  ice: { 
    border: "border-cyan-400/60", 
    glow: "shadow-[0_0_25px_rgba(34,211,238,0.5)]", 
    name: "Ice" 
  },
  royal: { 
    border: "border-yellow-500/60", 
    glow: "shadow-[0_0_25px_rgba(234,179,8,0.5)]", 
    name: "Royal" 
  },
  void: { 
    border: "border-purple-500/60", 
    glow: "shadow-[0_0_25px_rgba(168,85,247,0.5)]", 
    name: "Void" 
  },
  blood: { 
    border: "border-red-500/60", 
    glow: "shadow-[0_0_25px_rgba(239,68,68,0.5)]", 
    name: "Blood" 
  },
};

export function ProfileBoundedProfile({
  userId,
  displayName,
  avatarUrl,
  avatarFrame,
  personalQuote,
  displayedBadges,
  onAvatarUrlChange,
  onAvatarFrameChange,
  onPersonalQuoteChange,
  onDisplayedBadgesChange,
}: ProfileBoundedProfileProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [pactStats, setPactStats] = useState({
    pactName: "—",
    points: 0,
    tier: 1,
    goalsCompleted: 0,
    stepsCompleted: 0,
    streak: 0,
    totalCost: 0,
  });
  const [availableBadges, setAvailableBadges] = useState<string[]>([]);
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);

  // Load pact stats and badges
  useEffect(() => {
    const loadData = async () => {
      // Load pact data
      const { data: pact } = await supabase
        .from("pacts")
        .select("name, points, tier, checkin_streak")
        .eq("user_id", userId)
        .maybeSingle();

      if (pact) {
        // Load goals stats
        const { data: goals } = await supabase
          .from("goals")
          .select("status, estimated_cost")
          .eq("pact_id", (await supabase.from("pacts").select("id").eq("user_id", userId).single()).data?.id);

        const completedGoals = goals?.filter(g => 
          g.status === "completed" || g.status === "fully_completed" || g.status === "validated"
        ).length || 0;
        
        const totalCost = goals?.reduce((sum, g) => sum + (Number(g.estimated_cost) || 0), 0) || 0;

        // Load steps stats
        const { data: tracking } = await supabase
          .from("achievement_tracking")
          .select("steps_completed_total")
          .eq("user_id", userId)
          .maybeSingle();

        setPactStats({
          pactName: pact.name || "—",
          points: pact.points || 0,
          tier: pact.tier || 1,
          goalsCompleted: completedGoals,
          stepsCompleted: tracking?.steps_completed_total || 0,
          streak: pact.checkin_streak || 0,
          totalCost,
        });
      }

      // Load unlocked achievements as available badges
      const { data: achievements } = await supabase
        .from("user_achievements")
        .select("achievement_key")
        .eq("user_id", userId)
        .not("unlocked_at", "is", null);

      if (achievements) {
        setAvailableBadges(achievements.map(a => a.achievement_key));
      }
    };

    loadData();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
        avatar_frame: avatarFrame,
        personal_quote: personalQuote.trim() || null,
        displayed_badges: displayedBadges,
      })
      .eq("id", userId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile Updated",
        description: "Your bounded profile has been saved",
      });
    }

    setSaving(false);
  };

  const toggleBadge = (badge: string) => {
    if (displayedBadges.includes(badge)) {
      onDisplayedBadgesChange(displayedBadges.filter(b => b !== badge));
    } else if (displayedBadges.length < 3) {
      onDisplayedBadgesChange([...displayedBadges, badge]);
    } else {
      toast({
        title: "Maximum Badges",
        description: "You can only display 3 badges at a time",
        variant: "destructive",
      });
    }
  };

  const currentFrame = frameStyles[avatarFrame] || frameStyles.default;

  return (
    <ProfileMenuCard
      icon={<Shield className="h-5 w-5 text-primary" />}
      title="Bounded Profile"
      description="Your futuristic identity card"
    >
      {/* Identity Card Preview */}
      <div className="relative p-6 rounded-xl bg-gradient-to-br from-card/80 via-card/60 to-card/40 border-2 border-primary/30 overflow-hidden">
        {/* Holographic overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-cyber-shimmer" />
        
        {/* Corner decorations */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary/50" />
        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary/50" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary/50" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary/50" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* Avatar with Frame */}
          <div className={`relative p-1 rounded-full ${currentFrame.glow}`}>
            <div className={`p-1 rounded-full border-2 ${currentFrame.border}`}>
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-orbitron">
                  {displayName?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
            {/* Animated particles around avatar */}
            <div className="absolute -inset-2 rounded-full animate-spin-slow pointer-events-none" style={{ animationDuration: '10s' }}>
              <div className="absolute top-0 left-1/2 w-1 h-1 bg-primary rounded-full" />
              <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-primary/50 rounded-full" />
            </div>
          </div>

          {/* Name */}
          <h3 className="text-xl font-orbitron text-primary tracking-wider drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
            {displayName || "UNKNOWN"}
          </h3>

          {/* Quote */}
          {personalQuote && (
            <p className="text-sm text-primary/70 font-rajdhani italic text-center max-w-xs">
              "{personalQuote}"
            </p>
          )}

          {/* Displayed Badges */}
          {displayedBadges.length > 0 && (
            <div className="flex gap-2 mt-2">
              {displayedBadges.map((badge, i) => (
                <div 
                  key={badge}
                  className="p-2 rounded-lg bg-primary/10 border border-primary/30 animate-glow-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pact Summary Widget */}
      <div className="mt-6 space-y-3">
        <Label className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Pact Summary
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-card/50 border border-primary/20 text-center">
            <div className="text-2xl font-orbitron text-primary">{pactStats.points}</div>
            <div className="text-xs text-primary/60 font-rajdhani uppercase">XP</div>
          </div>
          <div className="p-3 rounded-lg bg-card/50 border border-primary/20 text-center">
            <div className="text-2xl font-orbitron text-primary">{pactStats.tier}</div>
            <div className="text-xs text-primary/60 font-rajdhani uppercase">Tier</div>
          </div>
          <div className="p-3 rounded-lg bg-card/50 border border-primary/20 text-center">
            <div className="text-2xl font-orbitron text-primary">{pactStats.goalsCompleted}</div>
            <div className="text-xs text-primary/60 font-rajdhani uppercase">Goals</div>
          </div>
          <div className="p-3 rounded-lg bg-card/50 border border-primary/20 text-center">
            <div className="text-2xl font-orbitron text-primary">{pactStats.streak}</div>
            <div className="text-xs text-primary/60 font-rajdhani uppercase">Streak</div>
          </div>
        </div>
      </div>

      {/* Avatar Frame Selector */}
      <div className="space-y-3">
        <Label className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">
          Avatar Frame
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(frameStyles).map(([key, style]) => (
            <button
              key={key}
              onClick={() => onAvatarFrameChange(key)}
              className={`p-3 rounded-lg border-2 transition-all ${
                avatarFrame === key 
                  ? `${style.border} ${style.glow} bg-primary/10` 
                  : "border-primary/20 hover:border-primary/40"
              }`}
            >
              <span className="text-xs font-rajdhani text-primary uppercase">{style.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Personal Quote */}
      <div className="space-y-2">
        <Label htmlFor="personalQuote" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm flex items-center gap-2">
          <Quote className="h-4 w-4" />
          Personal Quote
        </Label>
        <Textarea
          id="personalQuote"
          placeholder="I walk in fire but do not burn..."
          value={personalQuote}
          onChange={(e) => onPersonalQuoteChange(e.target.value)}
          maxLength={150}
          className="bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-rajdhani resize-none"
          rows={2}
        />
        <p className="text-xs text-primary/50">{personalQuote.length}/150 characters</p>
      </div>

      {/* Badge Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm flex items-center gap-2">
            <Star className="h-4 w-4" />
            Display Badges ({displayedBadges.length}/3)
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBadgeSelector(!showBadgeSelector)}
            className="text-xs bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary"
          >
            {showBadgeSelector ? "Hide" : "Select Badges"}
          </Button>
        </div>
        
        {showBadgeSelector && (
          <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-card/30 border border-primary/20">
            {availableBadges.length > 0 ? (
              availableBadges.map((badge) => (
                <button
                  key={badge}
                  onClick={() => toggleBadge(badge)}
                  className={`p-2 rounded-lg border transition-all ${
                    displayedBadges.includes(badge)
                      ? "border-primary/50 bg-primary/20"
                      : "border-primary/20 hover:border-primary/40"
                  }`}
                >
                  <Trophy className="h-4 w-4 text-primary mx-auto" />
                </button>
              ))
            ) : (
              <p className="col-span-4 text-center text-sm text-primary/50 font-rajdhani py-2">
                Unlock achievements to display badges
              </p>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary/20 border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/30 text-primary font-orbitron uppercase tracking-wider"
      >
        {saving ? "SAVING..." : "SAVE CHANGES"}
      </Button>
    </ProfileMenuCard>
  );
}
