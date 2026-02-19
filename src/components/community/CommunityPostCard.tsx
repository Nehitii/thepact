import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Target, ChevronDown, ChevronUp, Flag, Pencil, Trash2, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const postTypeGradients: Record<CommunityPost['post_type'], { top: string; bottom: string; glowRgba: string }> = {
  reflection:    { top: '#3b82f6', bottom: '#1d4ed8', glowRgba: '59,130,246' },
  progress:      { top: '#f59e0b', bottom: '#d97706', glowRgba: '245,158,11' },
  obstacle:      { top: '#f43f5e', bottom: '#be123c', glowRgba: '244,63,94' },
  mindset:       { top: '#a855f7', bottom: '#7c3aed', glowRgba: '168,85,247' },
  help_request:  { top: '#fb923c', bottom: '#ea580c', glowRgba: '251,146,60' },
  encouragement: { top: '#10b981', bottom: '#059669', glowRgba: '16,185,129' },
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
  const isEdited = post.updated_at !== post.created_at;

  const gradient = postTypeGradients[post.post_type];

  const cardStyle = useMemo(() => ({
    borderLeft: `3px solid transparent`,
    borderImage: `linear-gradient(to bottom, ${gradient.top}, ${gradient.bottom}) 1`,
    boxShadow: isHovered ? `0 8px 40px rgba(0,0,0,0.4), -4px 0 20px rgba(${gradient.glowRgba}, 0.12)` : undefined,
  }), [gradient, isHovered]);

  const handleReaction = (type: 'support' | 'respect' | 'inspired') => {
    if (!user) return;
    const isActive = post.user_reactions?.includes(type);
    if (isActive) {
      removeReaction.mutate({ post_id: post.id, reaction_type: type });
    } else {
      addReaction.mutate({ post_id: post.id, reaction_type: type });
    }
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim() || !user) return;
    addReply.mutate(
      { post_id: post.id, content: replyContent },
      { onSuccess: () => { setReplyContent(""); setReplyFocused(false); } }
    );
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    updatePost.mutate(
      { id: post.id, content: editContent.trim() },
      {
        onSuccess: () => { setIsEditing(false); toast.success("Post updated"); },
        onError: () => toast.error("Failed to update post"),
      }
    );
  };

  const handleDelete = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => toast.success("Post deleted"),
      onError: () => toast.error("Failed to delete post"),
    });
  };

  const isDiscoverable = post.profile?.community_profile_discoverable ?? true;
  const canShowGoals = post.profile?.share_goals_progress ?? true;
  const displayName = isDiscoverable ? (post.profile?.display_name || "Anonymous") : "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = isDiscoverable ? post.profile?.avatar_url || undefined : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/20 transition-all rounded-2xl overflow-hidden"
        style={cardStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium font-orbitron">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{displayName}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className="mt-1">
                <PostTypeTag type={post.post_type} />
              </div>
              {isEdited && (
                <span className="text-[10px] text-muted-foreground/60 italic font-mono">edited</span>
              )}
            </div>

            {/* Actions menu */}
            <div className="flex items-center gap-1">
              {isOwner && (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => { setIsEditing(true); setEditContent(post.content); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              {user && !isOwner && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setShowReportModal(true)}>
                  <Flag className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Content (editable) */}
          {isEditing ? (
            <div className="space-y-2 mb-4">
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
            <p className="text-foreground/90 leading-relaxed mb-4 whitespace-pre-wrap text-sm">
              {post.content}
            </p>
          )}

          {/* Goal link (denormalized) */}
          {post.goal_name && canShowGoals && (
            <div className="mb-4 flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
              <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground/80">{post.goal_name}</span>
            </div>
          )}

          {/* Reactions and replies */}
          <div className="flex items-center gap-2 flex-wrap">
            <ReactionButton
              type="support"
              count={post.reactions_count?.support || 0}
              isActive={post.user_reactions?.includes('support') || false}
              onToggle={() => handleReaction('support')}
            />
            <ReactionButton
              type="respect"
              count={post.reactions_count?.respect || 0}
              isActive={post.user_reactions?.includes('respect') || false}
              onToggle={() => handleReaction('respect')}
            />
            <ReactionButton
              type="inspired"
              count={post.reactions_count?.inspired || 0}
              isActive={post.user_reactions?.includes('inspired') || false}
              onToggle={() => handleReaction('inspired')}
            />

            <button
              onClick={() => setShowReplies(!showReplies)}
              className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono px-2 py-1.5 rounded-lg transition-colors"
            >
              💬 {post.replies_count || 0}
            </button>
          </div>

          {/* Replies section */}
          <AnimatePresence>
            {showReplies && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                  {repliesLoading ? (
                    <div className="text-sm text-muted-foreground text-center py-2">Loading replies...</div>
                  ) : replies && replies.length > 0 ? (
                    replies.map((reply) => {
                      const replyDiscoverable = reply.profile?.community_profile_discoverable ?? true;
                      const replyName = replyDiscoverable ? (reply.profile?.display_name || "Anonymous") : "Anonymous";
                      const replyAvatar = replyDiscoverable ? reply.profile?.avatar_url || undefined : undefined;
                      const isReplyOwner = user?.id === reply.user_id;

                      return (
                        <div key={reply.id} className="flex gap-2 group">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={replyAvatar} />
                            <AvatarFallback className="text-xs bg-muted">
                              {replyName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-muted/50 rounded-lg p-2.5">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{replyName}</span>
                              <span className="text-xs text-muted-foreground font-mono">
                                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                              </span>
                              {isReplyOwner && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteReply.mutate({ replyId: reply.id, postId: post.id })}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-foreground">{reply.content}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-2">No replies yet. Be the first!</div>
                  )}

                  {/* Compact reply input */}
                  {user && (
                    <div className="flex gap-2 mt-3">
                      {replyFocused ? (
                        <>
                          <Textarea
                            placeholder="Write a supportive reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="min-h-[60px] resize-none bg-muted/30"
                            autoFocus
                            onBlur={() => {
                              if (!replyContent.trim()) setReplyFocused(false);
                            }}
                          />
                          <Button
                            onClick={handleSubmitReply}
                            disabled={!replyContent.trim() || addReply.isPending}
                            size="sm"
                            className="self-end"
                          >
                            Reply
                          </Button>
                        </>
                      ) : (
                        <button
                          onClick={() => setReplyFocused(true)}
                          className="w-full text-left px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm text-muted-foreground hover:border-primary/30 transition-colors"
                        >
                          Reply...
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        postId={post.id}
      />
    </motion.div>
  );
}
