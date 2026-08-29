import { useEffect, useState } from "react";
import { supabase } from "@/socle/supabase/client";
/* LES TROIS FORMES QUE CET ECRAN LIT — plus etroites que celles de la
   boutique : la fiche publique ne montre ni le prix ni la date de
   retrait. Demander le type le plus riche obligerait a transtyper a
   chaque requete. */
export interface CosmeticFrame {
  id: string;
  name: string;
  rarity: string;
  border_color: string;
  glow_color: string;
  preview_url: string | null;
  is_default: boolean;
  frame_scale?: number | null;
  frame_offset_x?: number | null;
  frame_offset_y?: number | null;
  show_border?: boolean | null;
  avatar_border_color?: string | null;
}

export interface CosmeticBanner {
  id: string;
  name: string;
  rarity: string;
  gradient_start: string | null;
  gradient_end: string | null;
  banner_url: string | null;
  is_default: boolean;
}

export interface CosmeticTitle {
  id: string;
  title_text: string;
  rarity: string;
  glow_color: string | null;
  text_color: string | null;
  is_default: boolean;
}

/* LES COSMETIQUES D UNE FICHE PUBLIQUE.
 *
 * Cinq requetes, trois ensembles de possession, et le choix actif de
 * chaque famille. Le tout vivait dans le composant, entre le rendu de
 * la banniere et celui du titre.
 *
 * LE CHOIX ACTIF SE REPLIE SUR LE DEFAUT, TROIS FOIS. Un cadre retire
 * du catalogue, ou jamais choisi, laisse la fiche sans cadre du tout —
 * ce qui ressemble a une fiche cassee plutot qu a une fiche sobre.
 */
export function useCosmetiquesDuProfil(userId: string) {
  const [chargement, setChargement] = useState(true);
  const [panne, setPanne] = useState<string | null>(null);
  const [frames, setFrames] = useState<CosmeticFrame[]>([]);
  const [banners, setBanners] = useState<CosmeticBanner[]>([]);
  const [titles, setTitles] = useState<CosmeticTitle[]>([]);

  const [ownedFrameIds, setOwnedFrameIds] = useState<Set<string>>(new Set());
  const [ownedBannerIds, setOwnedBannerIds] = useState<Set<string>>(new Set());
  const [ownedTitleIds, setOwnedTitleIds] = useState<Set<string>>(new Set());

  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
  const [activeBannerId, setActiveBannerId] = useState<string | null>(null);
  const [activeTitleId, setActiveTitleId] = useState<string | null>(null);

  // Derived
  const activeFrame = choixActif(frames, activeFrameId);
  const activeBanner = choixActif(banners, activeBannerId);
  const activeTitle = choixActif(titles, activeTitleId);

  /* CINQ REQUETES, AUCUNE ERREUR LUE.
     Un `if (data)` suffisait a tout : une panne de lecture rendait un
     inventaire vide, impossible a distinguer d un inventaire
     reellement vide — et l ecran laissait croire que rien n avait ete
     acquis. On lit desormais l echec, et on le dit. */
  useEffect(() => {
    let vivant = true;
    const loadData = async () => {
      setChargement(true);
      try {
        const [framesRes, bannersRes, titlesRes, ownershipRes, profileRes] = await Promise.all([
          supabase.from("cosmetic_frames").select("*").eq("is_active", true),
          supabase.from("cosmetic_banners").select("*").eq("is_active", true),
          supabase.from("cosmetic_titles").select("*").eq("is_active", true),
          supabase.from("user_cosmetics").select("cosmetic_type, cosmetic_id").eq("user_id", userId),
          supabase.from("profiles").select("active_frame_id, active_banner_id, active_title_id").eq("id", userId).single(),
        ]);

        const echec = [framesRes, bannersRes, titlesRes, ownershipRes, profileRes].find((r) => r.error);
        if (echec?.error) throw echec.error;
        if (!vivant) return;

        setFrames(framesRes.data ?? []);
        setBanners(bannersRes.data ?? []);
        setTitles(titlesRes.data ?? []);

        const possede = ownershipRes.data ?? [];
        setOwnedFrameIds(new Set(possede.filter((o) => o.cosmetic_type === "frame").map((o) => o.cosmetic_id)));
        setOwnedBannerIds(new Set(possede.filter((o) => o.cosmetic_type === "banner").map((o) => o.cosmetic_id)));
        setOwnedTitleIds(new Set(possede.filter((o) => o.cosmetic_type === "title").map((o) => o.cosmetic_id)));

        setActiveFrameId(profileRes.data?.active_frame_id ?? null);
        setActiveBannerId(profileRes.data?.active_banner_id ?? null);
        setActiveTitleId(profileRes.data?.active_title_id ?? null);
        setPanne(null);
      } catch (e) {
        if (!vivant) return;
        setPanne(e instanceof Error ? e.message : String(e));
      } finally {
        if (vivant) setChargement(false);
      }
    };
    loadData();
    return () => { vivant = false; };
  }, [userId]);
  return {
    frames, banners, titles,
    ownedFrameIds, ownedBannerIds, ownedTitleIds,
    activeFrameId, setActiveFrameId,
    activeBannerId, setActiveBannerId,
    activeTitleId, setActiveTitleId,
    activeFrame, activeBanner, activeTitle,
    chargement, panne,
  };
}

/* LE CHOIX ACTIF, OU LE DEFAUT. Ecrite une fois plutot que trois : les
   trois familles suivent la meme regle, et une divergence entre elles
   ne se verrait que sur une fiche a la fois. */
export function choixActif<T extends { id: string; is_default?: boolean | null }>(
  catalogue: T[],
  choisiId: string | null,
): T | undefined {
  return catalogue.find((x) => x.id === choisiId) ?? catalogue.find((x) => x.is_default);
}
