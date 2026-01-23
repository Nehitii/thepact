import { Volume2, Palette, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { useToast } from "@/hooks/use-toast";

export function ProfileDisplaySounds() {
  const { user } = useAuth();
  const { toast } = useToast();
  const sound = useSound();
  const { settings, isLoading, save } = useSoundSettings();
  const saveTimer = useRef<number | null>(null);

  // Hydrate global SoundProvider from persisted settings.
  useEffect(() => {
    if (settings) sound.setSettings(settings);
  }, [settings, sound]);

  const effective = useMemo(() => {
    return settings ?? sound.settings;
  }, [settings, sound.settings]);

  const updateAndPersist = (next: typeof effective) => {
    sound.setSettings(next);

    if (!user?.id) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void save(next).catch((e) => {
        toast({
          title: "Error",
          description: e?.message ?? "Failed to save sound settings",
          variant: "destructive",
        });
      });
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Visual Settings Section */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
        <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
            <h2 className="text-xl font-orbitron font-semibold text-primary">
              Visual Settings
            </h2>
          </div>
          
          <p className="text-sm text-muted-foreground font-rajdhani">
            Customize themes, animations, and visual effects.
          </p>
          
          {/* Coming Soon Indicator */}
          <div className="flex items-center justify-center py-6">
            <div className="relative">
              <div className="absolute inset-0 blur-lg bg-primary/20 rounded-full" />
              <span 
                className="relative text-sm font-orbitron font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#5bb4ff] via-[#8ACBFF] to-[#5bb4ff] uppercase tracking-widest"
                style={{
                  textShadow: '0 0 20px rgba(91, 180, 255, 0.4)'
                }}
              >
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sound Settings Section */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
        <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
            <h2 className="text-xl font-orbitron font-semibold text-primary">
              Sound Settings
            </h2>
          </div>
          
          <p className="text-sm text-muted-foreground font-rajdhani">
            Subtle, futuristic feedback for actions — calm, premium, and consistent.
          </p>

          {/* Controls */}
          <div className="space-y-5">
            {/* Master toggle */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-background/10">
              <div className="min-w-0">
                <p className="text-sm font-orbitron text-foreground">Master Sound</p>
                <p className="text-xs text-muted-foreground font-rajdhani">
                  Turn all audio feedback on/off.
                </p>
              </div>
              <Switch
                checked={!!effective.masterEnabled}
                onCheckedChange={(checked) =>
                  updateAndPersist({ ...effective, masterEnabled: checked })
                }
              />
            </div>

            {/* Volume */}
            <div className="space-y-3 p-4 rounded-xl border border-primary/15 bg-background/10">
              <div className="flex items-center justify-between">
                <p className="text-sm font-orbitron text-foreground">Volume</p>
                <span className="text-xs text-muted-foreground font-rajdhani">
                  {Math.round((effective.volume ?? 0) * 100)}%
                </span>
              </div>
              <Slider
                value={[Math.round((effective.volume ?? 0) * 100)]}
                max={100}
                step={1}
                onValueChange={(v) => updateAndPersist({ ...effective, volume: (v[0] ?? 0) / 100 })}
                disabled={!effective.masterEnabled}
              />
              <p className="text-xs text-muted-foreground font-rajdhani">
                Designed to stay present without becoming intrusive.
              </p>
            </div>

            {/* Category toggles */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-background/10">
                <div className="min-w-0">
                  <p className="text-sm font-orbitron text-foreground">UI Sounds</p>
                  <p className="text-xs text-muted-foreground font-rajdhani">Buttons, toggles, tabs, dialogs.</p>
                </div>
                <Switch
                  checked={!!effective.uiEnabled}
                  disabled={!effective.masterEnabled}
                  onCheckedChange={(checked) => updateAndPersist({ ...effective, uiEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-background/10">
                <div className="min-w-0">
                  <p className="text-sm font-orbitron text-foreground">Success / Validation</p>
                  <p className="text-xs text-muted-foreground font-rajdhani">Confirmations and meaningful completions.</p>
                </div>
                <Switch
                  checked={!!effective.successEnabled}
                  disabled={!effective.masterEnabled}
                  onCheckedChange={(checked) => updateAndPersist({ ...effective, successEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-background/10">
                <div className="min-w-0">
                  <p className="text-sm font-orbitron text-foreground">Progress / Gamification</p>
                  <p className="text-xs text-muted-foreground font-rajdhani">XP, streaks, milestones, unlocks.</p>
                </div>
                <Switch
                  checked={!!effective.progressEnabled}
                  disabled={!effective.masterEnabled}
                  onCheckedChange={(checked) => updateAndPersist({ ...effective, progressEnabled: checked })}
                />
              </div>
            </div>

            {isLoading && (
              <p className="text-xs text-muted-foreground font-rajdhani">
                Loading your sound preferences…
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Effects Settings Section */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
        <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
            <h2 className="text-xl font-orbitron font-semibold text-primary">
              Particle Effects
            </h2>
          </div>
          
          <p className="text-sm text-muted-foreground font-rajdhani">
            Adjust particle density, glow intensity, and special effects.
          </p>
          
          {/* Coming Soon Indicator */}
          <div className="flex items-center justify-center py-6">
            <div className="relative">
              <div className="absolute inset-0 blur-lg bg-primary/20 rounded-full" />
              <span 
                className="relative text-sm font-orbitron font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#5bb4ff] via-[#8ACBFF] to-[#5bb4ff] uppercase tracking-widest"
                style={{
                  textShadow: '0 0 20px rgba(91, 180, 255, 0.4)'
                }}
              >
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <p className="text-center text-sm text-primary/50 font-rajdhani">
        These features are in development. Stay tuned for updates.
      </p>
    </div>
  );
}