import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DailyQuest {
  id: string;
  user_id: string;
  season_id: string | null;
  date: string;
  kind: string;
  title: string;
  description: string | null;
  target: number;
  progress: number;
  reward_bonds: number;
  status: "active" | "completed" | "claimed" | "expired";
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Les ordres du jour, poses au besoin.
 *
 * ═══════════════════════════════════════════════════════════════
 * ILS NE SE DEMANDENT PLUS : ILS SONT LA.
 *
 * Avant, cette requete ne faisait que LIRE, et c'etait un bouton
 * « Generer » qui appelait une fonction edge pour les creer. Trois
 * choses n'allaient pas, toutes verifiees dans les donnees :
 *
 *   — la generation filtrait `goals` sur une colonne `user_id` qui
 *     n'existe pas (les objectifs passent par `pacts`), et lisait une
 *     table `habits` qui n'existe pas davantage. Deux des quatre
 *     ordres n'ont donc JAMAIS pu etre generes ;
 *   — aucune tache planifiee n'appelait cette fonction : son mode
 *     cron etait du code mort ;
 *   — l'appel manuel consommait un quota d'IA (dix par jour) pour un
 *     insert entierement deterministe : aucune IA n'intervient.
 *
 * Resultat : huit ordres en tout, sur quatre jours depuis mai, et
 * jamais que deux genres sur quatre. La carte etait donc toujours
 * vide — c'etait ca, le vrai defaut d'aspect.
 *
 * `assurer_ordres_du_jour` reprend la convention que le projet emploie
 * deja pour les offres de la boutique : idempotente, elle complete ce
 * qui manque et renvoie la journee entiere. Un seul aller-retour, et
 * plus rien a demander.
 * ═══════════════════════════════════════════════════════════════
 */
export function useDailyQuests() {
  const { user } = useAuth();
  /* Le jour est celui d'UTC, comme dans les declencheurs de
     progression cote base. Un jour local serait plus juste, mais il
     faudrait changer les quatre en meme temps. */
  const today = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["daily-quests", user?.id, today],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as unknown as (
        nom: string,
      ) => Promise<{ data: unknown; error: { message: string } | null }>)("assurer_ordres_du_jour");
      if (error) throw error;
      return ((data ?? []) as DailyQuest[]);
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

export function useClaimQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (questId: string) => {
      /* Meme recours que dans useDailyQuests : les types generes ne
         connaissent pas encore cette fonction. La conversion tient
         sur la ligne d appel, et la forme du retour reste decrite. */
      const { data, error } = await (supabase.rpc as unknown as (
        nom: string,
        args: Record<string, string>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>)("claim_quest", {
        _quest_id: questId,
      });
      if (error) throw error;
      return data as { reward?: number } | null;
    },
    onSuccess: (d) => {
      toast.success(`+${d?.reward ?? 0} Bonds`);
      qc.invalidateQueries({ queryKey: ["daily-quests"] });
      qc.invalidateQueries({ queryKey: ["bond-balance"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}