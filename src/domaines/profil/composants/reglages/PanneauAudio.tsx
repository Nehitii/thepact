import type { SoundSettings } from "@/socle/contextes/SoundContext";
import { Panneau, Reglage, Jauge } from "@/socle/ds/console-ui";
import { Switch } from "@/socle/ui/switch";
import { Slider } from "@/socle/ui/slider";
import { Button } from "@/socle/ui/button";
import { Volume2, VolumeX, Play } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  /** Les reglages de son en vigueur, et de quoi les ecrire. */
  effective: SoundSettings;
  persistSound: (next: SoundSettings) => void;
  noter: (panneau: string, texte: string, type?: "info" | "ok" | "warn") => void;
  journal: { texte: string; type?: "info" | "ok" | "warn" } | null;
  /** Le volume en cours de reglage, et de quoi le relacher. */
  volume: number;
  setLocalVolume: (n: number | null) => void;
  /** Fait entendre un son de la categorie demandee. */
  ecouter: (cle: string) => void;
}

/* LE SON : le general, le volume, et chaque categorie.
 *
 * Sorti de la page, qui portait ses six panneaux dans une seule
 * fonction de quatre cent dix-neuf lignes. Ce panneau declare
 * maintenant ce qu il lit — la portee commune ne le disait pas. */
export function PanneauAudio({
  effective, persistSound, noter, journal, volume, setLocalVolume, ecouter,
}: Props) {
  const { t } = useTranslation();
  return (
    <Panneau
      code="Son"
      etat={effective.masterEnabled
        ? t("settings.console.on", "actif")
        : t("settings.console.off", "coupé")}
      ton={effective.masterEnabled ? "actif" : "alerte"}
      taille="pleine"
      journal={journal}
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
          {/* COUPER N EST PAS METTRE A ZERO.
               La glissiere etait verrouillee des que le son general
               etait coupe : impossible de preparer son niveau avant
               de rallumer. Aucun systeme d exploitation ne fait ca. */}
          <Slider
            value={[Math.round(volume * 100)]}
            max={100}
            step={1}
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
            {/* L ecoute, elle, reste liee au son general : appuyer
                 sur « ecouter » et n entendre rien serait pire qu un
                 bouton eteint. */}
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
              aria-label={t(nomCle)}
              checked={!!effective[cle]}
              onCheckedChange={(v) => {
                persistSound({ ...effective, [cle]: v });
                noter("audio", `${t(nomCle).toLowerCase()} → ${v ? "actif" : "coupé"}`);
              }}
            />
          </div>
        </Reglage>
      ))}
    </Panneau>
  );
}
