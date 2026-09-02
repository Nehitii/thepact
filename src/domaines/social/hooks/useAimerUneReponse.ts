import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { useAuth } from "@/socle/contextes/AuthContext";
import { apresLeGeste } from "@/domaines/social/logique/reponseAimee";
import type { CommunityReply } from "@/domaines/social/types";

/* AIMER UN COMMENTAIRE, ET LE VOIR TOUT DE SUITE.
 *
 * Le meme dessin que « useReactions » : on pose en avance, on remet
 * comme avant si la base refuse, et on relit dans les deux cas — elle
 * a le dernier mot sur ce qui est ecrit.
 *
 * UN SEUL GESTE, PAS TROIS. Les trois reactions repondent a une
 * publication, qui raconte quelque chose ; un commentaire n appelle
 * qu un acquiescement. On ecrit donc « support », et la contrainte
 * « chk_reponse_aimee_seulement » refuse en base tout autre type sur
 * une reponse : une regle que seule l interface applique tombe des
 * qu on ecrit ailleurs.
 */

/** Le seul type qu une reponse accepte, comme la table l exige. */
const TYPE = "support";

type Instantane = { avant: [readonly unknown[], unknown][]; cle: readonly unknown[] } | undefined;

export function useAimerUneReponse(postId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  /* La cle est un prefixe : elle attrape la variante identifiee comme
     la variante anonyme, sans avoir a savoir laquelle est en cache.
     Tenue par « useMemo » parce qu elle entre dans les dependances
     des trois rappels ci-dessous : recreee a chaque rendu, elle les
     recreerait aussi, et les mutations perdraient leur identite. */
  const cle = useMemo(() => ["post-replies", postId] as const, [postId]);

  const retoucher = useCallback(
    (replyId: string, aimee: boolean) => {
      qc.setQueriesData<CommunityReply[]>({ queryKey: cle }, (ancien) =>
        ancien ? apresLeGeste(ancien, replyId, aimee) : ancien,
      );
    },
    [qc, cle],
  );

  const enAvance = useCallback(
    async (replyId: string, aimee: boolean): Promise<Instantane> => {
      await qc.cancelQueries({ queryKey: cle });
      const avant = qc.getQueriesData({ queryKey: cle });
      retoucher(replyId, aimee);
      return { avant, cle };
    },
    [qc, cle, retoucher],
  );

  const commeAvant = useCallback(
    (contexte: Instantane) => {
      if (!contexte) return;
      for (const [k, v] of contexte.avant) qc.setQueryData(k, v);
    },
    [qc],
  );

  const aimer = useMutation({
    mutationFn: async (replyId: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("community_reactions")
        .insert({ user_id: user.id, reply_id: replyId, reaction_type: TYPE });
      if (error) throw error;
    },
    onMutate: (replyId) => enAvance(replyId, true),
    onError: (_e, _v, contexte) => commeAvant(contexte),
    onSettled: () => qc.invalidateQueries({ queryKey: cle }),
  });

  const retirer = useMutation({
    mutationFn: async (replyId: string) => {
      if (!user) throw new Error("Must be logged in");
      /* On nomme la reponse ET le type : sans la premiere, le retrait
         porterait sur toutes les reactions de cette personne. La meme
         precaution que pour les publications, et pour la meme raison —
         la base l interdit deja, on ne compte pas dessus pour un
         DELETE. */
      const { error } = await supabase
        .from("community_reactions")
        .delete()
        .eq("user_id", user.id)
        .eq("reply_id", replyId)
        .eq("reaction_type", TYPE);
      if (error) throw error;
    },
    onMutate: (replyId) => enAvance(replyId, false),
    onError: (_e, _v, contexte) => commeAvant(contexte),
    onSettled: () => qc.invalidateQueries({ queryKey: cle }),
  });

  return { aimer, retirer, connecte: !!user };
}
