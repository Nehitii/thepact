import { Volume2, Palette, Sparkles, Moon, Sun, Laptop } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { useProfileSettings, type ThemePreference } from "@/hooks/useProfileSettings";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

export function ProfileDisplaySounds() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings: soundSettings, setSettings: setSoundSettings } = useSound();
  const { settings, isLoading, save } = useSoundSettings();
  const initialSyncDone = useRef(false);

  const { profile, isLoading: profileLoading, updateProfile } = useProfileSettings();
  const { setTheme } = useTheme();

  // Local state for sliders - updates immediately without triggering re-renders elsewhere
  const [localVolume, setLocalVolume] = useState<number | null>(null);
  const [localParticleIntensity, setLocalParticleIntensity] = useState<number | null>(null);

  // Hydrate global SoundProvider from persisted settings ONCE on load.
  useEffect(() => {
    if (settings && !initialSyncDone.current) {
      initialSyncDone.current = true;
      setSoundSettings(settings);
    }
  }, [settings, setSoundSettings]);

  // Use DB settings if loaded, otherwise fallback to context settings
  const effective = useMemo(() => {
    return settings ?? soundSettings;
  }, [settings, soundSettings]);

  // Persist sound settings to DB
  const persistSound = useCallback((next: typeof effective) => {
    setSoundSettings(next);
    if (!user?.id) return;
    void save(next).catch((e) => {
      toast({
        title: t("common.error"),
        description: e?.message ?? t("settings.displaySound.toasts.saveFailed"),
        variant: "destructive",
      });
    });
  }, [user?.id, save, toast, setSoundSettings, t]);

  // Display values - use local state while dragging, otherwise use effective
  const displayVolume = localVolume ?? (effective.volume ?? 0);
  const displayParticleIntensity = localParticleIntensity ?? ((profile?.particles_intensity ?? 1) as number);

  return (
    <div className="space-y-6">
      {/* Visual Settings Section */}
      <Card variant="clean" className="shop-card bg-card/70 border-primary/20">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-orbitron font-semibold text-primary">
              {t("settings.displaySound.visualSettings")}
            </h2>
          </div>

          <p className="text-sm text-muted-foreground font-rajdhani">
            {t("settings.displaySound.visualSettingsDesc")}
          </p>

          <div className="space-y-5">
            {/* Theme */}
            <div className="space-y-3 p-4 rounded-xl border border-primary/15 bg-card/50">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-orbitron text-foreground">{t("settings.displaySound.theme")}</p>
                  <p className="text-xs text-muted-foreground font-rajdhani">
                    {t("settings.displaySound.themeDesc")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "system" as const, labelKey: "settings.displaySound.themeSystem", icon: Laptop },
                    { value: "light" as const, labelKey: "settings.displaySound.themeLight", icon: Sun },
                    { value: "dark" as const, labelKey: "settings.displaySound.themeDark", icon: Moon },
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
                                title: t("settings.displaySound.toasts.themeUpdated"),
                                description: t("settings.displaySound.toasts.themeUpdatedDesc"),
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
                      {t(opt.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reduce motion */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-card/50">
              <div className="min-w-0">
                <p className="text-sm font-orbitron text-foreground">{t("settings.displaySound.reduceMotion")}</p>
                <p className="text-xs text-muted-foreground font-rajdhani">
                  {t("settings.displaySound.reduceMotionDesc")}
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
                          title: t("common.updated"),
                          description: t("settings.displaySound.toasts.motionSaved"),
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
              {t("settings.displaySound.soundSettings")}
            </h2>
          </div>
          
          <p className="text-sm text-muted-foreground font-rajdhani">
            {t("settings.displaySound.soundSettingsDesc")}
          </p>

          {/* Controls */}
          <div className="space-y-5">
            {/* Master toggle */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-card/50">
              <div className="min-w-0">
                <p className="text-sm font-orbitron text-foreground">{t("settings.displaySound.masterSound")}</p>
                <p className="text-xs text-muted-foreground font-rajdhani">
                  {t("settings.displaySound.masterSoundDesc")}
                </p>
              </div>
              <Switch
                checked={!!effective.masterEnabled}
                onCheckedChange={(checked) =>
                  persistSound({ ...effective, masterEnabled: checked })
                }
              />
            </div>

            {/* Volume */}
            <div className="space-y-3 p-4 rounded-xl border border-primary/15 bg-card/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-orbitron text-foreground">{t("settings.displaySound.volume")}</p>
                <span className="text-xs text-muted-foreground font-rajdhani">
                  {Math.round(displayVolume * 100)}%
                </span>
              </div>
              <Slider
                value={[Math.round(displayVolume * 100)]}
                max={100}
                step={1}
                onValueChange={(v) => {
                  setLocalVolume((v[0] ?? 0) / 100);
                }}
                onValueCommit={(v) => {
                  const newVolume = (v[0] ?? 0) / 100;
                  setLocalVolume(null);
                  persistSound({ ...effective, volume: newVolume });
                }}
                disabled={!effective.masterEnabled}
              />
              <p className="text-xs text-muted-foreground font-rajdhani">
                {t("settings.displaySound.volumeDesc")}
              </p>
            </div>

            {/* Category toggles */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-card/50">
                <div className="min-w-0">
                  <p className="text-sm font-orbitron text-foreground">{t("settings.displaySound.uiSounds")}</p>
                  <p className="text-xs text-muted-foreground font-rajdhani">{t("settings.displaySound.uiSoundsDesc")}</p>
                </div>
                <Switch
                  checked={!!effective.uiEnabled}
                  disabled={!effective.masterEnabled}
                  onCheckedChange={(checked) => persistSound({ ...effective, uiEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-card/50">
                <div className="min-w-0">
                  <p className="text-sm font-orbitron text-foreground">{t("settings.displaySound.successSounds")}</p>
                  <p className="text-xs text-muted-foreground font-rajdhani">{t("settings.displaySound.successSoundsDesc")}</p>
                </div>
                <Switch
                  checked={!!effective.successEnabled}
                  disabled={!effective.masterEnabled}
                  onCheckedChange={(checked) => persistSound({ ...effective, successEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-card/50">
                <div className="min-w-0">
                  <p className="text-sm font-orbitron text-foreground">{t("settings.displaySound.progressSounds")}</p>
                  <p className="text-xs text-muted-foreground font-rajdhani">{t("settings.displaySound.progressSoundsDesc")}</p>
                </div>
                <Switch
                  checked={!!effective.progressEnabled}
                  disabled={!effective.masterEnabled}
                  onCheckedChange={(checked) => persistSound({ ...effective, progressEnabled: checked })}
                />
              </div>
            </div>

            {isLoading && (
              <p className="text-xs text-muted-foreground font-rajdhani">
                {t("settings.displaySound.loadingPreferences")}
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
              {t("settings.displaySound.particleEffects")}
            </h2>
          </div>

          <p className="text-sm text-muted-foreground font-rajdhani">
            {t("settings.displaySound.particleEffectsDesc")}
          </p>

          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/15 bg-card/50">
              <div className="min-w-0">
                <p className="text-sm font-orbitron text-foreground">{t("settings.displaySound.enableParticles")}</p>
                <p className="text-xs text-muted-foreground font-rajdhani">
                  {t("settings.displaySound.enableParticlesDesc")}
                </p>
              </div>
              <Switch
                checked={profile?.particles_enabled ?? true}
                onCheckedChange={(v) =>
                  updateProfile.mutate(
                    { particles_enabled: v } as any,
                    {
                      onSuccess: () =>
                        toast({ title: t("common.updated"), description: t("settings.displaySound.toasts.particleSaved") }),
                    }
                  )
                }
                disabled={profileLoading || updateProfile.isPending}
              />
            </div>

            <div className="space-y-3 p-4 rounded-xl border border-primary/15 bg-card/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-orbitron text-foreground">{t("settings.displaySound.intensity")}</p>
                <span className="text-xs text-muted-foreground font-rajdhani">
                  {Math.round(displayParticleIntensity * 100)}%
                </span>
              </div>
              <Slider
                value={[Math.round(displayParticleIntensity * 100)]}
                max={100}
                step={1}
                onValueChange={(v) => {
                  setLocalParticleIntensity((v[0] ?? 100) / 100);
                }}
                onValueCommit={(v) => {
                  const newIntensity = (v[0] ?? 100) / 100;
                  setLocalParticleIntensity(null);
                  updateProfile.mutate({ particles_intensity: newIntensity } as any);
                }}
                disabled={
                  profileLoading ||
                  updateProfile.isPending ||
                  !(profile?.particles_enabled ?? true)
                }
              />
              <p className="text-xs text-muted-foreground font-rajdhani">
                {t("settings.displaySound.intensityDesc")}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
