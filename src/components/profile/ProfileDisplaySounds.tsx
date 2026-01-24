import { Volume2, Palette, Sparkles, Moon, Sun, Laptop } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { useProfileSettings, type ThemePreference } from "@/hooks/useProfileSettings";
import { useTheme } from "next-themes";

export function ProfileDisplaySounds() {
  const { user } = useAuth();
  const { toast } = useToast();
  const sound = useSound();
  const { settings, isLoading, save } = useSoundSettings();
  const saveTimer = useRef<number | null>(null);

  const { profile, isLoading: profileLoading, updateProfile } = useProfileSettings();
  const { setTheme } = useTheme();

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
      <Card variant="clean" className="shop-card bg-card/70 border-primary/20">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-orbitron font-semibold text-primary">
              Visual Settings
            </h2>
          </div>

          <p className="text-sm text-muted-foreground font-rajdhani">
            Personalize the interface without changing gameplay or data.
          </p>

          <div className="space-y-5">
            {/* Theme */}
            <div className="space-y-3 p-4 rounded-xl border border-primary/15 bg-card/50">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-orbitron text-foreground">Theme</p>
                  <p className="text-xs text-muted-foreground font-rajdhani">
                    System, light, or dark — synced across devices.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "system" as const, label: "System", icon: Laptop },
                    { value: "light" as const, label: "Light", icon: Sun },
                    { value: "dark" as const, label: "Dark", icon: Moon },
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon;
                  const selected = (profile?.theme_preference ?? "system") === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        const next = opt.value as ThemePreference;
                        setTheme(next);
                        updateProfile.mutate(
                          { theme_preference: next } as any,
                          {
                            onSuccess: () =>
                              toast({
                                title: "Theme updated",
                                description: "Your theme preference has been saved.",
                              }),
                          }
                        );
                      }}
                      disabled={profileLoading || updateProfile.isPending}
                      className={
                        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-orbitron transition-colors " +
                        (selected
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/30")
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reduce motion */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-card/50">
              <div className="min-w-0">
                <p className="text-sm font-orbitron text-foreground">Reduce Motion</p>
                <p className="text-xs text-muted-foreground font-rajdhani">
                  Minimizes animations and transitions.
                </p>
              </div>
              <Switch
                checked={profile?.reduce_motion ?? false}
                onCheckedChange={(v) =>
                  updateProfile.mutate(
                    { reduce_motion: v } as any,
                    {
                      onSuccess: () =>
                        toast({
                          title: "Updated",
                          description: "Motion preference saved.",
                        }),
                    }
                  )
                }
                disabled={profileLoading || updateProfile.isPending}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Sound Settings Section */}
      <Card variant="clean" className="shop-card bg-card/70 border-primary/20">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-primary" />
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
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-card/50">
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
            <div className="space-y-3 p-4 rounded-xl border border-primary/15 bg-card/50">
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
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-card/50">
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

              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-card/50">
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

              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-card/50">
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
      </Card>

      {/* Effects Settings Section */}
      <Card variant="clean" className="shop-card bg-card/70 border-primary/20">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-orbitron font-semibold text-primary">
              Particle Effects
            </h2>
          </div>

          <p className="text-sm text-muted-foreground font-rajdhani">
            Particle bursts for rewards and celebrations.
          </p>

          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-card/50">
              <div className="min-w-0">
                <p className="text-sm font-orbitron text-foreground">Enable Particles</p>
                <p className="text-xs text-muted-foreground font-rajdhani">
                  Disabling removes particle bursts across the app.
                </p>
              </div>
              <Switch
                checked={profile?.particles_enabled ?? true}
                onCheckedChange={(v) =>
                  updateProfile.mutate(
                    { particles_enabled: v } as any,
                    {
                      onSuccess: () =>
                        toast({ title: "Updated", description: "Particle setting saved." }),
                    }
                  )
                }
                disabled={profileLoading || updateProfile.isPending}
              />
            </div>

            <div className="space-y-3 p-4 rounded-xl border border-primary/15 bg-card/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-orbitron text-foreground">Intensity</p>
                <span className="text-xs text-muted-foreground font-rajdhani">
                  {Math.round(((profile?.particles_intensity ?? 1) as number) * 100)}%
                </span>
              </div>
              <Slider
                value={[Math.round(((profile?.particles_intensity ?? 1) as number) * 100)]}
                max={100}
                step={1}
                onValueChange={(v) =>
                  updateProfile.mutate({ particles_intensity: (v[0] ?? 100) / 100 } as any)
                }
                disabled={
                  profileLoading ||
                  updateProfile.isPending ||
                  !(profile?.particles_enabled ?? true)
                }
              />
              <p className="text-xs text-muted-foreground font-rajdhani">
                Controls how many particles spawn in bursts.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}