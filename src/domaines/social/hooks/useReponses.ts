/* LES REPONSES A UNE PUBLICATION.
 *
 * Les lire, en ajouter une, en retirer une. Sorties de
 * `usePublications.ts` avec les reactions, pour la meme raison : un
 * fichier qui tient quatre sujets se lit quatre fois.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { useAuth } from "@/socle/contextes/AuthContext";
import { chargerProfilsPublics } from "@/domaines/profil";
import type { CommunityReply } from "@/domaines/social/types";

// Fetch replies for a specific post
export function usePostReplies(postId: string | undefined) {
  const { user } = useAuth();
  const moi = user?.id;
  return useQuery({
    /* L identite entre dans la cle : deux comptes sur le meme appareil
       ne partagent pas la meme reponse a « est-ce que je l ai aime ». */
    queryKey: ["post-replies", postId, moi],
    queryFn: async () => {
      if (!postId) return [];

      const { data: replies, error } = await (supabase
        .from("community_replies")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true }));

      if (error) throw error;
      if (!replies || replies.length === 0) return [];

      const userIds = [...new Set(replies.map((r) => r.user_id))] as string[];
      const profilesMap = await chargerProfilsPublics(userIds);

      /* CE QUE J AI DEJA AIME, EN UNE SEULE LECTURE. La table des
         reactions ne dit pas « aime par moi » : elle porte une ligne
         par personne et par cible. On demande donc les miennes sur
         ces reponses-la, plutot qu une requete par commentaire. */
      let miennes = new Set<string>();
      if (moi) {
        const { data: aimees } = await supabase
          .from("community_reactions")
          .select("reply_id")
          .eq("user_id", moi)
          .in("reply_id", replies.map((r) => r.id));
        miennes = new Set((aimees ?? []).map((a) => a.reply_id as string));
      }

      return replies.map((reply) => ({
        ...reply,
        profile: profilesMap.get(reply.user_id),
        aimee_par_moi: miennes.has(reply.id),
      })) as CommunityReply[];
    },
    enabled: !!postId,
  });
}

// Add a reply
export function useAddReply() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { post_id: string; content: string }) => {
      if (!user) throw new Error("Must be logged in");

      const { data: reply, error } = await (supabase
        .from("community_replies")
        .insert({
          user_id: user.id,
          post_id: data.post_id,
          content: data.content
        })
        .select()
        .single());

      if (error) throw error;
      return reply;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["post-replies", variables.post_id] });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    }
  });
}

// Delete a reply
export function useDeleteReply() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { replyId: string; postId: string }) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await (supabase
        .from("community_replies")
        .delete()
        .eq("id", data.replyId)
        .eq("user_id", user.id));

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["post-replies", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    }
  });
}
