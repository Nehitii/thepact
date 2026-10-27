import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/socle/supabase/client";
import { refuserLImage, antiCache, extensionDe } from "@/domaines/profil/logique/imageDAvatar";

/* LES TROIS GESTES DE L AVATAR.
 *
 * Coller une adresse, deposer un fichier, le retirer. Un sujet, trois
 * poignees — et cent lignes qui vivaient au milieu du rendu de la
 * fiche.
 *
 * CE QU ELLES DECIDENT EST DANS `logique/imageDAvatar.ts` : les deux
 * regles de refus et l anti-cache. Ici il ne reste que les allers-
 * retours avec le stockage, qui ne s eprouvent pas sans lui.
 */
export function useAvatarDuProfil({
  userId, onAvatarUrlChange, fermer,
}: {
  userId: string;
  onAvatarUrlChange: (url: string | null) => void;
  /** Referme le dialogue quand le geste aboutit. */
  fermer: () => void;
}) {
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const handleSaveAvatar = async () => {
    const saisie = avatarUrlInput.trim();
    if (!saisie) return;

    /* Une adresse d image, pas n importe quelle chaine. Un \`javascript:\`
       ne s execute pas dans un \`src\`, mais rien ne verifiait meme qu il
       s agissait d une adresse. */
    try {
      const adresse = new URL(saisie);
      if (adresse.protocol !== "https:" && adresse.protocol !== "http:") throw new Error("schéma");
    } catch {
      toast.error("Adresse invalide", { description: "Colle une adresse commençant par https://" });
      return;
    }

    const { error } = await supabase.from("profiles").update({ avatar_url: saisie }).eq("id", userId);
    if (error) {
      toast.error("Erreur", { description: error.message });
      return;
    }

    /* Ce qu on AFFICHE porte l anti-cache ; ce qu on STOCKE ne le porte
       pas. Les deux etaient confondus : \`handleSave\` reecrivait ensuite
       l adresse horodatee dans la colonne, et le \`?t=…\` y restait. */
    onAvatarUrlChange(antiCache(saisie));
    toast.success("Avatar enregistré");
    fermer();
    setAvatarUrlInput("");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    /* Les deux regles vivent dans `logique/imageDAvatar.ts` : un filtre
       qui laisse tout passer ne se voit pas. */
    const refus = refuserLImage(file);
    if (refus === "format") {
      toast.error("Format refusé", { description: "JPG, PNG, WEBP ou GIF." });
      return;
    }
    if (refus === "poids") {
      toast.error("Fichier trop lourd", { description: "5 Mo au maximum." });
      return;
    }

    setUploading(true);
    try {
      const { optimizeImage } = await import("@/socle/outils/imageOptimization");
      const optimized = await optimizeImage(file, "avatar");
      const fileExt = extensionDe(optimized.type);
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("goal-images")
        .upload(filePath, optimized, {
          upsert: true,
          contentType: optimized.type,
          cacheControl: "31536000",
        });
      if (uploadError) throw uploadError;

      const { data: signedUrlData } = await supabase.storage
        .from("goal-images")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      if (!signedUrlData?.signedUrl) throw new Error("L’adresse du fichier n’a pas pu être créée.");

      const { error: majError } = await supabase
        .from("profiles")
        .update({ avatar_url: signedUrlData.signedUrl })
        .eq("id", userId);
      if (majError) throw majError;

      onAvatarUrlChange(antiCache(signedUrlData.signedUrl));
      toast.success("Avatar envoyé");
    } catch (error) {
      toast.error("Envoi impossible", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setUploading(false);
      fermer();
    }
  };


  const retirerAvatar = async () => {
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
    if (error) {
      toast.error("Erreur", { description: error.message });
      return;
    }
    onAvatarUrlChange(null);
    toast.success("Avatar retiré");
    fermer();
  };
  return {
    avatarUrlInput, setAvatarUrlInput, uploading,
    handleSaveAvatar, handleFileUpload, retirerAvatar,
  };
}
