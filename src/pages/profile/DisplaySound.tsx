import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, Palette, Sparkles, Moon, Sun, Laptop, SlidersHorizontal, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { useToast } from "@/hooks/use-toast";
import { useProfileSettings, type ThemePreference } from "@/hooks/useProfileSettings";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { cn } from "@/lib/utils";
import {
  SettingsBreadcrumb, CyberSeparator, DataPanel, SettingRow, SettingContentRow, SyncIndicator,
} from "@/components/profile/settings-ui";

export default function DisplaySound() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings: soundSettings, setSettings: setSoundSettings } = useSound();
  const { settings, isLoading, save } = useSoundSettings();
  const initialSyncDone = useRef(false);
  const { profile, isLoading: profileLoading, updateProfile } = useProfileSettings();
  const { setTheme } = useTheme();

  const [localVolume, setLocalVolume] = useState<number | null>(null);
  const [localParticleIntensity, setLocalParticleIntensity] = useState<number | null>(null);
  const [syncingPanel, setSyncingPanel] = useState<number | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout>>();

  const markSync = useCallback((panel: number) => {
    setSyncingPanel(panel);
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => setSyncingPanel(null), 2000);
  }, []);

  useEffect(() => {
    if (settings && !initialSyncDone.current) {
      initialSyncDone.current = true;
      setSoundSettings(settings);
    }
  }, [settings, setSoundSettings]);

  const effective = useMemo(() => settings ?? soundSettings, [settings, soundSettings]);

  const persistSound = useCallback((next: typeof effective) => {
    setSoundSettings(next);
    if (!user?.id) return;
    void save(next).catch((e) => {
      toast({ title: t("common.error"), description: e?.message ?? t("settings.displaySound.toasts.saveFailed"), variant: "destructive" });
    });
  }, [user?.id, save, toast, setSoundSettings, t]);

  const displayVolume = localVolume ?? (effective.volume ?? 0);
  const displayParticleIntensity = localParticleIntensity ?? ((profile?.particles_intensity ?? 1) as number);
  const isPending = profileLoading || updateProfile.isPending;

  if (profileLoading && isLoading) {
    return (
      <ProfileSettingsShell title={t("settings.displaySound.title")} subtitle={t("settings.displaySound.subtitle")} icon={<SlidersHorizontal className="h-7 w-7 text-primary" />} containerClassName="max-w-3xl">
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </ProfileSettingsShell>
    );
  }

  return (
    <ProfileSettingsShell title={t("settings.displaySound.title")} subtitle={t("settings.displaySound.subtitle")} icon={<SlidersHorizontal className="h-7 w-7 text-primary" />} containerClassName="max-w-3xl">
      <SettingsBreadcrumb code="DSP.03" />
      <CyberSeparator />

      {/* ── PANEL 1: Visual ── */}
      <DataPanel
        code="MODULE_01" title="PARAMÈTRES VISUELS"
        footerLeft={<span>THEME: <b className="text-primary">{(profile?.theme_preference ?? "system").toUpperCase()}</b></span>}
        footerRight={<SyncIndicator syncing={syncingPanel === 1} />}
      >
        <SettingContentRow icon={<Palette className="h-4 w-4 text-primary" />} label={t("settings.displaySound.theme")} description={t("settings.displaySound.themeDesc")}>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "system" as const, labelKey: "settings.displaySound.themeSystem", icon: Laptop },
              { value: "light" as const, labelKey: "settings.displaySound.themeLight", icon: Sun },
              { value: "dark" as const, labelKey: "settings.displaySound.themeDark", icon: Moon },
            ] as const).map((opt) => {
              const Icon = opt.icon;
              const selected = (profile?.theme_preference ?? "system") === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const next = opt.value as ThemePreference;
                    setTheme(next);
                    updateProfile.mutate({ theme_preference: next } as any, {
                      onSuccess: () => { toast({ title: t("settings.displaySound.toasts.themeUpdated"), description: t("settings.displaySound.toasts.themeUpdatedDesc") }); markSync(1); },
                    });
                  }}
                  disabled={isPending}
                  className={cn(
                    "flex items-center justify-center gap-2 border px-3 py-2 text-xs font-orbitron transition-colors",
                    "[clip-path:polygon(6px_0%,100%_0%,calc(100%-6px)_100%,0%_100%)]",
                    selected
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-primary/20 bg-card/50 text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(opt.labelKey)}
                </button>
              );
            })}
          </div>
        </SettingContentRow>

        <SettingRow icon={<Moon className="h-4 w-4 text-primary" />} label={t("settings.displaySound.reduceMotion")} description={t("settings.displaySound.reduceMotionDesc")} checked={profile?.reduce_motion ?? false} disabled={isPending} onToggle={(v) => updateProfile.mutate({ reduce_motion: v } as any, { onSuccess: () => { toast({ title: t("common.updated"), description: t("settings.displaySound.toasts.motionSaved") }); markSync(1); } })} />
      </DataPanel>

      {/* ── PANEL 2: Sound ── */}
      <DataPanel
        code="MODULE_02" title="SYSTÈME AUDIO"
        footerLeft={<span>MASTER: <b className={cn(effective.masterEnabled ? "text-primary" : "text-muted-foreground")}>{effective.masterEnabled ? "ON" : "OFF"}</b></span>}
        footerRight={<SyncIndicator syncing={syncingPanel === 2} />}
      >
        <SettingRow icon={<Volume2 className="h-4 w-4 text-primary" />} label={t("settings.displaySound.masterSound")} description={t("settings.displaySound.masterSoundDesc")} checked={!!effective.masterEnabled} disabled={false} onToggle={(v) => { persistSound({ ...effective, masterEnabled: v }); markSync(2); }} />

        <SettingContentRow icon={<Volume2 className="h-4 w-4 text-primary" />} label={t("settings.displaySound.volume")} description={t("settings.displaySound.volumeDesc")}>
          <div className="flex items-center gap-4">
            <Slider
              value={[Math.round(displayVolume * 100)]}
              max={100} step={1}
              onValueChange={(v) => setLocalVolume((v[0] ?? 0) / 100)}
              onValueCommit={(v) => { const nv = (v[0] ?? 0) / 100; setLocalVolume(null); persistSound({ ...effective, volume: nv }); markSync(2); }}
              disabled={!effective.masterEnabled}
              className="flex-1"
            />
            <span className="font-mono text-[9px] text-primary tracking-wider min-w-[36px] text-right">{Math.round(displayVolume * 100)}%</span>
          </div>
        </SettingContentRow>

        <SettingRow icon={<Volume2 className="h-4 w-4 text-primary" />} label={t("settings.displaySound.uiSounds")} description={t("settings.displaySound.uiSoundsDesc")} checked={!!effective.uiEnabled} disabled={!effective.masterEnabled} onToggle={(v) => { persistSound({ ...effective, uiEnabled: v }); markSync(2); }} />
        <SettingRow icon={<Volume2 className="h-4 w-4 text-primary" />} label={t("settings.displaySound.successSounds")} description={t("settings.displaySound.successSoundsDesc")} checked={!!effective.successEnabled} disabled={!effective.masterEnabled} onToggle={(v) => { persistSound({ ...effective, successEnabled: v }); markSync(2); }} />
        <SettingRow icon={<Volume2 className="h-4 w-4 text-primary" />} label={t("settings.displaySound.progressSounds")} description={t("settings.displaySound.progressSoundsDesc")} checked={!!effective.progressEnabled} disabled={!effective.masterEnabled} onToggle={(v) => { persistSound({ ...effective, progressEnabled: v }); markSync(2); }} />
      </DataPanel>

      {/* ── PANEL 3: Particles ── */}
      <DataPanel
        code="MODULE_03" title="EFFETS PARTICULES"
        footerLeft={<span>PARTICLES: <b className={cn((profile?.particles_enabled ?? true) ? "text-primary" : "text-muted-foreground")}>{(profile?.particles_enabled ?? true) ? "ON" : "OFF"}</b></span>}
        footerRight={<SyncIndicator syncing={syncingPanel === 3} />}
      >
        <SettingRow icon={<Sparkles className="h-4 w-4 text-primary" />} label={t("settings.displaySound.enableParticles")} description={t("settings.displaySound.enableParticlesDesc")} checked={profile?.particles_enabled ?? true} disabled={isPending} onToggle={(v) => updateProfile.mutate({ particles_enabled: v } as any, { onSuccess: () => { toast({ title: t("common.updated"), description: t("settings.displaySound.toasts.particleSaved") }); markSync(3); } })} />

        <SettingContentRow icon={<Sparkles className="h-4 w-4 text-primary" />} label={t("settings.displaySound.intensity")} description={t("settings.displaySound.intensityDesc")}>
          <div className="flex items-center gap-4">
            <Slider
              value={[Math.round(displayParticleIntensity * 100)]}
              max={100} step={1}
              onValueChange={(v) => setLocalParticleIntensity((v[0] ?? 100) / 100)}
              onValueCommit={(v) => { const ni = (v[0] ?? 100) / 100; setLocalParticleIntensity(null); updateProfile.mutate({ particles_intensity: ni } as any); markSync(3); }}
              disabled={isPending || !(profile?.particles_enabled ?? true)}
              className="flex-1"
            />
            <span className="font-mono text-[9px] text-primary tracking-wider min-w-[36px] text-right">{Math.round(displayParticleIntensity * 100)}%</span>
          </div>
        </SettingContentRow>
      </DataPanel>

      <div className="h-8" />
    </ProfileSettingsShell>
  );
}
