import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, Palette, Sparkles, Moon, Sun, Laptop, Loader2, Type, Play } from "lucide-react";
import { Switch } from "@/socle/ui/switch";
import { Slider } from "@/socle/ui/slider";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useSound } from "@/socle/contextes/SoundContext";
import { useSoundSettings } from "@/domaines/profil/hooks/useSoundSettings";
import { toast } from "sonner";
import { useProfileSettings, type ThemePreference } from "@/socle/hooks/useProfileSettings";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { cn } from "@/socle/outils/utils";
import { ConsoleReglages } from "@/domaines/profil/composants/ConsoleReglages";
import { PanneauVisuel } from "@/domaines/profil/composants/reglages/PanneauVisuel";
import { PanneauAudio } from "@/domaines/profil/composants/reglages/PanneauAudio";
import { Panneau, Reglage, Segmente, Jauge } from "@/socle/ds/console-ui";
import { reagitAuxAbsences, reglerReactionAuxAbsences, VisageMia } from "@/domaines/mia";
import { useChromeFlottant } from "@/socle/outils/chromeFlottant";
import "@/socle/ds/reglages.css";
import { ACCENTS, NOMS_ACCENT, SONS } from "@/domaines/profil/logique/apparence";

export default function DisplaySound() {
  const { t } = useTranslation();

  /* CE RÉGLAGE VIT DANS LE NAVIGATEUR, PAS EN BASE.
     C'est une préférence de lecture — comment M.I.A se comporte sur cet
     écran — au même titre que la vue du calendrier ou le fond de Focus.
     Il rejoint donc PREF, et la remise à zéro des préférences l'emporte
     comme les autres. */
  const [miaAbsences, setMiaAbsences] = useState(() => reagitAuxAbsences());
  const [vignetteVisible, reglerVignette] = useChromeFlottant("mia");
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
    /* IL S EFFACE, IL NE REVIENT PAS A « EN ATTENTE ».

       Cette ligne etait masquee par la feuille de style quand elle a
       ete ecrite : revenir a un texte d attente ne coutait rien. La
       plaque lui ayant donne un pied, « en attente » s affichait en
       permanence sous chaque groupe — un journal qui parle avant que
       rien ne se soit passe. */
    minuteurs.current[panneau] = setTimeout(
      () => setJournaux((j) => { const s = { ...j }; delete s[panneau]; return s; }),
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

  /* Le volume entendu est celui de la glissiere, y compris pendant
     qu on la deplace : `localVolume` prime tant qu il existe. Sans
     cela on ecoutait le reglage precedent — et l on jugeait le
     nouveau sur l ancien. */
  const ecouter = useCallback((cle: string) => {
    try {
      const audio = new Audio(SONS[cle] || SONS.ui);
      audio.volume = localVolume ?? effective.volume ?? 0.35;
      void audio.play();
    } catch { /* un apercu qui ne part pas ne doit rien casser */ }
  }, [localVolume, effective.volume]);

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

  return (
    <ConsoleReglages
      titre={t("settings.displaySound.title")}
      note={t("settings.displaySound.subtitle")}
    >
      <PanneauVisuel
        profile={profile}
        updateProfile={updateProfile}
        setTheme={setTheme}
        noter={noter}
        enCours={enCours}
        journal={journaux.visuel ?? null}
        police={police}
        setLocalPolice={setLocalPolice}
      />

      <PanneauAudio
        effective={effective}
        persistSound={persistSound}
        noter={noter}
        journal={journaux.audio ?? null}
        volume={volume}
        setLocalVolume={setLocalVolume}
        ecouter={ecouter}
      />

      {/* ── CE QUI FLOTTE ──
          Il n'en reste qu'un. La barre ⌘K flottante a été retirée : la
          barre latérale porte désormais sa propre recherche, et deux
          portes côte à côte pour la même pièce ne valent pas un
          réglage. Le raccourci ⌘K, lui, fonctionne toujours. */}
      <Panneau
        code="Éléments flottants"
        etat={vignetteVisible ? "affichée" : "retirée"}
        ton={vignetteVisible ? "actif" : "neutre"}
        journal={null}
      >

        <Reglage
          nom="Vignette de M.I.A"
          note="Le sigle en bas à droite qui ouvre la console. Retirée, M.I.A reste joignable depuis la palette — « Ouvrir M.I.A »."
          icone={<VisageMia expression={vignetteVisible ? "calme" : "eteinte"} taille={18} cadre="visage" />}
        >
          <Switch
            checked={vignetteVisible}
            onCheckedChange={(v) => {
              reglerVignette(v);
              toast.success(v ? "La vignette est de retour." : "Vignette retirée. M.I.A reste dans la palette.");
            }}
          />
        </Reglage>
      </Panneau>

      {/* ── M.I.A ──
          Un compagnon qui commente vos absences devient insupportable en
          trois semaines. Elle se tait là-dessus par défaut ; ce
          commutateur l'autorise, pour qui le veut. */}
      <Panneau
        code="M.I.A"
        etat={miaAbsences ? "réagit aux absences" : "silencieuse"}
        ton={miaAbsences ? "actif" : "neutre"}
        journal={null}
      >
        <Reglage
          nom="Elle peut réagir à mes absences"
          note="Par défaut, M.I.A ne commente jamais ce que tu n'as pas fait : elle réagit à ce que tu fais et à l'état du pacte. Activé, elle prend un air abattu après dix jours sans pointage."
          icone={<VisageMia expression={miaAbsences ? "abattue" : "calme"} taille={18} cadre="visage" />}
        >
          <Switch
            checked={miaAbsences}
            onCheckedChange={(v) => {
              reglerReactionAuxAbsences(v);
              setMiaAbsences(v);
              toast.success(v ? "M.I.A réagira à tes absences." : "M.I.A se taira sur tes absences.");
            }}
          />
        </Reglage>
      </Panneau>

      {/* ── PARTICULES ── */}
      <Panneau
        code="Particules"
        etat={(profile?.particles_enabled ?? true)
          ? `${Math.round(intensite * 100)} %`
          : t("settings.console.off", "coupé")}
        ton={(profile?.particles_enabled ?? true) ? "actif" : "neutre"}
        journal={journaux.particules ?? null}
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
        journal={journaux.accent ?? null}
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
