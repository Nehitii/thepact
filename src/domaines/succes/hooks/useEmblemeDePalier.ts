import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/socle/supabase/client";
import { optimizeImage } from "@/socle/outils/imageOptimization";
import {
  CACHE_UN_AN, DEPOT_EMBLEMES, TAILLE_MAX, cheminDeLEmbleme, cheminPourNouvelEmbleme,
} from "@/domaines/succes/logique/emblemeDePalier";

/**
 * TELEVERSER L EMBLEME D UN PALIER.
 *
 * La mecanique est celle du cadreur d image de finance, qui sert la
 * meme chose pour les logos de creancier depuis le debut : optimisation
 * au format « logo », conversion en webp, plafond de deux mega-octets,
 * chemin horodate sous l identifiant du membre, et un an de cache
 * puisque le chemin change a chaque remplacement.
 *
 * Elle n est pas reinventee ici — elle est reprise, et ce qu elle a de
 * calculable est descendu dans `logique/emblemeDePalier.ts`, avec ses
 * tests. Ce hook ne garde que ce qui touche au reseau et a l ecran.
 */
export function useEmblemeDePalier(onAdresse: (url: string | null) => void) {
  const { t } = useTranslation();
  const [envoi, setEnvoi] = useState(false);

  const televerser = async (fichier: File) => {
    if (!fichier.type.startsWith("image/")) {
      toast.error(t("ranks.embleme.mauvaisType", "Ce fichier n'est pas une image."));
      return;
    }
    if (fichier.size > TAILLE_MAX) {
      toast.error(t("ranks.embleme.tropLourd", "L'image dépasse 2 Mo."));
      return;
    }
    setEnvoi(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("sans session");

      /* Le format « logo » vise cinq cent douze pixels : un embleme est
         un aplat de couleurs, pas une photographie, et le noyau ne lui
         donne jamais plus de la moitie de sa largeur. */
      const optimise = await optimizeImage(fichier, "logo");
      const ext = optimise.type === "image/gif" ? "gif" : "webp";
      const chemin = cheminPourNouvelEmbleme(user.id, ext);

      const { error } = await supabase.storage.from(DEPOT_EMBLEMES).upload(chemin, optimise, {
        upsert: true,
        contentType: optimise.type,
        cacheControl: CACHE_UN_AN,
      });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from(DEPOT_EMBLEMES).getPublicUrl(chemin);
      onAdresse(publicUrl);
    } catch (e) {
      toast.error(t("ranks.embleme.echec", "L'image n'a pas pu être envoyée."));
      console.error(e);
    } finally {
      setEnvoi(false);
    }
  };

  return { envoi, televerser };
}

/**
 * Retirer du depot l embleme d un palier qu on supprime.
 *
 * ON NE SUPPRIME QUE CE QU ON A ECRIT : `cheminDeLEmbleme` rend `null`
 * pour une adresse exterieure, et l appel n a alors pas lieu. Sans
 * cela, chaque essai d embleme laisserait un fichier que personne ne
 * nettoiera jamais.
 *
 * L echec ne remonte pas : le palier, lui, est bien supprime, et
 * refuser cette suppression pour un fichier reste serait echanger une
 * gene contre un blocage.
 */
export async function retirerLEmbleme(adresse: string | null | undefined): Promise<void> {
  const chemin = cheminDeLEmbleme(adresse);
  if (!chemin) return;
  const { error } = await supabase.storage.from(DEPOT_EMBLEMES).remove([chemin]);
  if (error) console.warn("[embleme] fichier non retire :", error.message);
}
