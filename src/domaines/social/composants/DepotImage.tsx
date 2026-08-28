import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  POIDS_MAX, TYPES_ACCEPTES, deposerImageGuilde, estUnTypeAccepte,
  retirerImageGuilde, type Usage,
} from "@/domaines/social/logique/guildMedia";

/* DEPOSER UNE BANNIERE OU UN EMBLEME.
 *
 * L ancienne image est retiree du depot APRES que la nouvelle est
 * enregistree, jamais avant : si l enregistrement echoue, on prefere un
 * fichier orphelin a une guilde sans banniere. */

interface Props {
  guildId: string;
  usage: Usage;
  url: string | null;
  onChange: (url: string | null) => void;
  label: string;
}

export function DepotImage({ guildId, usage, url, onChange, label }: Props) {
  const { t } = useTranslation();
  const [occupe, setOccupe] = useState(false);
  const champ = useRef<HTMLInputElement>(null);

  const choisir = async (fichier: File | undefined) => {
    if (!fichier) return;
    if (!estUnTypeAccepte(fichier.type)) {
      toast.error(t("guild.mediaTypeRefused", "Ce format d’image n’est pas accepté"));
      return;
    }
    setOccupe(true);
    try {
      const { url: neuve } = await deposerImageGuilde(fichier, guildId, usage);
      const ancienne = url;
      onChange(neuve);
      if (ancienne) await retirerImageGuilde(ancienne);
    } catch (e) {
      toast.error(
        e instanceof Error && e.message === "trop-lourd"
          ? t("guild.mediaTooHeavy", "Image trop lourde — {{max}} Mo au maximum", {
              max: Math.round(POIDS_MAX / 1024 / 1024),
            })
          : t("guild.mediaFailed", "Le dépôt a échoué"),
      );
    } finally {
      setOccupe(false);
      if (champ.current) champ.current.value = "";
    }
  };

  return (
    <div className={`gu-depot gu-depot--${usage}`}>
      <input
        ref={champ}
        type="file"
        accept={TYPES_ACCEPTES.join(",")}
        aria-label={label}
        disabled={occupe}
        onChange={(e) => choisir(e.target.files?.[0])}
      />
      {url ? <img src={url} alt="" aria-hidden="true" /> : (
        <span className="gu-depot-vide">
          {occupe ? <Loader2 className="co-tourne" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
          {usage === "banniere" ? label : null}
        </span>
      )}
      {url && !occupe && (
        <button
          type="button"
          className="gu-depot-retirer"
          aria-label={t("guild.mediaRemove", "Retirer l’image")}
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const ancienne = url;
            onChange(null);
            await retirerImageGuilde(ancienne);
          }}
        >
          <X aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
