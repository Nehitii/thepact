/* LES VIDEOS DE VICTOIRE : leur lecture, leur publication, leurs vues. */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { useAuth } from "@/socle/contextes/AuthContext";
import { chargerProfilsPublics } from "@/domaines/profil";
import type { VictoryReel } from "@/domaines/social/types";

// Fetch victory reels
export function useVictoryReels() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["victory-reels"],
    queryFn: async () => {
      const { data: reels, error } = await (supabase
        .from("victory_reels")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50));

      if (error) throw error;
      if (!reels || reels.length === 0) return [];

      const userIds = [...new Set(reels.map((r) => r.user_id))] as string[];
      const goalIds = [...new Set(reels.map((r) => r.goal_id))] as string[];
      const reelIds = reels.map((r) => r.id) as string[];

      /* RLS ne laisse voir que ses propres objectifs. La requete
         ci-dessous en demande d autres : ils reviendront simplement
         absents, sans erreur. Le commentaire d origine constatait la
         limite ; il n en tirait rien, et une video d autrui
         s affichait donc sans l objectif qu elle celebre — alors que
         c est tout son propos.
         La colonne goal_name vient d etre ajoutee a victory_reels
         pour cela — elle n existait pas ; community_posts porte deja
         la sienne depuis le debut. Elle est copiee a la creation et
         prend le relais quand la jointure ne rend rien. */
      const [profilesMap, goalsRes, userReactionsRes] = await Promise.all([
        /* Meme raison que pour le fil : la table ne rend que sa propre
           ligne, la projection publique rend les autres — sans leur nom
           quand ils ne sont pas visibles. */
        chargerProfilsPublics(userIds),
        supabase.from("goals").select("id, name, type, start_date, completion_date").in("id", goalIds),
        user
          ? (supabase.from("community_reactions").select("reel_id, reaction_type").eq("user_id", user.id).in("reel_id", reelIds))
          : Promise.resolve({ data: [], error: null })
      ]);

      const goalsMap = new Map<string, NonNullable<typeof goalsRes.data>[number]>();
      (goalsRes.data || []).forEach((g) => goalsMap.set(g.id, g));

      const userReactionsMap = new Map<string, string[]>();
      (userReactionsRes.data || []).forEach((r) => {
        if (!r.reel_id) return;
        if (!userReactionsMap.has(r.reel_id)) {
          userReactionsMap.set(r.reel_id, []);
        }
        userReactionsMap.get(r.reel_id)!.push(r.reaction_type);
      });

      /* UNE SEULE SIGNATURE POUR TOUTES LES VIDEOS.
         Chaque reel demandait son URL signee separement : jusqu a
         cinquante allers-retours pour afficher un fil, la requete
         plafonnant a limit(50). createSignedUrls — au pluriel — en
         signe autant qu on veut d un coup. Le depot d images de la
         wishlist procede deja ainsi, dans useDepotImages. */
      const cheminDeLaVideo = (url: string): string | null => {
        if (!url.startsWith("http")) return url || null;
        const trouve = url.match(/victory-reels\/(.+?)(\?|$)/);
        return trouve ? decodeURIComponent(trouve[1]) : null;
      };

      const chemins = reels.map((r) => cheminDeLaVideo(r.video_url));
      const aSigner = [...new Set(chemins.filter((c): c is string => !!c))];
      const parChemin = new Map<string, string>();

      if (aSigner.length > 0) {
        const { data: signees } = await supabase.storage
          .from("victory-reels")
          .createSignedUrls(aSigner, 3600);
        (signees || []).forEach((s) => {
          if (s.path && s.signedUrl) parChemin.set(s.path, s.signedUrl);
        });
      }

      const signedUrls = reels.map((reel, i) => {
        const chemin = chemins[i];
        return (chemin && parChemin.get(chemin)) || reel.video_url;
      });

      return reels.map((reel, i) => ({
        ...reel,
        video_url: signedUrls[i],
        profile: profilesMap.get(reel.user_id),
        /* La jointure d abord — elle porte le type et les dates —
           puis le nom fige, seul disponible pour un reel d autrui. */
        goal: goalsMap.get(reel.goal_id)
          ?? (reel.goal_name ? { name: reel.goal_name } : undefined),
        reactions_count: {
          support: reel.support_count || 0,
          respect: reel.respect_count || 0,
          inspired: reel.inspired_count || 0,
        },
        user_reactions: userReactionsMap.get(reel.id) || []
      })) as VictoryReel[];
    },
    staleTime: 30 * 1000,
  });
}

// Create a victory reel
export function useCreateVictoryReel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      goal_id: string;
      goal_name?: string | null;
      video_url: string;
      thumbnail_url?: string;
      caption?: string;
      duration_seconds: number;
    }) => {
      if (!user) throw new Error("Must be logged in");

      /* Le nom de l objectif est fige ici, au moment de la
         publication. Sans lui, la video d un autre utilisateur
         s affiche sans l objectif qu elle celebre : RLS ne rendra
         jamais cet objectif a qui ne le possede pas. */
      const { data: reel, error } = await (supabase
        .from("victory_reels")
        .insert({
          user_id: user.id,
          goal_id: data.goal_id,
          goal_name: data.goal_name ?? null,
          video_url: data.video_url,
          thumbnail_url: data.thumbnail_url || null,
          caption: data.caption || null,
          duration_seconds: data.duration_seconds,
          is_public: true
        })
        .select()
        .single());

      if (error) throw error;
      return reel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["victory-reels"] });
    }
  });
}

// Atomic view count increment via RPC
export function useIncrementReelView() {
  return useMutation({
    mutationFn: async (reelId: string) => {
      const { error } = await supabase.rpc("increment_reel_view", { p_reel_id: reelId });
      if (error) console.warn("Failed to increment view count:", error);
    }
  });
}
