/* LES REACTIONS A UNE PUBLICATION.
 *
 * Poser une reaction, la retirer, et la retouche de video qui les
 * accompagne. Sorties de `usePublications.ts`, qui faisait 539 lignes
 * et melait publications, reponses, reactions et signalements.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { useAuth } from "@/socle/contextes/AuthContext";
import type { VictoryReel } from "@/domaines/social/types";
import { poserEnAvance, remettreCommeAvant, type CibleReaction } from "@/domaines/social/hooks/usePublications";

export type TypeDeReaction = 'support' | 'respect' | 'inspired';

/** Le meme geste, sur une video. */
export function retoucherLesVideos(
  queryClient: ReturnType<typeof useQueryClient>,
  reelId: string,
  type: TypeDeReaction,
  delta: 1 | -1,
) {
  queryClient.setQueriesData<VictoryReel[]>({ queryKey: ["victory-reels"] }, (ancien) => {
    if (!ancien) return ancien;
    return ancien.map((r) => {
      if (r.id !== reelId) return r;
      const compte = { ...(r.reactions_count ?? { support: 0, respect: 0, inspired: 0 }) };
      compte[type] = Math.max(0, (compte[type] ?? 0) + delta);
      return {
        ...r,
        [`${type}_count`]: compte[type],
        reactions_count: compte,
        user_reactions: delta === 1
          ? [...(r.user_reactions ?? []), type]
          : (r.user_reactions ?? []).filter((x) => x !== type),
      } as VictoryReel;
    });
  });
}

// Add a reaction
export function useAddReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CibleReaction) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await (supabase
        .from("community_reactions")
        .insert({
          user_id: user.id,
          post_id: data.post_id || null,
          reel_id: data.reel_id || null,
          reaction_type: data.reaction_type
        }));

      if (error) throw error;
    },
    onMutate: (data) => poserEnAvance(queryClient, data, 1),
    onError: (_e, _v, contexte) => remettreCommeAvant(queryClient, contexte),
  });
}

// Remove a reaction
export function useRemoveReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CibleReaction) => {
      if (!user) throw new Error("Must be logged in");
      /* Une reaction porte un post OU une video, jamais ni l un ni
         l autre : sans ce garde-fou, la suppression n aurait porte que
         sur l utilisateur et le type, et aurait efface toutes ses
         reactions de ce type. La base l interdit deja par
         chk_post_or_reel ; on ne compte pas dessus pour un DELETE. */
      if (!data.post_id && !data.reel_id) throw new Error("post_id ou reel_id requis");

      let query = supabase
        .from("community_reactions")
        .delete()
        .eq("user_id", user.id)
        .eq("reaction_type", data.reaction_type);

      if (data.post_id) {
        query = query.eq("post_id", data.post_id);
      }
      if (data.reel_id) {
        query = query.eq("reel_id", data.reel_id);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onMutate: (data) => poserEnAvance(queryClient, data, -1),
    onError: (_e, _v, contexte) => remettreCommeAvant(queryClient, contexte),
  });
}
