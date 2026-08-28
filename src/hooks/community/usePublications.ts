/* LES PUBLICATIONS : le fil, les reponses, les reactions, les
   signalements, et l abonnement au direct. */
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { chargerProfilsPublics } from "@/domaines/profil";
import { trackCommunityPost } from "@/domaines/succes";
import type { CommunityPost, CommunityReply, VictoryReel, PostFilterType, PostSortOption } from "./types";

const PAGE_SIZE = 20;

/** Le curseur : une date pour le tri chronologique, un decalage pour
 *  le tri par popularite. Voir plus bas pourquoi les deux different. */
type Curseur = string | number | null;

// Fetch community posts with cursor-based pagination
export function useCommunityPosts(
  filter: PostFilterType = 'all',
  sort: PostSortOption = 'recent'
) {
  const { user } = useAuth();

  const query = useInfiniteQuery({
    queryKey: ["community-posts", filter, sort],
    queryFn: async ({ pageParam }: { pageParam: Curseur }) => {
      let q = (supabase
        .from("community_posts")
        /* Les colonnes que le fil lit vraiment ; « select("*") »
           ramenait aussi is_public et goal_id pour rien. La liste doit
           rester une chaine litterale : Supabase en deduit le type de
           la ligne a la compilation, et une variable lui rend la
           ligne illisible. */
        .select("id, user_id, content, post_type, goal_name, image_url, created_at, updated_at, support_count, respect_count, inspired_count, replies_count")
        .eq("is_public", true));

      if (filter !== 'all') {
        q = q.eq("post_type", filter);
      }

      /* LE TRI POPULAIRE NE PAGINAIT PAS.
         Le curseur etait bien calcule, mais applique au SEUL tri
         chronologique : « if (sort === 'recent') ». En tri populaire,
         la page deux renvoyait donc exactement les vingt memes
         publications que la page une — vingt doublons ajoutes au fil,
         avec autant de cles React identiques. Le defaut restait
         invisible tant que la table tenait sous vingt lignes.

         Un curseur par valeur ne convient pas ici : support_count
         n est pas unique, deux publications a egalite se
         chevaucheraient. On ordonne donc sur le couple
         (popularite, date) — ce que l index couvre exactement — et on
         pagine par decalage, ce qu un classement stable autorise. */
      let decalage = 0;
      if (sort === 'popular') {
        decalage = typeof pageParam === "number" ? pageParam : 0;
        q = q
          .order("support_count", { ascending: false })
          .order("created_at", { ascending: false })
          .range(decalage, decalage + PAGE_SIZE - 1);
      } else {
        q = q.order("created_at", { ascending: false });
        if (typeof pageParam === "string") q = q.lt("created_at", pageParam);
        q = q.limit(PAGE_SIZE);
      }

      const { data: posts, error: postsError } = await q;
      if (postsError) throw postsError;
      if (!posts || posts.length === 0) return { posts: [], nextCursor: null };

      const userIds = [...new Set(posts.map((p) => p.user_id))] as string[];
      const postIds = posts.map((p) => p.id) as string[];

      /* Le compte des reponses arrivait en rapatriant TOUTES leurs
         lignes pour les additionner ici : vingt publications a
         cinquante reponses faisaient mille lignes transferees pour
         obtenir vingt nombres. La colonne replies_count, maintenue
         par trg_replies_count comme les compteurs de reactions le
         sont depuis toujours, rend la requete inutile. Deux appels
         reseau au lieu de trois. */
      const [profilesMap, userReactionsRes] = await Promise.all([
        /* LA PROJECTION PUBLIQUE, PAS LA TABLE.
           `profiles` n a qu une politique SELECT — `auth.uid() = id` —
           donc cette requete ne rendait que sa propre ligne : tous les
           autres auteurs perdaient nom et avatar, et « profil
           decouvrable » ne changeait rien puisque l absence de donnee
           produisait deja le meme resultat. */
        chargerProfilsPublics(userIds),
        user
          ? (supabase.from("community_reactions").select("post_id, reaction_type").eq("user_id", user.id).in("post_id", postIds))
          : Promise.resolve({ data: [], error: null })
      ]);

      const userReactionsMap = new Map<string, string[]>();
      (userReactionsRes.data || []).forEach((r) => {
        if (!r.post_id) return;
        if (!userReactionsMap.has(r.post_id)) {
          userReactionsMap.set(r.post_id, []);
        }
        userReactionsMap.get(r.post_id)!.push(r.reaction_type);
      });

      const enrichedPosts = posts.map((post) => ({
        ...post,
        post_type: post.post_type as CommunityPost['post_type'],
        profile: profilesMap.get(post.user_id),
        reactions_count: {
          support: post.support_count || 0,
          respect: post.respect_count || 0,
          inspired: post.inspired_count || 0,
        },
        replies_count: post.replies_count || 0,
        user_reactions: userReactionsMap.get(post.id) || []
      })) as CommunityPost[];

      /* Une page incomplete est la derniere : c est le seul signal sur
         lequel les deux tris s accordent. */
      const nextCursor: Curseur = posts.length < PAGE_SIZE
        ? null
        : sort === "popular"
          ? decalage + PAGE_SIZE
          : posts[posts.length - 1].created_at;

      return { posts: enrichedPosts, nextCursor };
    },
    initialPageParam: null as Curseur,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 1000,
  });

  return query;
}

/* LE FIL EN DIRECT.
 *
 * L abonnement vivait dans useCommunityPosts : un hook de requete qui
 * ouvrait un canal, sous un nom fixe — deux montages simultanes
 * seraient entres en collision dessus. Il a desormais son hook, et la
 * page decide ou l installer.
 *
 * CE QUI A ETE RETIRE. Il ecoutait aussi « * » sur
 * community_reactions et invalidait le fil ENTIER a chaque reaction,
 * de n importe qui, sur n importe quelle publication. Combine a
 * l invalidation de la mutation, une seule reaction declenchait deux
 * rechargements complets — mesure : neuf requetes pour un clic.
 *
 * Les siennes sont maintenant posees de facon optimiste, et le
 * compteur de reaction d un inconnu ne justifie pas de recharger
 * vingt publications, leurs profils et leurs reactions. Il arrivera
 * au prochain rafraichissement naturel.
 *
 * Reste l arrivee d une publication, qui est rare et qu on veut voir.
 */
export function useFilEnDirect() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const canal = supabase
      .channel("community-fil")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts" },
        () => queryClient.invalidateQueries({ queryKey: ["community-posts"] }),
      )
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [queryClient]);
}

// Fetch replies for a specific post
export function usePostReplies(postId: string | undefined) {
  return useQuery({
    queryKey: ["post-replies", postId],
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

      return replies.map((reply) => ({
        ...reply,
        profile: profilesMap.get(reply.user_id)
      })) as CommunityReply[];
    },
    enabled: !!postId,
  });
}

// Create a new post (with denormalized goal_name)
export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      goal_id?: string;
      goal_name?: string;
      image_url?: string | null;
      post_type?: CommunityPost['post_type'];
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data: post, error } = await (supabase
        .from("community_posts")
        .insert({
          user_id: user.id,
          content: data.content,
          goal_id: data.goal_id || null,
          goal_name: data.goal_name || null,
          image_url: data.image_url || null,
          post_type: data.post_type || 'reflection',
          is_public: true
        })
        .select()
        .single());

      if (error) throw error;
      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      /* Les chiffres du rail et le compteur de l onglet sortent de
         community-stats, qui n etait jamais invalide : on publiait, et
         « Cette semaine » ne bougeait pas avant l expiration de sa
         minute de fraicheur. */
      queryClient.invalidateQueries({ queryKey: ["community-stats"] });
      if (user?.id) {
        trackCommunityPost(user.id);
      }
    }
  });
}

// Update a post
export function useUpdatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { id: string; content: string }) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await (supabase
        .from("community_posts")
        .update({ content: data.content, updated_at: new Date().toISOString() })
        .eq("id", data.id)
        .eq("user_id", user.id));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    }
  });
}

// Delete a post
export function useDeletePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await (supabase
        .from("community_posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   LES REACTIONS, POSEES SANS ATTENDRE
   ═══════════════════════════════════════════════════════════════

   Mesure avant : UN clic sur une reaction declenchait neuf requetes.
   L ecriture, puis quatre requetes de rechargement du fil declenchees
   par l invalidation de la mutation, puis les quatre memes une
   seconde fois, declenchees par l evenement temps reel que notre
   propre ecriture venait de produire. Neuf allers-retours pour faire
   passer un compteur de 0 a 1, et le chiffre ne bougeait a l ecran
   qu au retour du dernier.

   Desormais le cache est corrige AVANT l ecriture, et rien n est
   invalide apres : le declencheur en base applique exactement le meme
   +1 ou -1 que nous. En cas d echec, l etat d avant est remis tel
   quel. Une requete au lieu de neuf.

   Le compte est repris dans les deux formes que porte une
   publication : reactions_count, que lit la carte, et support_count /
   respect_count / inspired_count, qui viennent de la table et servent
   au tri populaire. Les laisser diverger ferait remonter une
   publication dans le classement sans que son chiffre bouge. */

type CibleReaction = { post_id?: string; reel_id?: string; reaction_type: TypeDeReaction };
type TypeDeReaction = 'support' | 'respect' | 'inspired';

/** Applique un delta a une publication dans toutes les pages en cache. */
function retoucherLeFil(
  queryClient: ReturnType<typeof useQueryClient>,
  postId: string,
  type: TypeDeReaction,
  delta: 1 | -1,
) {
  queryClient.setQueriesData<{ pages: { posts: CommunityPost[]; nextCursor: unknown }[]; pageParams: unknown[] }>(
    { queryKey: ["community-posts"] },
    (ancien) => {
      if (!ancien) return ancien;
      return {
        ...ancien,
        pages: ancien.pages.map((page) => ({
          ...page,
          posts: page.posts.map((p) => {
            if (p.id !== postId) return p;
            const compte = { ...(p.reactions_count ?? { support: 0, respect: 0, inspired: 0 }) };
            compte[type] = Math.max(0, (compte[type] ?? 0) + delta);
            return {
              ...p,
              [`${type}_count`]: compte[type],
              reactions_count: compte,
              user_reactions: delta === 1
                ? [...(p.user_reactions ?? []), type]
                : (p.user_reactions ?? []).filter((r) => r !== type),
            } as CommunityPost;
          }),
        })),
      };
    },
  );
}

/** Le meme geste, sur une video. */
function retoucherLesVideos(
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

/** Pose le delta et rend de quoi revenir en arriere si l ecriture echoue. */
async function poserEnAvance(
  queryClient: ReturnType<typeof useQueryClient>,
  cible: CibleReaction,
  delta: 1 | -1,
) {
  const cle = cible.post_id ? ["community-posts"] : ["victory-reels"];
  await queryClient.cancelQueries({ queryKey: cle });
  const avant = queryClient.getQueriesData({ queryKey: cle });

  if (cible.post_id) retoucherLeFil(queryClient, cible.post_id, cible.reaction_type, delta);
  if (cible.reel_id) retoucherLesVideos(queryClient, cible.reel_id, cible.reaction_type, delta);

  return { avant };
}

function remettreCommeAvant(
  queryClient: ReturnType<typeof useQueryClient>,
  contexte: { avant: [readonly unknown[], unknown][] } | undefined,
) {
  contexte?.avant.forEach(([cle, valeur]) => queryClient.setQueryData(cle, valeur));
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

// Report content
export function useReportContent() {
  return useMutation({
    mutationFn: async (data: {
      post_id?: string;
      reel_id?: string;
      reply_id?: string;
      reason: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Must be logged in");

      const { error } = await (supabase
        .from("community_reports")
        .insert({
          reporter_id: user.id,
          post_id: data.post_id || null,
          reel_id: data.reel_id || null,
          reply_id: data.reply_id || null,
          reason: data.reason,
        }));

      if (error) throw error;
    }
  });
}
