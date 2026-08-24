import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, Palette, Sparkles, Moon, Sun, Laptop, Loader2, Type, Play } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { toast } from "sonner";
import { useProfileSettings, type ThemePreference } from "@/hooks/useProfileSettings";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ConsoleReglages } from "@/components/profile/ConsoleReglages";
import { Panneau, Reglage, Segmente, Jauge } from "@/components/profile/console-ui";

const ACCENTS = [
  { hex: "#5bb4ff", cle: "cyber" },
  { hex: "#8b5cf6", cle: "violet" },
  { hex: "#22c55e", cle: "emeraude" },
  { hex: "#f59e0b", cle: "ambre" },
  { hex: "#ef4444", cle: "rouge" },
  { hex: "#ec4899", cle: "rose" },
  { hex: "#06b6d4", cle: "cyan" },
  { hex: "#f97316", cle: "orange" },
] as const;

const NOMS_ACCENT: Record<string, string> = {
  cyber: "Bleu cyber", violet: "Violet", emeraude: "Émeraude", ambre: "Ambre",
  rouge: "Rouge", rose: "Rose", cyan: "Cyan", orange: "Orange",
};

const SONS: Record<string, string> = { ui: "/sounds/ui-click.mp3" };

export default function DisplaySound() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { settings: soundSettings, setSettings: setSoundSettings } = useSound();
  const { settings, isLoading, save } = useSoundSettings();
  const initialSyncDone = useRef(false);
  const { profile, isLoading: profileLoading, updateProfile } = useProfileSettings();
  const { setTheme } = useTheme();

  const [localVolume, setLocalVolume] = useState<number | null>(null);
  const [localParticules, setLocalParticules] = useState<number | null>(null);
  const [localPolice, setLocalPolice] = useState<number | null>(null);

  /* LE JOURNAL RETOURNE A SON PANNEAU.
     Il tenait dans une barre collante unique en bas de page : on
     lisait « THEME: DARK » sans savoir lequel des quatre panneaux
     venait de repondre. Chaque panneau porte desormais le sien. */
  const [journaux, setJournaux] = useState<Record<string, { texte: string; type: "info" | "ok" | "warn" }>>({});
  const minuteurs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const noter = useCallback((panneau: string, texte: string, type: "info" | "ok" | "warn" = "ok") => {
    setJournaux((j) => ({ ...j, [panneau]: { texte, type } }));
    clearTimeout(minuteurs.current[panneau]);
    minuteurs.current[panneau] = setTimeout(
      () => setJournaux((j) => ({ ...j, [panneau]: { texte: "en attente", type: "info" } })),
      4000,
    );
  }, []);

  useEffect(() => {
    const m = minuteurs.current;
    return () => Object.values(m).forEach(clearTimeout);
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
      toast.error(t("common.error"), { description: e?.message ?? t("settings.displaySound.toasts.saveFailed") });
    });
  }, [user?.id, save, setSoundSettings, t]);

  const ecouter = useCallback((cle: string) => {
    try {
      const audio = new Audio(SONS[cle] || SONS.ui);
      audio.volume = effective.volume ?? 0.35;
      void audio.play();
    } catch { /* un apercu qui ne part pas ne doit rien casser */ }
  }, [effective.volume]);

  const volume = localVolume ?? (effective.volume ?? 0);
  const intensite = localParticules ?? ((profile?.particles_intensity ?? 1) as number);
  const police = localPolice ?? (profile?.font_size ?? 16);
  const enCours = profileLoading || updateProfile.isPending;
  const accent = profile?.accent_color ?? "#5bb4ff";

  if (profileLoading && isLoading) {
    return (
      <ConsoleReglages titre={t("settings.displaySound.title")}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ConsoleReglages>
    );
  }

  const attente = { texte: "en attente", type: "info" } as const;

  return (
    <ConsoleReglages
      titre={t("settings.displaySound.title")}
      note={t("settings.displaySound.subtitle")}
    >
      {/* ── VISUEL ── */}
      <Panneau
        code="Affichage"
        etat={t("settings.console.synced", "synchronisé")}
        ton="actif"
        rang="primaire"
        taille="pleine"
        journal={journaux.visuel ?? attente}
      >
        <Reglage
          nom={t("settings.displaySound.theme")}
          note={t("settings.displaySound.themeDesc")}
          icone={<Palette />}
          large
        >
          <Segmente
            aria={t("settings.displaySound.theme")}
            valeur={(profile?.theme_preference ?? "system") as ThemePreference}
            onChange={(v) => {
              setTheme(v);
              updateProfile.mutate({ theme_preference: v } as never, {
                onSuccess: () => {
                  toast.success(t("settings.displaySound.toasts.themeUpdated"));
                  noter("visuel", `thème → ${v}`);
                },
              });
            }}
            options={[
              { valeur: "system" as ThemePreference, libelle: t("settings.displaySound.themeSystem"), icone: <Laptop /> },
              { valeur: "light" as ThemePreference, libelle: t("settings.displaySound.themeLight"), icone: <Sun /> },
              { valeur: "dark" as ThemePreference, libelle: t("settings.displaySound.themeDark"), icone: <Moon /> },
            ]}
          />
        </Reglage>

        <Reglage
          nom={t("settings.displaySound.reduceMotion")}
          note={t("settings.displaySound.reduceMotionDesc")}
          icone={<Moon />}
        >
          <Switch
            checked={profile?.reduce_motion ?? false}
            disabled={enCours}
            onCheckedChange={(v) =>
              updateProfile.mutate({ reduce_motion: v } as never, {
                onSuccess: () => noter("visuel", `animations réduites → ${v ? "oui" : "non"}`),
              })
            }
          />
        </Reglage>

        <Reglage
          nom={t("settings.displaySound.fontSize", "Taille de police")}
          note={t("settings.displaySound.fontSizeDesc", "Ajuste la taille du texte dans toute l’application")}
          icone={<Type />}
          large
        >
          <Jauge valeur={`${police} px`}>
            <Slider
              value={[police]}
              min={12}
              max={24}
              step={1}
              disabled={enCours}
              onValueChange={(v) => setLocalPolice(v[0] ?? 16)}
              onValueCommit={(v) => {
                const n = v[0] ?? 16;
                setLocalPolice(null);
                updateProfile.mutate({ font_size: n } as never, {
                  onSuccess: () => noter("visuel", `police → ${n} px`),
                });
              }}
            />
          </Jauge>
        </Reglage>
      </Panneau>

      {/* ── AUDIO ── */}
      <Panneau
        code="Son"
        etat={effective.masterEnabled
          ? t("settings.console.on", "actif")
          : t("settings.console.off", "coupé")}
        ton={effective.masterEnabled ? "actif" : "alerte"}
        taille="pleine"
        journal={journaux.audio ?? attente}
      >
        <Reglage
          nom={t("settings.displaySound.masterSound")}
          note={t("settings.displaySound.masterSoundDesc")}
          icone={<Volume2 />}
        >
          <Switch
            checked={!!effective.masterEnabled}
            onCheckedChange={(v) => {
              persistSound({ ...effective, masterEnabled: v });
              noter("audio", `son général → ${v ? "actif" : "coupé"}`, v ? "ok" : "warn");
            }}
          />
        </Reglage>

        <Reglage
          nom={t("settings.displaySound.volume")}
          note={t("settings.displaySound.volumeDesc")}
          icone={<Volume2 />}
          large
        >
          <Jauge valeur={`${Math.round(volume * 100)} %`}>
            <Slider
              value={[Math.round(volume * 100)]}
              max={100}
              step={1}
              disabled={!effective.masterEnabled}
              onValueChange={(v) => setLocalVolume((v[0] ?? 0) / 100)}
              onValueCommit={(v) => {
                const n = (v[0] ?? 0) / 100;
                setLocalVolume(null);
                persistSound({ ...effective, volume: n });
                noter("audio", `volume → ${Math.round(n * 100)} %`);
              }}
            />
          </Jauge>
        </Reglage>

        {([
          ["uiEnabled", "settings.displaySound.uiSounds", "settings.displaySound.uiSoundsDesc"],
          ["successEnabled", "settings.displaySound.successSounds", "settings.displaySound.successSoundsDesc"],
          ["progressEnabled", "settings.displaySound.progressSounds", "settings.displaySound.progressSoundsDesc"],
        ] as const).map(([cle, nomCle, noteCle]) => (
          <Reglage key={cle} nom={t(nomCle)} note={t(noteCle)} icone={<Volume2 />}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => ecouter("ui")}
                disabled={!effective.masterEnabled}
                title={t("settings.console.listen", "Écouter")}
                className="rg-bouton !w-9 !px-0"
              >
                <Play className="h-3 w-3 text-primary" />
                <span className="sr-only">{t("settings.console.listen", "Écouter")}</span>
              </button>
              <Switch
                checked={!!effective[cle]}
                disabled={!effective.masterEnabled}
                onCheckedChange={(v) => {
                  persistSound({ ...effective, [cle]: v });
                  noter("audio", `${t(nomCle).toLowerCase()} → ${v ? "actif" : "coupé"}`);
                }}
              />
            </div>
          </Reglage>
        ))}
      </Panneau>

      {/* ── PARTICULES ── */}
      <Panneau
        code="Particules"
        etat={(profile?.particles_enabled ?? true)
          ? `${Math.round(intensite * 100)} %`
          : t("settings.console.off", "coupé")}
        ton={(profile?.particles_enabled ?? true) ? "actif" : "neutre"}
        journal={journaux.particules ?? attente}
      >
        <Reglage
          nom={t("settings.displaySound.enableParticles")}
          note={t("settings.displaySound.enableParticlesDesc")}
          icone={<Sparkles />}
        >
          <Switch
            checked={profile?.particles_enabled ?? true}
            disabled={enCours}
            onCheckedChange={(v) =>
              updateProfile.mutate({ particles_enabled: v } as never, {
                onSuccess: () => noter("particules", `particules → ${v ? "actives" : "coupées"}`),
              })
            }
          />
        </Reglage>

        <Reglage
          nom={t("settings.displaySound.intensity")}
          note={t("settings.displaySound.intensityDesc")}
          icone={<Sparkles />}
          large
        >
          <Jauge valeur={`${Math.round(intensite * 100)} %`}>
            <Slider
              value={[Math.round(intensite * 100)]}
              max={100}
              step={1}
              disabled={enCours || !(profile?.particles_enabled ?? true)}
              onValueChange={(v) => setLocalParticules((v[0] ?? 100) / 100)}
              onValueCommit={(v) => {
                const n = (v[0] ?? 100) / 100;
                setLocalParticules(null);
                updateProfile.mutate({ particles_intensity: n } as never, {
                  onSuccess: () => noter("particules", `intensité → ${Math.round(n * 100)} %`),
                });
              }}
            />
          </Jauge>
        </Reglage>
      </Panneau>

      {/* ── ACCENT ── */}
      <Panneau
        code="Couleur d’accent"
        etat={NOMS_ACCENT[ACCENTS.find((a) => a.hex === accent)?.cle ?? "cyber"]}
        ton="actif"
        journal={journaux.accent ?? attente}
      >
        <Reglage
          nom={t("settings.displaySound.accentColor", "Couleur d’accent")}
          note={t("settings.displaySound.accentColorDesc", "Elle colore toute l’interface : liens, jauges, états actifs.")}
          icone={<Palette />}
          large
        >
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {ACCENTS.map((c) => {
              const choisi = accent === c.hex;
              return (
                <button
                  key={c.hex}
                  type="button"
                  disabled={enCours}
                  aria-pressed={choisi}
                  title={NOMS_ACCENT[c.cle]}
                  onClick={() =>
                    updateProfile.mutate({ accent_color: c.hex } as never, {
                      onSuccess: () => noter("accent", `accent → ${NOMS_ACCENT[c.cle].toLowerCase()}`),
                    })
                  }
                  className={cn(
                    "aspect-square rounded-md border transition-all",
                    choisi ? "border-foreground/70 scale-105" : "border-primary/15 hover:border-primary/40",
                  )}
                  style={{
                    backgroundColor: c.hex,
                    boxShadow: choisi ? `0 0 14px ${c.hex}80` : undefined,
                  }}
                >
                  <span className="sr-only">{NOMS_ACCENT[c.cle]}</span>
                </button>
              );
            })}
          </div>
        </Reglage>
      </Panneau>
    </ConsoleReglages>
  );
}
