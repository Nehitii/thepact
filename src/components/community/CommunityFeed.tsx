import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommunityPostCard } from "./CommunityPostCard";
import { CreatePostModal } from "./CreatePostModal";
import { PostFilters } from "./PostFilters";
import { useCommunityPosts, PostFilterType, PostSortOption } from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function CommunityFeed() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<PostFilterType>('all');
  const [sort, setSort] = useState<PostSortOption>('recent');
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["my-community-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useCommunityPosts(filter, sort);

  const allPosts = data?.pages.flatMap((page) => page.posts) || [];

  const displayName = profile?.display_name || "You";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-5">
      {/* Compose bar */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center gap-3 p-3.5 px-[18px] rounded-2xl bg-card border border-border/50 hover:border-primary/30 cursor-pointer transition-all hover:shadow-[0_4px_20px_rgba(123,92,250,0.1)] group"
          >
            <Avatar className="w-9 h-9 ring-2 ring-primary/20 shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-950 to-indigo-900 text-indigo-300 text-xs font-bold font-orbitron">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-left text-sm text-muted-foreground">
              Share a reflection, progress update, or request support…
            </span>
            <span className="shrink-0 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-sm shadow-primary/25 font-mono tracking-wider">
              + POST
            </span>
          </button>
        </motion.div>
      )}

      {/* Filters */}
      <PostFilters
        activeFilter={filter}
        onFilterChange={setFilter}
        activeSort={sort}
        onSortChange={setSort}
      />

      {/* Refresh */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="gap-1.5 text-xs text-muted-foreground"
        >
          <RefreshCw className={`w-3 h-3 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Posts list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-5 rounded-[20px] bg-card border border-border/50 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-[42px] h-[42px] rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : allPosts.length > 0 ? (
        <div className="space-y-4">
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.06 }
              }
            }}
          >
            {allPosts.map((post) => (
              <CommunityPostCard key={post.id} post={post} />
            ))}
          </motion.div>

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full max-w-xs"
              >
                {isFetchingNextPage ? "Loading more..." : "Load more posts"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-6 rounded-[20px] bg-card/30 border border-dashed border-border/50"
        >
          <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Be the first to share your journey. Post reflections, celebrate progress, or ask for support.
          </p>
          {user && (
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create First Post
            </Button>
          )}
        </motion.div>
      )}

      <CreatePostModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
