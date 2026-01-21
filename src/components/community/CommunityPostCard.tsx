import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Target, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReactionButton } from "./ReactionButton";
import { PostTypeTag } from "./PostTypeTag";
import { 
  CommunityPost, 
  useAddReaction, 
  useRemoveReaction, 
  usePostReplies,
  useAddReply
} from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface CommunityPostCardProps {
  post: CommunityPost;
}

export function CommunityPostCard({ post }: CommunityPostCardProps) {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  
  const { data: replies, isLoading: repliesLoading } = usePostReplies(showReplies ? post.id : undefined);
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();
  const addReply = useAddReply();
  
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
      { onSuccess: () => setReplyContent("") }
    );
  };
  
  const displayName = post.profile?.display_name || "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarImage src={post.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{displayName}</span>
                <PostTypeTag type={post.post_type} />
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          
          {/* Goal link */}
          {post.goal && (
            <div className="mb-3 flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Linked to:</span>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {post.goal.name}
              </Badge>
              {post.goal.type && (
                <Badge variant="secondary" className="text-xs">
                  {post.goal.type}
                </Badge>
              )}
            </div>
          )}
          
          {/* Content */}
          <p className="text-foreground leading-relaxed mb-4 whitespace-pre-wrap">
            {post.content}
          </p>
          
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
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(!showReplies)}
              className="ml-auto gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="w-4 h-4" />
              {post.replies_count || 0}
              {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
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
                    replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={reply.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-muted">
                            {(reply.profile?.display_name || "A").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted/50 rounded-lg p-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{reply.profile?.display_name || "Anonymous"}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{reply.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-2">No replies yet. Be the first!</div>
                  )}
                  
                  {user && (
                    <div className="flex gap-2 mt-3">
                      <Textarea
                        placeholder="Write a supportive reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[60px] resize-none bg-muted/30"
                      />
                      <Button
                        onClick={handleSubmitReply}
                        disabled={!replyContent.trim() || addReply.isPending}
                        size="sm"
                        className="self-end"
                      >
                        Reply
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
