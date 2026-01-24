import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  goal_id: string | null;
  post_type: 'reflection' | 'progress' | 'obstacle' | 'mindset' | 'help_request' | 'encouragement';
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    community_profile_discoverable?: boolean | null;
    share_goals_progress?: boolean | null;
  };
  goal?: {
    name: string;
    type: string;
    difficulty: string;
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

// Helper to safely query tables - avoids TS deep type issues
async function queryTable(table: string, query: any) {
  return await (supabase.from(table as any) as any)[query.method](...(query.args || []));
}

// Fetch community posts with profile, goal, and reaction data
export function useCommunityPosts() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["community-posts"],
    queryFn: async () => {
      const { data: posts, error: postsError } = await (supabase
        .from("community_posts" as any)
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50) as any);
      
      if (postsError) throw postsError;
      if (!posts || posts.length === 0) return [];

      const userIds = [...new Set(posts.map((p: any) => p.user_id))] as string[];
      const goalIds = [...new Set(posts.filter((p: any) => p.goal_id).map((p: any) => p.goal_id))] as string[];
      const postIds = posts.map((p: any) => p.id) as string[];

      const [profilesRes, goalsRes, reactionsRes, repliesRes, userReactionsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, avatar_url, community_profile_discoverable, share_goals_progress")
          .in("id", userIds) as any,
        goalIds.length > 0 
          ? (supabase.from("goals").select("id, name, type, difficulty").in("id", goalIds) as any)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("community_reactions" as any).select("post_id, reaction_type").in("post_id", postIds) as any,
        supabase.from("community_replies" as any).select("post_id").in("post_id", postIds) as any,
        user 
          ? (supabase.from("community_reactions" as any).select("post_id, reaction_type").eq("user_id", user.id).in("post_id", postIds) as any)
          : Promise.resolve({ data: [], error: null })
      ]);

      const profilesMap = new Map<string, any>();
      (profilesRes.data || []).forEach((p: any) => profilesMap.set(p.id, p));
      
      const goalsMap = new Map<string, any>();
      (goalsRes.data || []).forEach((g: any) => goalsMap.set(g.id, g));
      
      const reactionsMap = new Map<string, { support: number; respect: number; inspired: number }>();
      (reactionsRes.data || []).forEach((r: any) => {
        if (!r.post_id) return;
        if (!reactionsMap.has(r.post_id)) {
          reactionsMap.set(r.post_id, { support: 0, respect: 0, inspired: 0 });
        }
        const counts = reactionsMap.get(r.post_id)!;
        if (r.reaction_type === 'support') counts.support++;
        else if (r.reaction_type === 'respect') counts.respect++;
        else if (r.reaction_type === 'inspired') counts.inspired++;
      });

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

      return posts.map((post: any) => ({
        ...post,
        post_type: post.post_type as CommunityPost['post_type'],
        profile: profilesMap.get(post.user_id),
        goal: post.goal_id ? goalsMap.get(post.goal_id) : undefined,
        reactions_count: reactionsMap.get(post.id) || { support: 0, respect: 0, inspired: 0 },
        replies_count: repliesMap.get(post.id) || 0,
        user_reactions: userReactionsMap.get(post.id) || []
      })) as CommunityPost[];
    },
    staleTime: 30 * 1000,
  });
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

// Create a new post
export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      goal_id?: string;
      post_type?: CommunityPost['post_type'];
    }) => {
      if (!user) throw new Error("Must be logged in");
      
      const { data: post, error } = await (supabase
        .from("community_posts" as any)
        .insert({
          user_id: user.id,
          content: data.content,
          goal_id: data.goal_id || null,
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

      const [profilesRes, goalsRes, reactionsRes, userReactionsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, avatar_url, community_profile_discoverable, share_goals_progress")
          .in("id", userIds) as any,
        supabase.from("goals").select("id, name, type, start_date, completion_date").in("id", goalIds) as any,
        supabase.from("community_reactions" as any).select("reel_id, reaction_type").in("reel_id", reelIds) as any,
        user 
          ? (supabase.from("community_reactions" as any).select("reel_id, reaction_type").eq("user_id", user.id).in("reel_id", reelIds) as any)
          : Promise.resolve({ data: [], error: null })
      ]);

      const profilesMap = new Map<string, any>();
      (profilesRes.data || []).forEach((p: any) => profilesMap.set(p.id, p));
      
      const goalsMap = new Map<string, any>();
      (goalsRes.data || []).forEach((g: any) => goalsMap.set(g.id, g));
      
      const reactionsMap = new Map<string, { support: number; respect: number; inspired: number }>();
      (reactionsRes.data || []).forEach((r: any) => {
        if (!r.reel_id) return;
        if (!reactionsMap.has(r.reel_id)) {
          reactionsMap.set(r.reel_id, { support: 0, respect: 0, inspired: 0 });
        }
        const counts = reactionsMap.get(r.reel_id)!;
        if (r.reaction_type === 'support') counts.support++;
        else if (r.reaction_type === 'respect') counts.respect++;
        else if (r.reaction_type === 'inspired') counts.inspired++;
      });

      const userReactionsMap = new Map<string, string[]>();
      (userReactionsRes.data || []).forEach((r: any) => {
        if (!r.reel_id) return;
        if (!userReactionsMap.has(r.reel_id)) {
          userReactionsMap.set(r.reel_id, []);
        }
        userReactionsMap.get(r.reel_id)!.push(r.reaction_type);
      });

      return reels.map((reel: any) => ({
        ...reel,
        profile: profilesMap.get(reel.user_id),
        goal: goalsMap.get(reel.goal_id),
        reactions_count: reactionsMap.get(reel.id) || { support: 0, respect: 0, inspired: 0 },
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

// Increment view count
export function useIncrementReelView() {
  return useMutation({
    mutationFn: async (reelId: string) => {
      const { data: reel } = await (supabase
        .from("victory_reels" as any)
        .select("view_count")
        .eq("id", reelId)
        .single() as any);
      
      if (!reel) return;
      
      const { error } = await (supabase
        .from("victory_reels" as any)
        .update({ view_count: (reel.view_count || 0) + 1 })
        .eq("id", reelId) as any);
      
      if (error) console.warn("Failed to increment view count:", error);
    }
  });
}

// Get user's completed goals (for sharing)
export function useCompletedGoals() {
  const { user } = useAuth();
  
  return useQuery<CompletedGoal[]>({
    queryKey: ["completed-goals", user?.id],
    queryFn: async (): Promise<CompletedGoal[]> => {
      if (!user) return [];
      
      // Cast entire query to avoid TS deep type instantiation
      const result = await (supabase as any)
        .from("goals")
        .select("*")
        .eq("user_id", user.id);
      
      if (result.error) throw result.error;
      
      const completed = ((result.data as any[]) || []).filter(
        (g: any) => g.status === "fully_completed" || g.status === "validated"
      );
      
      return completed.map((g: any) => ({
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
