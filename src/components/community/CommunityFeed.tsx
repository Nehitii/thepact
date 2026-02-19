import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Users, RefreshCw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommunityPostCard } from "./CommunityPostCard";
import { CreatePostModal } from "./CreatePostModal";
import { PostFilters } from "./PostFilters";
import { useCommunityPosts, useCommunityStats, PostFilterType, PostSortOption } from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export function CommunityFeed() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<PostFilterType>('all');
  const [sort, setSort] = useState<PostSortOption>('recent');
  const { user } = useAuth();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useCommunityPosts(filter, sort);

  const { data: stats } = useCommunityStats();

  const allPosts = data?.pages.flatMap((page) => page.posts) || [];

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-orbitron text-lg font-semibold">Community Feed</h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {stats && (
                <>
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {stats.activeMembers} active
                  </span>
                  <span>•</span>
                  <span>{stats.postsThisWeek} posts this week</span>
                </>
              )}
              {!stats && <span>Share reflections, progress, and support</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="border-border/50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          {user && (
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <PostFilters
        activeFilter={filter}
        onFilterChange={setFilter}
        activeSort={sort}
        onSortChange={setSort}
      />

      {/* Posts list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-5 rounded-xl bg-card/50 border border-border/50 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
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
                transition: { staggerChildren: 0.08 }
              }
            }}
          >
            {allPosts.map((post) => (
              <CommunityPostCard key={post.id} post={post} />
            ))}
          </motion.div>

          {/* Load more */}
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
          className="text-center py-16 px-6 rounded-xl bg-card/30 border border-dashed border-border/50"
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
