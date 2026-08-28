/**
 * LA PROVENANCE D UNE PIECE DU PACTE.
 *
 * Un article de wishlist issu d un objectif porte un
 * source_goal_cost_id, et rien d autre. Il ne sait pas a quelle
 * ETAPE il est rattache, alors que c est la seule chose qui explique
 * pourquoi il est coche : depuis le declencheur
 * etape_validee_paie_sa_piece, valider l etape marque la piece
 * acquise et pose acquired_via_step.
 *
 * Sans cette lecture, la liste affiche une case cochee que personne
 * n a cochee. Avec elle, elle peut dire « acquise par l etape 4 ».
 *
 * Une seule requete pour toute la page.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";

export interface PieceDeLEtape {
  /** Vrai quand acquired_at a ete pose par la validation de l etape. */
  parLEtape: boolean;
  etapeTitre: string | null;
  etapeRang: number | null;
  etapeFaite: boolean;
}

export function useWishlistPieces(userId: string | undefined, costIds: string[]) {
  /* La cle porte les identifiants tries : deux rendus avec les memes
     pieces partagent le meme cache, quel que soit l ordre d arrivee. */
  const cle = [...costIds].sort().join(",");

  return useQuery({
    queryKey: ["wishlist-pieces", userId, cle],
    enabled: !!userId && costIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goal_cost_items")
        .select("id, acquired_via_step, step:steps(title, order, status)")
        .in("id", costIds);

      if (error) throw error;

      const parPiece = new Map<string, PieceDeLEtape>();
      for (const ligne of data ?? []) {
        const etape = ligne.step;
        parPiece.set(ligne.id, {
          parLEtape: Boolean(ligne.acquired_via_step),
          etapeTitre: etape?.title ?? null,
          etapeRang: etape?.order ?? null,
          etapeFaite: etape?.status === "completed",
        });
      }
      return parPiece;
    },
  });
}
