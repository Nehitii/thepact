import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* LE RANG DE QUELQU UN D AUTRE.
 *
 * Les dix paliers — Novice, Apprenti, Adepte, Vétéran, Expert, Maître,
 * Grand-Maître, Seigneur, Roi, Empereur — existaient deja, et l XP qui
 * les franchit etait deja calcule. Mais useRankXP le calcule COTE
 * CLIENT, a partir des objectifs de la personne connectee : personne
 * ne pouvait donc voir le rang de quelqu un d autre. Le rang ne
 * sortait jamais des pages Accueil et Profil.
 *
 * La fonction en base applique la meme formule, a l identique, pour
 * n importe qui — et pour toute une liste en un seul aller-retour,
 * plutot qu une requete par membre.
 *
 * Chacun definit SES propres paliers dans « ranks » : deux personnes
 * au meme XP peuvent porter des noms differents. C est voulu. */

export interface Rang {
  xp: number;
  nom: string | null;
  couleur: string | null;
  seuil: number | null;
}

/** Le rang de chaque identifiant donne, en une requete. */
export function useRangs(userIds: string[]) {
  /* Trie et dedoublonne : sans cela, deux listes des memes personnes
     dans un ordre different seraient deux entrees de cache. */
  const cles = [...new Set(userIds)].sort();

  return useQuery({
    queryKey: ["rangs", cles],
    enabled: cles.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<Map<string, Rang>> => {
      const { data, error } = await supabase.rpc("rangs_des_membres", { p_user_ids: cles });
      if (error) throw error;
      return new Map(
        (data || []).map((l) => [
          l.user_id,
          { xp: l.xp ?? 0, nom: l.rang, couleur: l.couleur, seuil: l.seuil },
        ]),
      );
    },
  });
}
