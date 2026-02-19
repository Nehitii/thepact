import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Target, Lightbulb, TrendingUp, AlertTriangle, Brain, HelpCircle, Heart, Send
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreatePost, CommunityPost, useUserGoals } from "@/hooks/useCommunity";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import { Badge } from "@/components/ui/badge";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const postTypes: { value: CommunityPost['post_type']; label: string; icon: typeof Lightbulb; description: string }[] = [
  { value: 'reflection', label: 'Reflection', icon: Lightbulb, description: 'Share a thought or insight' },
  { value: 'progress', label: 'Progress', icon: TrendingUp, description: 'Celebrate a milestone' },
  { value: 'obstacle', label: 'Obstacle', icon: AlertTriangle, description: 'Share a challenge you\'re facing' },
  { value: 'mindset', label: 'Mindset', icon: Brain, description: 'Share a mental shift or realization' },
  { value: 'help_request', label: 'Help Request', icon: HelpCircle, description: 'Ask for advice or support' },
  { value: 'encouragement', label: 'Encouragement', icon: Heart, description: 'Motivate the community' },
];

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<CommunityPost['post_type']>('reflection');
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");

  const createPost = useCreatePost();
  const { data: userGoals } = useUserGoals();
  const { profile } = useProfileSettings();

  const selectedGoal = userGoals?.find(g => g.id === selectedGoalId);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please write something to share");
      return;
    }

    try {
      if (selectedGoalId && (profile?.share_goals_progress ?? true) === false) {
        toast.error("Your privacy settings prevent sharing goal-linked posts.");
        return;
      }

      await createPost.mutateAsync({
        content: content.trim(),
        post_type: postType,
        goal_id: selectedGoalId || undefined,
        goal_name: selectedGoal?.name || undefined,
      });

      toast.success("Post shared with the community!");
      setContent("");
      setPostType('reflection');
      setSelectedGoalId("");
      onClose();
    } catch {
      toast.error("Failed to create post");
    }
  };

  const selectedType = postTypes.find(t => t.value === postType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-lg border-border/50">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl tracking-wide flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Share with Community
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Post type selector */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">What are you sharing?</Label>
            <div className="grid grid-cols-3 gap-2">
              {postTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = postType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setPostType(type.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
            {selectedType && (
              <p className="text-xs text-muted-foreground mt-1">{selectedType.description}</p>
            )}
          </div>

          {/* Goal link — shows ALL goals (active + completed) */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Link to a goal (optional)
            </Label>
            <Select
              value={selectedGoalId || "none"}
              onValueChange={(val) => {
                const next = val === "none" ? "" : val;
                if (next && (profile?.share_goals_progress ?? true) === false) {
                  toast.error("Enable 'Share Goals Progress' in Privacy to link goals.");
                  setSelectedGoalId("");
                  return;
                }
                setSelectedGoalId(next);
              }}
            >
              <SelectTrigger className="bg-muted/30">
                <SelectValue placeholder="Select a goal..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No goal linked</SelectItem>
                {userGoals?.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    <div className="flex items-center gap-2">
                      {goal.name}
                      <Badge variant={goal.status === 'fully_completed' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                        {goal.status === 'fully_completed' ? '✓ Done' : 'Active'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content textarea */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Your message</Label>
            <Textarea
              placeholder="Share your thoughts, progress, or ask for support..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none bg-muted/30 border-border/50 focus:border-primary/50"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {content.length}/500
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || createPost.isPending}
              className="gap-2"
            >
              {createPost.isPending ? "Posting..." : "Share"}
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
