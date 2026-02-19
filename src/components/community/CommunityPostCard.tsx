import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronDown, ChevronUp, Flag, Pencil, Trash2, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReactionButton } from "./ReactionButton";
import { PostTypeTag } from "./PostTypeTag";
import { ReportModal } from "./ReportModal";
import {
  CommunityPost,
  useAddReaction,
  useRemoveReaction,
  usePostReplies,
  useAddReply,
  useDeleteReply,
  useUpdatePost,
  useDeletePost,
} from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CommunityPostCardProps {
  post: CommunityPost;
}

/* ── Per-type colour config ── */
const postTypeConfig: Record<
  CommunityPost["post_type"],
  { stripeTop: string; stripeBottom: string; glowRgba: string; badgeBg: string; badgeText: string; badgeBorder: string }
> = {
  reflection: {
    stripeTop: "#3b82f6",
    stripeBottom: "#1d4ed8",
    glowRgba: "59,130,246",
    badgeBg: "rgba(59,130,246,0.12)",
    badgeText: "#93c5fd",
    badgeBorder: "rgba(59,130,246,0.25)",
  },
  progress: {
    stripeTop: "#f59e0b",
    stripeBottom: "#d97706",
    glowRgba: "245,158,11",
    badgeBg: "rgba(245,158,11,0.12)",
    badgeText: "#fcd34d",
    badgeBorder: "rgba(245,158,11,0.25)",
  },
  obstacle: {
    stripeTop: "#f43f5e",
    stripeBottom: "#be123c",
    glowRgba: "244,63,94",
    badgeBg: "rgba(244,63,94,0.12)",
    badgeText: "#fda4af",
    badgeBorder: "rgba(244,63,94,0.25)",
  },
  mindset: {
    stripeTop: "#a855f7",
    stripeBottom: "#7c3aed",
    glowRgba: "168,85,247",
    badgeBg: "rgba(168,85,247,0.12)",
    badgeText: "#d8b4fe",
    badgeBorder: "rgba(168,85,247,0.25)",
  },
  help_request: {
    stripeTop: "#fb923c",
    stripeBottom: "#ea580c",
    glowRgba: "251,146,60",
    badgeBg: "rgba(251,146,60,0.12)",
    badgeText: "#fdba74",
    badgeBorder: "rgba(251,146,60,0.25)",
  },
  encouragement: {
    stripeTop: "#10b981",
    stripeBottom: "#059669",
    glowRgba: "16,185,129",
    badgeBg: "rgba(16,185,129,0.12)",
    badgeText: "#6ee7b7",
    badgeBorder: "rgba(16,185,129,0.25)",
  },
};

const postTypeLabel: Record<CommunityPost["post_type"], string> = {
  reflection: "💡 Reflection",
  progress: "📈 Progress",
  obstacle: "⚠️ Obstacle",
  mindset: "🧠 Mindset",
  help_request: "🙋 Help Needed",
  encouragement: "💚 Support",
};

export function CommunityPostCard({ post }: CommunityPostCardProps) {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [replyFocused, setReplyFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { data: replies, isLoading: repliesLoading } = usePostReplies(showReplies ? post.id : undefined);
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();
  const addReply = useAddReply();
  const deleteReply = useDeleteReply();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  const isOwner = user?.id === post.user_id;
  const cfg = postTypeConfig[post.post_type];

  const isDiscoverable = post.profile?.community_profile_discoverable ?? true;
  const canShowGoals = post.profile?.share_goals_progress ?? true;
  const displayName = isDiscoverable ? post.profile?.display_name || "Anonymous" : "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = isDiscoverable ? post.profile?.avatar_url || undefined : undefined;

  const handleReaction = (type: "support" | "respect" | "inspired") => {
    if (!user) return;
    const isActive = post.user_reactions?.includes(type);
    if (isActive) removeReaction.mutate({ post_id: post.id, reaction_type: type });
    else addReaction.mutate({ post_id: post.id, reaction_type: type });
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim() || !user) return;
    addReply.mutate(
      { post_id: post.id, content: replyContent },
      {
        onSuccess: () => {
          setReplyContent("");
          setReplyFocused(false);
        },
      },
    );
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    updatePost.mutate(
      { id: post.id, content: editContent.trim() },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success("Post updated");
        },
        onError: () => toast.error("Failed to update post"),
      },
    );
  };

  const handleDelete = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => toast.success("Post deleted"),
      onError: () => toast.error("Failed to delete post"),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative bg-card border border-border/50 rounded-[20px] p-5 overflow-hidden transition-all duration-250"
        style={{
          borderColor: isHovered ? "rgba(120,100,255,0.35)" : undefined,
          transform: isHovered ? "translateY(-2px)" : undefined,
          boxShadow: isHovered
            ? `0 8px 40px rgba(0,0,0,0.4), -4px 0 24px rgba(${cfg.glowRgba},0.12), 0 0 0 1px rgba(120,100,255,0.15)`
            : undefined,
        }}
      >
        {/* ── Coloured left stripe ── */}
        <div
          className="absolute top-0 left-0 w-[3px] h-full rounded-l-[20px]"
          style={{ background: `linear-gradient(180deg, ${cfg.stripeTop}, ${cfg.stripeBottom})` }}
        />

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-3.5 pl-1">
          <Avatar className="w-[42px] h-[42px] shrink-0 ring-2 ring-primary/20">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-950 to-indigo-900 text-indigo-300 text-sm font-bold font-orbitron">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Name + time */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{displayName}</span>
              <span className="font-mono text-[11px] text-muted-foreground/60">
                · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
              {post.updated_at !== post.created_at && (
                <span className="font-mono text-[10px] text-muted-foreground/40 italic">(edited)</span>
              )}
            </div>

            {/* Type badge */}
            <div
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold tracking-[0.06em] uppercase mt-1 border"
              style={{
                background: cfg.badgeBg,
                color: cfg.badgeText,
                borderColor: cfg.badgeBorder,
              }}
            >
              {postTypeLabel[post.post_type]}
            </div>
          </div>

          {/* Owner actions */}
          {isOwner && !isEditing && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {!isOwner && (
            <button
              onClick={() => setShowReportModal(true)}
              className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors shrink-0"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── Body / edit ── */}
        {isEditing ? (
          <div className="space-y-2 mb-4 pl-1">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px] resize-none bg-muted/30"
              maxLength={500}
            />
            <div className="flex items-center gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="gap-1">
                <X className="w-3 h-3" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={updatePost.isPending} className="gap-1">
                <Check className="w-3 h-3" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/80 leading-relaxed mb-4 whitespace-pre-wrap pl-1">{post.content}</p>
        )}

        {/* ── Goal link ── */}
        {post.goal_name && canShowGoals && (
          <div className="mb-4 flex items-center gap-2 p-2.5 px-3.5 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
            <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-content-center shrink-0 text-sm leading-none flex items-center justify-center">
              🎯
            </div>
            <span className="text-xs font-medium text-foreground/80 group-hover:text-primary transition-colors flex-1 truncate">
              {post.goal_name}
            </span>
            <span className="ml-auto text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
              Active
            </span>
          </div>
        )}

        {/* ── Footer: reactions + reply count ── */}
        <div className="flex items-center gap-2 flex-wrap pl-1">
          <ReactionButton
            type="support"
            count={post.reactions_count?.support || 0}
            isActive={post.user_reactions?.includes("support") || false}
            onToggle={() => handleReaction("support")}
          />
          <ReactionButton
            type="respect"
            count={post.reactions_count?.respect || 0}
            isActive={post.user_reactions?.includes("respect") || false}
            onToggle={() => handleReaction("respect")}
          />
          <ReactionButton
            type="inspired"
            count={post.reactions_count?.inspired || 0}
            isActive={post.user_reactions?.includes("inspired") || false}
            onToggle={() => handleReaction("inspired")}
          />

          {/* Reply toggle */}
          <button
            onClick={() => setShowReplies((v) => !v)}
            className="ml-auto flex items-center gap-1.5 text-[12px] text-muted-foreground/60 hover:text-muted-foreground font-mono px-2 py-1.5 rounded-lg transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {post.replies_count ?? 0}
            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* ── Replies section ── */}
        <AnimatePresence>
          {showReplies && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-border/40 space-y-3 pl-1">
                {repliesLoading ? (
                  <p className="text-xs text-muted-foreground font-mono">Loading replies…</p>
                ) : (replies ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground font-mono">No replies yet.</p>
                ) : (
                  (replies ?? []).map((reply) => {
                    const rDiscoverable = reply.profile?.community_profile_discoverable ?? true;
                    const rName = rDiscoverable ? reply.profile?.display_name || "Anonymous" : "Anonymous";
                    const rInitials = rName.slice(0, 2).toUpperCase();
                    const rAvatar = rDiscoverable ? reply.profile?.avatar_url || undefined : undefined;
                    const isOwnReply = user?.id === reply.user_id;

                    return (
                      <div key={reply.id} className="flex gap-2.5 group">
                        <Avatar className="w-7 h-7 shrink-0 ring-1 ring-primary/15">
                          <AvatarImage src={rAvatar} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold font-orbitron">
                            {rInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 bg-muted/30 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-foreground">{rName}</span>
                            <span className="font-mono text-[10px] text-muted-foreground/50">
                              {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                            </span>
                            {isOwnReply && (
                              <button
                                onClick={() => deleteReply.mutate({ replyId: reply.id, postId: post.id })}
                                className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground/50 hover:text-destructive transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-foreground/80 leading-relaxed">{reply.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Reply input */}
                {user && (
                  <div className="flex gap-2.5 pt-1">
                    <Avatar className="w-7 h-7 shrink-0 ring-1 ring-primary/15">
                      <AvatarFallback className="bg-gradient-to-br from-indigo-950 to-indigo-900 text-indigo-300 text-[10px] font-bold font-orbitron">
                        ME
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn("flex-1 transition-all", replyFocused ? "space-y-2" : "")}>
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onFocus={() => setReplyFocused(true)}
                        onBlur={() => !replyContent && setReplyFocused(false)}
                        placeholder="Write a reply…"
                        className="min-h-[36px] resize-none bg-muted/30 text-xs rounded-xl border-border/50 focus:border-primary/40 transition-all"
                        rows={replyFocused ? 3 : 1}
                        maxLength={300}
                      />
                      {replyFocused && (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={handleSubmitReply}
                            disabled={!replyContent.trim() || addReply.isPending}
                            className="text-xs h-7 px-3"
                          >
                            Reply
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} postId={post.id} />
    </motion.div>
  );
}
