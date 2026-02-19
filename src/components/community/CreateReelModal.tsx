import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Video, X, Trophy, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateVictoryReel, useCompletedGoals } from "@/hooks/useCommunity";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import { useNavigate } from "react-router-dom";

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateReelModal({ isOpen, onClose }: CreateReelModalProps) {
  const { user } = useAuth();
  const { profile } = useProfileSettings();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [caption, setCaption] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createReel = useCreateVictoryReel();
  const { data: completedGoals, isLoading: goalsLoading } = useCompletedGoals();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error("Please select a video file");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video must be under 100MB");
      return;
    }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
  };

  const clearVideo = () => {
    setVideoFile(null);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if ((profile?.share_goals_progress ?? true) === false) {
      toast.error("Your privacy settings prevent sharing victory reels.");
      return;
    }
    if (!user || !videoFile || !selectedGoalId) {
      toast.error("Please select a goal and upload a video");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('victory-reels')
        .upload(fileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      setUploadProgress(70);

      // Store just the path — signed URLs are generated on fetch
      let duration = 30;
      if (videoPreviewRef.current) {
        duration = Math.round(videoPreviewRef.current.duration);
      }

      setUploadProgress(90);

      await createReel.mutateAsync({
        goal_id: selectedGoalId,
        video_url: fileName, // Store path, not public URL
        caption: caption || undefined,
        duration_seconds: duration
      });

      setUploadProgress(100);
      toast.success("Victory Reel shared! 🎉");

      clearVideo();
      setSelectedGoalId("");
      setCaption("");
      onClose();
    } catch (error: any) {
      console.error("Failed to create reel:", error);
      toast.error(error.message || "Failed to upload video");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const hasCompletedGoals = completedGoals && completedGoals.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-lg border-border/50">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl tracking-wide flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Share Your Victory
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {!goalsLoading && !hasCompletedGoals ? (
            /* Empty state: no completed goals */
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8 text-primary/50" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">No completed goals yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Complete your first goal to unlock Victory Reels and share your achievement with the community.
                </p>
              </div>
              <Button variant="outline" onClick={() => { onClose(); navigate('/goals'); }}>
                View My Goals
              </Button>
            </div>
          ) : (
            <>
              {/* Goal selector */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Which goal did you complete?</Label>
                <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder={goalsLoading ? "Loading goals..." : "Select a completed goal"} />
                  </SelectTrigger>
                  <SelectContent>
                    {completedGoals?.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          {goal.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Video upload */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Upload your victory video (15-60 seconds)</Label>
                {!videoPreviewUrl ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-full h-48 rounded-xl border-2 border-dashed border-border/50",
                      "flex flex-col items-center justify-center gap-3",
                      "bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
                    )}
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Click to upload video</p>
                      <p className="text-xs text-muted-foreground">MP4, WebM, MOV (max 100MB)</p>
                    </div>
                  </button>
                ) : (
                  <div className="relative rounded-xl overflow-hidden bg-black">
                    <video
                      ref={videoPreviewRef}
                      src={videoPreviewUrl}
                      className="w-full h-48 object-cover"
                      controls
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 w-8 h-8"
                      onClick={clearVideo}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Caption (optional)</Label>
                <Textarea
                  placeholder="Share what this achievement means to you..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="min-h-[80px] resize-none bg-muted/30 border-border/50"
                  maxLength={200}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {caption.length}/200
                </div>
              </div>

              {/* Upload progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={onClose} disabled={isUploading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedGoalId || !videoFile || isUploading}
                  className="gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      Share Reel
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
