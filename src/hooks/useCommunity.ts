import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  goal_id: string | null;
  goal_name: string | null;
  post_type: 'reflection' | 'progress' | 'obstacle' | 'mindset' | 'help_request' | 'encouragement';
  is_public: boolean;
  created_at: string;
  updated_at: string;
  support_count: number;
  respect_count: number;
  inspired_count: number;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    community_profile_discoverable?: boolean | null;
    share_goals_progress?: boolean | null;
  };
  reactions_count?: {
    support: number;
    respect: number;
    inspired: number;
  };
  replies_count?: number;
  user_reactions?: string[];
}

export interface CommunityReply {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    community_profile_discoverable?: boolean | null;
  };
}

export interface VictoryReel {
  id: string;
  user_id: string;
  goal_id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  duration_seconds: number;
  is_public: boolean;
  view_count: number;
  support_count: number;
  respect_count: number;
  inspired_count: number;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    community_profile_discoverable?: boolean | null;
    share_goals_progress?: boolean | null;
  };
  goal?: {
    name: string;
    type: string;
    start_date: string | null;
    completion_date: string | null;
  };
  reactions_count?: {
    support: number;
    respect: number;
    inspired: number;
  };
  user_reactions?: string[];
}

export interface CompletedGoal {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  start_date: string | null;
  completion_date: string | null;
}

export interface UserGoal {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  status: string;
  start_date: string | null;
  completion_date: string | null;
}

export type PostSortOption = 'recent' | 'popular';
export type PostFilterType = CommunityPost['post_type'] | 'all';

const PAGE_SIZE = 20;

// Fetch community posts with cursor-based pagination
export function useCommunityPosts(
  filter: PostFilterType = 'all',
  sort: PostSortOption = 'recent'
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["community-posts", filter, sort],
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      let q = (supabase
        .from("community_posts" as any)
        .select("*")
        .eq("is_public", true) as any);

      if (filter !== 'all') {
        q = q.eq("post_type", filter);
      }

      if (sort === 'popular') {
        q = q.order("support_count", { ascending: false });
      } else {
        q = q.order("created_at", { ascending: false });
      }

      if (pageParam) {
        if (sort === 'recent') {
          q = q.lt("created_at", pageParam);
        }
      }

      q = q.limit(PAGE_SIZE);

      const { data: posts, error: postsError } = await q;
      if (postsError) throw postsError;
      if (!posts || posts.length === 0) return { posts: [], nextCursor: null };

      const userIds = [...new Set(posts.map((p: any) => p.user_id))] as string[];
      const postIds = posts.map((p: any) => p.id) as string[];

      const [profilesRes, repliesRes, userReactionsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, avatar_url, community_profile_discoverable, share_goals_progress")
          .in("id", userIds) as any,
        supabase.from("community_replies" as any).select("post_id").in("post_id", postIds) as any,
        user
          ? (supabase.from("community_reactions" as any).select("post_id, reaction_type").eq("user_id", user.id).in("post_id", postIds) as any)
          : Promise.resolve({ data: [], error: null })
      ]);

      const profilesMap = new Map<string, any>();
      (profilesRes.data || []).forEach((p: any) => profilesMap.set(p.id, p));

      const repliesMap = new Map<string, number>();
      (repliesRes.data || []).forEach((r: any) => {
        repliesMap.set(r.post_id, (repliesMap.get(r.post_id) || 0) + 1);
      });

      const userReactionsMap = new Map<string, string[]>();
      (userReactionsRes.data || []).forEach((r: any) => {
        if (!r.post_id) return;
        if (!userReactionsMap.has(r.post_id)) {
          userReactionsMap.set(r.post_id, []);
        }
        userReactionsMap.get(r.post_id)!.push(r.reaction_type);
      });

      const enrichedPosts = posts.map((post: any) => ({
        ...post,
        post_type: post.post_type as CommunityPost['post_type'],
        profile: profilesMap.get(post.user_id),
        reactions_count: {
          support: post.support_count || 0,
          respect: post.respect_count || 0,
          inspired: post.inspired_count || 0,
        },
        replies_count: repliesMap.get(post.id) || 0,
        user_reactions: userReactionsMap.get(post.id) || []
      })) as CommunityPost[];

      const lastPost = posts[posts.length - 1];
      const nextCursor = posts.length === PAGE_SIZE ? lastPost.created_at : null;

      return { posts: enrichedPosts, nextCursor };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 1000,
  });

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('community-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_posts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["community-posts"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_reactions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["community-posts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

// Fetch replies for a specific post
export function usePostReplies(postId: string | undefined) {
  return useQuery({
    queryKey: ["post-replies", postId],
    queryFn: async () => {
      if (!postId) return [];

      const { data: replies, error } = await (supabase
        .from("community_replies" as any)
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true }) as any);

      if (error) throw error;
      if (!replies || replies.length === 0) return [];

      const userIds = [...new Set(replies.map((r: any) => r.user_id))] as string[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, community_profile_discoverable")
        .in("id", userIds);

      const profilesMap = new Map<string, any>();
      (profiles || []).forEach((p: any) => profilesMap.set(p.id, p));

      return replies.map((reply: any) => ({
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
      post_type?: CommunityPost['post_type'];
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data: post, error } = await (supabase
        .from("community_posts" as any)
        .insert({
          user_id: user.id,
          content: data.content,
          goal_id: data.goal_id || null,
          goal_name: data.goal_name || null,
          post_type: data.post_type || 'reflection',
          is_public: true
        })
        .select()
        .single() as any);

      if (error) throw error;
      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
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
        .from("community_posts" as any)
        .update({ content: data.content, updated_at: new Date().toISOString() })
        .eq("id", data.id)
        .eq("user_id", user.id) as any);

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
        .from("community_posts" as any)
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    }
  });
}

// Add a reaction
export function useAddReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      post_id?: string;
      reel_id?: string;
      reaction_type: 'support' | 'respect' | 'inspired'
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await (supabase
        .from("community_reactions" as any)
        .insert({
          user_id: user.id,
          post_id: data.post_id || null,
          reel_id: data.reel_id || null,
          reaction_type: data.reaction_type
        }) as any);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      if (variables.post_id) {
        queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      }
      if (variables.reel_id) {
        queryClient.invalidateQueries({ queryKey: ["victory-reels"] });
      }
    }
  });
}

// Remove a reaction
export function useRemoveReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      post_id?: string;
      reel_id?: string;
      reaction_type: 'support' | 'respect' | 'inspired'
    }) => {
      if (!user) throw new Error("Must be logged in");

      let query = supabase
        .from("community_reactions" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("reaction_type", data.reaction_type) as any;

      if (data.post_id) {
        query = query.eq("post_id", data.post_id);
      }
      if (data.reel_id) {
        query = query.eq("reel_id", data.reel_id);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      if (variables.post_id) {
        queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      }
      if (variables.reel_id) {
        queryClient.invalidateQueries({ queryKey: ["victory-reels"] });
      }
    }
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
        .from("community_replies" as any)
        .insert({
          user_id: user.id,
          post_id: data.post_id,
          content: data.content
        })
        .select()
        .single() as any);

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
        .from("community_replies" as any)
        .delete()
        .eq("id", data.replyId)
        .eq("user_id", user.id) as any);

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
        .from("community_reports" as any)
        .insert({
          reporter_id: user.id,
          post_id: data.post_id || null,
          reel_id: data.reel_id || null,
          reply_id: data.reply_id || null,
          reason: data.reason,
        }) as any);

      if (error) throw error;
    }
  });
}

// Fetch victory reels
export function useVictoryReels() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["victory-reels"],
    queryFn: async () => {
      const { data: reels, error } = await (supabase
        .from("victory_reels" as any)
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50) as any);

      if (error) throw error;
      if (!reels || reels.length === 0) return [];

      const userIds = [...new Set(reels.map((r: any) => r.user_id))] as string[];
      const goalIds = [...new Set(reels.map((r: any) => r.goal_id))] as string[];
      const reelIds = reels.map((r: any) => r.id) as string[];

      // Goals query goes through pacts — but RLS blocks other users' goals
      // So we only fetch goals the current user owns (for their own reels)
      const [profilesRes, goalsRes, userReactionsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, avatar_url, community_profile_discoverable, share_goals_progress")
          .in("id", userIds) as any,
        supabase.from("goals").select("id, name, type, start_date, completion_date").in("id", goalIds) as any,
        user
          ? (supabase.from("community_reactions" as any).select("reel_id, reaction_type").eq("user_id", user.id).in("reel_id", reelIds) as any)
          : Promise.resolve({ data: [], error: null })
      ]);

      const profilesMap = new Map<string, any>();
      (profilesRes.data || []).forEach((p: any) => profilesMap.set(p.id, p));

      const goalsMap = new Map<string, any>();
      (goalsRes.data || []).forEach((g: any) => goalsMap.set(g.id, g));

      const userReactionsMap = new Map<string, string[]>();
      (userReactionsRes.data || []).forEach((r: any) => {
        if (!r.reel_id) return;
        if (!userReactionsMap.has(r.reel_id)) {
          userReactionsMap.set(r.reel_id, []);
        }
        userReactionsMap.get(r.reel_id)!.push(r.reaction_type);
      });

      // Generate signed URLs for private bucket videos
      const signedUrlPromises = reels.map(async (reel: any) => {
        // Extract path from stored URL or use as-is
        const videoPath = reel.video_url.includes('/storage/v1/')
          ? reel.video_url.split('/victory-reels/').pop()
          : reel.video_url;

        if (videoPath && !reel.video_url.startsWith('http')) {
          const { data } = await supabase.storage
            .from('victory-reels')
            .createSignedUrl(videoPath, 3600);
          return data?.signedUrl || reel.video_url;
        }

        // For URLs already stored as full paths, try to create signed URL from the path
        try {
          const pathMatch = reel.video_url.match(/victory-reels\/(.+?)(\?|$)/);
          if (pathMatch) {
            const { data } = await supabase.storage
              .from('victory-reels')
              .createSignedUrl(decodeURIComponent(pathMatch[1]), 3600);
            return data?.signedUrl || reel.video_url;
          }
        } catch {
          // fallback to original URL
        }
        return reel.video_url;
      });

      const signedUrls = await Promise.all(signedUrlPromises);

      return reels.map((reel: any, i: number) => ({
        ...reel,
        video_url: signedUrls[i],
        profile: profilesMap.get(reel.user_id),
        goal: goalsMap.get(reel.goal_id),
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
      video_url: string;
      thumbnail_url?: string;
      caption?: string;
      duration_seconds: number;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data: reel, error } = await (supabase
        .from("victory_reels" as any)
        .insert({
          user_id: user.id,
          goal_id: data.goal_id,
          video_url: data.video_url,
          thumbnail_url: data.thumbnail_url || null,
          caption: data.caption || null,
          duration_seconds: data.duration_seconds,
          is_public: true
        })
        .select()
        .single() as any);

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
      const { error } = await supabase.rpc("increment_reel_view", { p_reel_id: reelId } as any);
      if (error) console.warn("Failed to increment view count:", error);
    }
  });
}

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
        .eq("pact_id", pact.id) as any);

      if (error) throw error;

      return ((goals as any[]) || [])
        .filter((g: any) => g.status === "fully_completed" || g.status === "validated")
        .map((g: any) => ({
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
        .order("created_at", { ascending: false }) as any);

      if (error) throw error;

      return ((goals as any[]) || []).map((g: any) => ({
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

// Community stats
export function useCommunityStats() {
  return useQuery({
    queryKey: ["community-stats"],
    queryFn: async () => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [postsRes, membersRes] = await Promise.all([
        (supabase
          .from("community_posts" as any)
          .select("id", { count: "exact", head: true })
          .gte("created_at", oneWeekAgo) as any),
        (supabase
          .from("community_posts" as any)
          .select("user_id")
          .gte("created_at", oneWeekAgo) as any),
      ]);

      const uniqueMembers = new Set((membersRes.data || []).map((m: any) => m.user_id)).size;

      return {
        postsThisWeek: postsRes.count || 0,
        activeMembers: uniqueMembers,
      };
    },
    staleTime: 60 * 1000,
  });
}
