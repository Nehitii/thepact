import { Moon, Palette, Type, Laptop, Sun } from "lucide-react";
import { Panneau, Reglage, Segmente, Jauge } from "@/socle/ds/console-ui";
import { Switch } from "@/socle/ui/switch";
import { Slider } from "@/socle/ui/slider";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { ThemePreference } from "@/socle/hooks/useProfileSettings";

interface Props {
  /** Le profil lu, et de quoi l ecrire. */
  profile: { theme_preference?: string | null; reduce_motion?: boolean | null } | null | undefined;
  updateProfile: { mutate: (v: never, o?: { onSuccess?: () => void }) => void };
  /** Pose le theme sans attendre l aller-retour serveur. */
  setTheme: (v: ThemePreference) => void;
  /** Ce que la console inscrit dans son journal de bord. */
  noter: (panneau: string, texte: string, type?: "info" | "ok" | "warn") => void;
  enCours: boolean;
  journal: { texte: string; type?: "info" | "ok" | "warn" } | null;
  /** La taille de police en cours de reglage, et de quoi la relacher. */
  police: number;
  setLocalPolice: (n: number | null) => void;
}

/* L AFFICHAGE : le theme, les animations, la taille du texte.
 *
 * Sorti de la page, qui portait ses six panneaux dans une seule
 * fonction de quatre cent dix-neuf lignes. Ce panneau declare
 * maintenant ce qu il lit — la portee commune ne le disait pas. */
export function PanneauVisuel({
  profile, updateProfile, setTheme, noter, enCours, journal, police, setLocalPolice,
}: Props) {
  const { t } = useTranslation();
  return (
    <Panneau
      code="Affichage"
      etat={t("settings.console.synced", "synchronisé")}
      ton="actif"
      rang="primaire"
      taille="pleine"
      journal={journal}
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
            /* APERCU VIVANT.
                `AccentColorSync` n applique la taille qu une fois la
                valeur enregistree : on deplaçait donc une glissiere
                en lisant un nombre, sans voir le texte bouger. On
                pose la taille pendant le geste ; la synchro reprend
                la main a l enregistrement. */
            onValueChange={(v) => {
              const n = v[0] ?? 16;
              setLocalPolice(n);
              document.documentElement.style.fontSize = `${n}px`;
            }}
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
  );
}
