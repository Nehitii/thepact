/* CE QUI ENTOURE LE FIL : les objectifs qu on peut y rattacher, et
   les chiffres de la communaute. */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CommunityPost, CompletedGoal, UserGoal } from "./types";

// Get user's completed goals (FIX: query through pacts, not user_id)
export function useCompletedGoals() {
  const { user } = useAuth();

  return useQuery<CompletedGoal[]>({
    queryKey: ["completed-goals", user?.id],
    queryFn: async (): Promise<CompletedGoal[]> => {
      if (!user) return [];

      // First get user's pact
      const { data: pact } = await supabase
        .from("pacts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!pact) return [];

      const { data: goals, error } = await (supabase
        .from("goals")
        .select("id, name, type, difficulty, start_date, completion_date, status")
        .eq("pact_id", pact.id));

      if (error) throw error;

      return ((goals ?? []))
        .filter((g) => g.status === "fully_completed" || g.status === "validated")
        .map((g) => ({
          id: g.id,
          name: g.name,
          type: g.type,
          difficulty: g.difficulty,
          start_date: g.start_date,
          completion_date: g.completion_date
        }));
    },
    enabled: !!user,
  });
}

// Get ALL user goals (active + completed) for post linking
export function useUserGoals() {
  const { user } = useAuth();

  return useQuery<UserGoal[]>({
    queryKey: ["user-goals-all", user?.id],
    queryFn: async (): Promise<UserGoal[]> => {
      if (!user) return [];

      const { data: pact } = await supabase
        .from("pacts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!pact) return [];

      const { data: goals, error } = await (supabase
        .from("goals")
        .select("id, name, type, difficulty, status, start_date, completion_date")
        .eq("pact_id", pact.id)
        .order("created_at", { ascending: false }));

      if (error) throw error;

      return ((goals ?? [])).map((g) => ({
        id: g.id,
        name: g.name,
        type: g.type,
        difficulty: g.difficulty,
        status: g.status,
        start_date: g.start_date,
        completion_date: g.completion_date
      }));
    },
    enabled: !!user,
  });
}

/* LES CHIFFRES DE LA COMMUNAUTE.
 *
 * Ce hook ne rendait que deux valeurs, et la page en affichait sept :
 * les cinq autres etaient ecrites a la main dans le JSX — un « 38 »
 * pour les objectifs accomplis, un « 184 » pour des videos dont la
 * table etait vide, et trois tirets litteraux dans le bandeau. Un
 * onglet promettait donc 184 videos et ouvrait sur rien.
 *
 * Deux principes ici, et un renoncement.
 *
 * 1. RIEN QUI NE SE CALCULE PAS. « Objectifs accomplis aujourd hui »
 *    n est pas calculable depuis le client : RLS ne laisse voir que
 *    ses propres objectifs, un total communautaire demanderait une
 *    fonction en base. On ne l affiche donc pas — plutot que de
 *    laisser un tiret en permanence.
 *
 * 2. CHAQUE ETIQUETTE DIT CE QU ELLE COMPTE. L ancien
 *    « activeMembers » etait affiche sous « Online now » alors qu il
 *    comptait les AUTEURS DISTINCTS des sept derniers jours. On peut
 *    etre connecte sans avoir poste. Le champ s appelle desormais
 *    auteursSemaine, et rien ne pretend mesurer une presence.
 *
 * L ancienne version lancait deux requetes sur la meme table pour la
 * meme semaine : la seconde ramenait deja toutes les lignes, sa
 * longueur donnait le compte que la premiere allait chercher.
 */
export interface StatsCommunaute {
  postsSemaine: number;
  /** Combien de posts par nature — alimente le bloc « Sujets » du rail. */
  parNature: Record<CommunityPost["post_type"], number>;
  auteursSemaine: number;
  postsTotal: number;
  reactionsTotal: number;
  reponsesTotal: number;
  reelsTotal: number;
}

export function useCommunityStats() {
  return useQuery<StatsCommunaute>({
    queryKey: ["community-stats"],
    queryFn: async () => {
      const ilYaUneSemaine = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const compte = (table: "community_posts" | "community_reactions" | "community_replies" | "victory_reels") =>
        supabase.from(table).select("id", { count: "exact", head: true });

      const [semaine, posts, reactions, reponses, reels, natures] = await Promise.all([
        supabase.from("community_posts").select("user_id").gte("created_at", ilYaUneSemaine),
        compte("community_posts"),
        compte("community_reactions"),
        compte("community_replies"),
        compte("victory_reels"),
        /* La repartition par nature. Le client compte lui-meme : le
           SDK ne sait pas grouper. Plafonne a mille lignes — au-dela,
           il faudra une fonction en base, et le bloc le dira. */
        supabase.from("community_posts").select("post_type").limit(1000),
      ]);

      const parNature = { reflection: 0, progress: 0, obstacle: 0, mindset: 0, help_request: 0, encouragement: 0 } as Record<CommunityPost["post_type"], number>;
      for (const l of natures.data || []) {
        const n = l.post_type as CommunityPost["post_type"];
        if (n in parNature) parNature[n] += 1;
      }

      const lignes = semaine.data || [];
      return {
        postsSemaine: lignes.length,
        parNature,
        auteursSemaine: new Set(lignes.map((l) => l.user_id)).size,
        postsTotal: posts.count || 0,
        reactionsTotal: reactions.count || 0,
        reponsesTotal: reponses.count || 0,
        reelsTotal: reels.count || 0,
      };
    },
    staleTime: 60 * 1000,
  });
}
