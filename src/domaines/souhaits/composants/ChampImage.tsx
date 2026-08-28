import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { optimizeImage } from "@/lib/imageOptimization";
import {
  DEPOT_WISHLIST, cheminDuDepot, cheminPourNouveauFichier, referenceDepot,
} from "@/lib/wishlistDepot";

const TYPES_ACCEPTES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const POIDS_MAX = 5 * 1024 * 1024;

interface ChampImageProps {
  /** Une adresse, ou une reference « depot: ». */
  value: string;
  onChange: (valeur: string) => void;
  userId: string | undefined;
}

/**
 * UNE ADRESSE, OU UN FICHIER.
 *
 * Le champ n acceptait qu une adresse. Or une image de produit n est
 * pas toujours en ligne : une photo prise soi-meme, une capture, un
 * visuel envoye par quelqu un n ont pas d URL. Il fallait passer par
 * un hebergeur tiers pour poser une image dans sa propre liste.
 *
 * Le fichier est reduit avant l envoi — l optimiseur de
 * l application, profil « goal » : 1 200 pixels au plus grand cote,
 * converti en WebP. Une photo de telephone de quatre megaoctets en
 * pese alors quelques dizaines de kilo.
 *
 * Ce qui est enregistre n est PAS une adresse signee mais le chemin
 * dans le depot : une signature expire, un chemin non.
 */
export function ChampImage({ value, onChange, userId }: ChampImageProps) {
  const { t } = useTranslation();
  const champFichier = useRef<HTMLInputElement>(null);
  const [enVol, setEnVol] = useState(false);
  const [apercu, setApercu] = useState<string | null>(null);

  /* Une reference de depot ne s affiche pas telle quelle : on la
     signe pour la duree de la fenetre. */
  useEffect(() => {
    let vivant = true;
    const chemin = cheminDuDepot(value);
    if (!chemin) { setApercu(value.trim() || null); return; }

    supabase.storage.from(DEPOT_WISHLIST).createSignedUrl(chemin, 3600)
      .then(({ data }) => { if (vivant) setApercu(data?.signedUrl ?? null); })
      .catch(() => { if (vivant) setApercu(null); });

    return () => { vivant = false; };
  }, [value]);

  const deposer = async (fichier: File) => {
    if (!userId) return;

    if (!TYPES_ACCEPTES.includes(fichier.type)) {
      toast.error(t("wishlist.depot.typeRefuse", "Format non accepté"), {
        description: t("wishlist.depot.typeAide", "JPG, PNG, WebP ou GIF."),
      });
      return;
    }
    if (fichier.size > POIDS_MAX) {
      toast.error(t("wishlist.depot.tropLourd", "Fichier trop lourd"), {
        description: t("wishlist.depot.poidsAide", "5 Mo au maximum."),
      });
      return;
    }

    setEnVol(true);
    try {
      const reduit = await optimizeImage(fichier, "goal");
      const extension = reduit.type === "image/gif" ? "gif" : "webp";
      const chemin = cheminPourNouveauFichier(userId, extension);

      const { data, error } = await supabase.storage
        .from(DEPOT_WISHLIST)
        .upload(chemin, reduit, { contentType: reduit.type, cacheControl: "31536000", upsert: false });

      if (error) throw error;
      onChange(referenceDepot(data.path));
      toast.success(t("wishlist.depot.pose", "Image déposée"));
    } catch (e) {
      toast.error(t("wishlist.depot.echec", "Dépôt impossible"), {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setEnVol(false);
      if (champFichier.current) champFichier.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("wishlist.depot.adresseOuFichier", "https://… ou dépose un fichier")}
          className="flex-1 min-w-0 h-10 px-3 bg-transparent border border-[var(--wl-trait)] font-mono text-xs text-[var(--wl-encre)]"
        />
        <input
          ref={champFichier}
          type="file"
          accept={TYPES_ACCEPTES.join(",")}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) deposer(f); }}
        />
        <button
          type="button"
          className="wl-tri shrink-0"
          onClick={() => champFichier.current?.click()}
          disabled={enVol || !userId}
          title={t("wishlist.depot.deposer", "Déposer un fichier")}
        >
          {enVol
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            : <Upload className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>
        {value && (
          <button
            type="button"
            className="wl-outil wl-outil--danger shrink-0"
            onClick={() => onChange("")}
            title={t("wishlist.depot.retirer", "Retirer l’image")}
          >
            <X aria-hidden="true" />
          </button>
        )}
      </div>

      {apercu ? (
        <div className="wl-vignette wl-controle-image">
          <img src={apercu} alt="" loading="lazy" decoding="async"
            onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
        </div>
      ) : (
        <button
          type="button"
          className="wl-depot-vide"
          onClick={() => champFichier.current?.click()}
          disabled={!userId}
        >
          <ImagePlus aria-hidden="true" />
          {t("wishlist.depot.vide", "Coller une adresse, ou déposer un fichier")}
        </button>
      )}
    </div>
  );
}
