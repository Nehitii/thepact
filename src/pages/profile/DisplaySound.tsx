import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, Palette, Sparkles, Moon, Sun, Laptop, SlidersHorizontal, Loader2, Type, Play } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { useToast } from "@/hooks/use-toast";
import { useProfileSettings, type ThemePreference } from "@/hooks/useProfileSettings";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  SettingsPageShell, CyberPanel, SettingRow, SettingContentRow, SyncIndicator, StickyCommandBar,
} from "@/components/profile/settings-ui";

const ACCENT_COLORS = [
  { hex: "#5bb4ff", label: "Cyber Blue" },
  { hex: "#8b5cf6", label: "Violet" },
  { hex: "#22c55e", label: "Emerald" },
  { hex: "#f59e0b", label: "Amber" },
  { hex: "#ef4444", label: "Red" },
  { hex: "#ec4899", label: "Pink" },
  { hex: "#06b6d4", label: "Cyan" },
  { hex: "#f97316", label: "Orange" },
];

const SOUND_FILES: Record<string, string> = { ui: "/sounds/ui-click.mp3" };

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
  const [localFontSize, setLocalFontSize] = useState<number | null>(null);
  const [syncingPanel, setSyncingPanel] = useState<number | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout>>();
  const [latestLog, setLatestLog] = useState<{ text: string; type: "ok" | "warn" | "info" }>({ text: "DISPLAY_SOUND.READY // AWAITING INPUT", type: "info" });

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

  const playPreview = useCallback((soundKey: string) => {
    const file = SOUND_FILES[soundKey] || SOUND_FILES.ui;
    try {
      const audio = new Audio(file);
      audio.volume = effective.volume ?? 0.35;
      audio.play();
    } catch { /* silently fail */ }
  }, [effective.volume]);

  const displayVolume = localVolume ?? (effective.volume ?? 0);
  const displayParticleIntensity = localParticleIntensity ?? ((profile?.particles_intensity ?? 1) as number);
  const displayFontSize = localFontSize ?? (profile?.font_size ?? 16);
  const isPending = profileLoading || updateProfile.isPending;

  if (profileLoading && isLoading) {
    return (
      <SettingsPageShell title={t("settings.displaySound.title")} subtitle={t("settings.displaySound.subtitle")} icon={<SlidersHorizontal className="h-7 w-7 text-primary" />}>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title={t("settings.displaySound.title")}
      subtitle={t("settings.displaySound.subtitle")}
      icon={<SlidersHorizontal className="h-7 w-7 text-primary" />}
      stickyBar={<StickyCommandBar latestLog={latestLog} />}
    >
      {/* ── PANEL 1: Visual ── */}
      <CyberPanel title="PARAMÈTRES VISUELS" statusText={<SyncIndicator syncing={syncingPanel === 1} />}>
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
                      onSuccess: () => { toast({ title: t("settings.displaySound.toasts.themeUpdated"), description: t("settings.displaySound.toasts.themeUpdatedDesc") }); markSync(1); setLatestLog({ text: `THEME: ${next.toUpperCase()}`, type: "ok" }); },
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

        <SettingRow icon={<Moon className="h-4 w-4 text-primary" />} label={t("settings.displaySound.reduceMotion")} description={t("settings.displaySound.reduceMotionDesc")} checked={profile?.reduce_motion ?? false} disabled={isPending} onToggle={(v) => updateProfile.mutate({ reduce_motion: v } as any, { onSuccess: () => { toast({ title: t("common.updated"), description: t("settings.displaySound.toasts.motionSaved") }); markSync(1); setLatestLog({ text: `REDUCE_MOTION: ${v ? "ON" : "OFF"}`, type: "ok" }); } })} />

        <SettingContentRow icon={<Type className="h-4 w-4 text-primary" />} label={t("settings.displaySound.fontSize") || "Taille de police"} description={t("settings.displaySound.fontSizeDesc") || "Ajuste la taille de police globale (12-24px)"}>
          <div className="flex items-center gap-4">
            <Slider
              value={[displayFontSize]}
              min={12} max={24} step={1}
              onValueChange={(v) => setLocalFontSize(v[0] ?? 16)}
              onValueCommit={(v) => {
                const nf = v[0] ?? 16;
                setLocalFontSize(null);
                updateProfile.mutate({ font_size: nf } as any, {
                  onSuccess: () => { toast({ title: t("common.updated") }); markSync(1); setLatestLog({ text: `FONT_SIZE: ${nf}px`, type: "ok" }); },
                });
              }}
              disabled={isPending}
              className="flex-1"
            />
            <span className="font-mono text-[9px] text-primary tracking-wider min-w-[36px] text-right">{displayFontSize}px</span>
          </div>
        </SettingContentRow>
      </CyberPanel>

      {/* ── PANEL 2: Sound ── */}
      <CyberPanel title="SYSTÈME AUDIO" statusText={<SyncIndicator syncing={syncingPanel === 2} />}>
        <SettingRow icon={<Volume2 className="h-4 w-4 text-primary" />} label={t("settings.displaySound.masterSound")} description={t("settings.displaySound.masterSoundDesc")} checked={!!effective.masterEnabled} disabled={false} onToggle={(v) => { persistSound({ ...effective, masterEnabled: v }); markSync(2); setLatestLog({ text: `MASTER_AUDIO: ${v ? "ON" : "OFF"}`, type: v ? "ok" : "warn" }); }} />

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

        <SoundRowWithPreview icon={<Volume2 className="h-4 w-4 text-primary" />} label={t("settings.displaySound.uiSounds")} description={t("settings.displaySound.uiSoundsDesc")} checked={!!effective.uiEnabled} disabled={!effective.masterEnabled} onToggle={(v) => { persistSound({ ...effective, uiEnabled: v }); markSync(2); }} onPreview={() => playPreview("ui")} masterEnabled={!!effective.masterEnabled} />
        <SoundRowWithPreview icon={<Volume2 className="h-4 w-4 text-primary" />} label={t("settings.displaySound.successSounds")} description={t("settings.displaySound.successSoundsDesc")} checked={!!effective.successEnabled} disabled={!effective.masterEnabled} onToggle={(v) => { persistSound({ ...effective, successEnabled: v }); markSync(2); }} onPreview={() => playPreview("ui")} masterEnabled={!!effective.masterEnabled} />
        <SoundRowWithPreview icon={<Volume2 className="h-4 w-4 text-primary" />} label={t("settings.displaySound.progressSounds")} description={t("settings.displaySound.progressSoundsDesc")} checked={!!effective.progressEnabled} disabled={!effective.masterEnabled} onToggle={(v) => { persistSound({ ...effective, progressEnabled: v }); markSync(2); }} onPreview={() => playPreview("ui")} masterEnabled={!!effective.masterEnabled} />
      </CyberPanel>

      {/* ── PANEL 3: Particles ── */}
      <CyberPanel title="EFFETS PARTICULES" statusText={<SyncIndicator syncing={syncingPanel === 3} />}>
        <SettingRow icon={<Sparkles className="h-4 w-4 text-primary" />} label={t("settings.displaySound.enableParticles")} description={t("settings.displaySound.enableParticlesDesc")} checked={profile?.particles_enabled ?? true} disabled={isPending} onToggle={(v) => updateProfile.mutate({ particles_enabled: v } as any, { onSuccess: () => { toast({ title: t("common.updated"), description: t("settings.displaySound.toasts.particleSaved") }); markSync(3); setLatestLog({ text: `PARTICLES: ${v ? "ON" : "OFF"}`, type: "ok" }); } })} />

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
      </CyberPanel>

      {/* ── PANEL 4: Accent Color ── */}
      <CyberPanel title="COULEUR D'ACCENT" statusText={<SyncIndicator syncing={syncingPanel === 4} />}>
        <SettingContentRow icon={<Palette className="h-4 w-4 text-primary" />} label={t("settings.displaySound.accentColor") || "Couleur primaire"} description={t("settings.displaySound.accentColorDesc") || "Personnalise la couleur d'accent de toute l'interface"}>
          <div className="grid grid-cols-4 gap-2.5">
            {ACCENT_COLORS.map((color) => {
              const selected = (profile?.accent_color ?? "#5bb4ff") === color.hex;
              return (
                <button
                  key={color.hex}
                  onClick={() => {
                    updateProfile.mutate({ accent_color: color.hex } as any, {
                      onSuccess: () => { toast({ title: t("common.updated"), description: color.label }); markSync(4); setLatestLog({ text: `ACCENT: ${color.label.toUpperCase()}`, type: "ok" }); },
                    });
                  }}
                  disabled={isPending}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2.5 border transition-all duration-200",
                    "[clip-path:polygon(6px_0%,100%_0%,calc(100%-6px)_100%,0%_100%)]",
                    selected
                      ? "border-primary/50 bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                      : "border-primary/15 bg-card/50 hover:border-primary/30"
                  )}
                >
                  <div
                    className={cn("w-8 h-8 rounded-full border-2 transition-all", selected ? "border-foreground scale-110" : "border-transparent")}
                    style={{ backgroundColor: color.hex, boxShadow: selected ? `0 0 12px ${color.hex}80` : "none" }}
                  />
                  <span className={cn("text-[8px] font-mono tracking-wider uppercase", selected ? "text-primary" : "text-muted-foreground")}>
                    {color.label}
                  </span>
                </button>
              );
            })}
          </div>
        </SettingContentRow>
      </CyberPanel>
    </SettingsPageShell>
  );
}

function SoundRowWithPreview({
  icon, label, description, checked, disabled, onToggle, onPreview, masterEnabled,
}: {
  icon: React.ReactNode; label: string; description: string; checked: boolean; disabled: boolean;
  onToggle: (v: boolean) => void; onPreview: () => void; masterEnabled: boolean;
}) {
  return (
    <div className="group relative flex items-center justify-between gap-4 py-4 px-5 -mx-5 cursor-pointer overflow-hidden border-b border-primary/[0.06] last:border-b-0 transition-colors hover:bg-primary/[0.03]">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] origin-center scale-y-0 transition-transform group-hover:scale-y-100 bg-primary" />
      <div className="flex items-start gap-3.5 flex-1 min-w-0" onClick={() => !disabled && onToggle(!checked)}>
        <div className={cn(
          "w-9 h-9 border flex items-center justify-center flex-shrink-0 transition-all duration-300",
          "border-primary/20 bg-primary/10",
          "group-hover:border-primary group-hover:bg-primary/25 group-hover:shadow-[0_0_12px_hsl(var(--primary)/0.4)]",
          "[clip-path:polygon(8px_0%,100%_0%,100%_calc(100%-8px),calc(100%-8px)_100%,0%_100%,0%_8px)]"
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-rajdhani text-sm font-bold tracking-wider uppercase leading-none mb-1 text-foreground">{label}</div>
          <div className="text-[11px] text-muted-foreground tracking-wide leading-snug hidden sm:block">{description}</div>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onPreview(); }}
        disabled={!masterEnabled}
        className={cn(
          "w-7 h-7 border border-primary/20 bg-primary/5 flex items-center justify-center",
          "hover:border-primary/40 hover:bg-primary/15 transition-colors",
          "disabled:opacity-20 disabled:cursor-not-allowed shrink-0"
        )}
        title={masterEnabled ? "Preview" : ""}
      >
        <Play className="h-3 w-3 text-primary" />
      </button>
      <span className={cn("font-mono text-[9px] tracking-widest min-w-[50px] text-right hidden sm:block transition-colors", checked ? "text-primary" : "text-muted-foreground")}>
        {checked ? "ENABLED" : "DISABLED"}
      </span>
      <div onClick={(e) => e.stopPropagation()}>
        <Switch checked={checked} onCheckedChange={onToggle} disabled={disabled} />
      </div>
    </div>
  );
}
