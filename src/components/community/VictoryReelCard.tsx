import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Eye, Calendar, Target } from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReactionButton } from "./ReactionButton";
import { 
  VictoryReel, 
  useAddReaction, 
  useRemoveReaction,
  useIncrementReelView
} from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface VictoryReelCardProps {
  reel: VictoryReel;
  isActive: boolean;
}

export function VictoryReelCard({ reel, isActive }: VictoryReelCardProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasViewed, setHasViewed] = useState(false);
  
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();
  const incrementView = useIncrementReelView();
  
  // Auto-play when active
  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      
      // Track view
      if (!hasViewed) {
        setHasViewed(true);
        incrementView.mutate(reel.id);
      }
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, reel.id, hasViewed]);
  
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const handleReaction = (type: 'support' | 'respect' | 'inspired') => {
    if (!user) return;
    
    const isActive = reel.user_reactions?.includes(type);
    if (isActive) {
      removeReaction.mutate({ reel_id: reel.id, reaction_type: type });
    } else {
      addReaction.mutate({ reel_id: reel.id, reaction_type: type });
    }
  };
  
  const isDiscoverable = reel.profile?.community_profile_discoverable ?? true;
  const canShowGoals = reel.profile?.share_goals_progress ?? true;
  const displayName = isDiscoverable ? (reel.profile?.display_name || "Anonymous") : "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = isDiscoverable ? reel.profile?.avatar_url || undefined : undefined;
  
  // Calculate pact duration
  const pactDuration = reel.goal?.start_date && reel.goal?.completion_date
    ? differenceInDays(new Date(reel.goal.completion_date), new Date(reel.goal.start_date))
    : null;
  
  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.thumbnail_url || undefined}
        loop
        muted={isMuted}
        playsInline
        className="w-full h-full object-cover"
        onClick={togglePlay}
      />
      
      {/* Play/Pause overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isPlaying ? 0 : 1 }}
        className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
      >
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-8 h-8 text-white fill-white ml-1" />
        </div>
      </motion.div>
      
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      
      {/* Bottom gradient and info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20 pb-6 px-4">
        {/* Goal info - minimal, human-focused */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-semibold text-white text-lg">
              {canShowGoals ? (reel.goal?.name || "Goal Achieved") : "Goal Achieved"}
            </span>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {canShowGoals && reel.goal?.type && (
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {reel.goal.type}
              </Badge>
            )}
            {pactDuration !== null && (
              <div className="flex items-center gap-1.5 text-white/80 text-sm">
                <Calendar className="w-3.5 h-3.5" />
                <span>{pactDuration} days journey</span>
              </div>
            )}
          </div>
          
          {reel.caption && (
            <p className="text-white/90 text-sm leading-relaxed">{reel.caption}</p>
          )}
        </div>
        
        {/* User info */}
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 ring-2 ring-white/30">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-primary/20 text-white text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="text-white font-medium text-sm">{displayName}</span>
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Eye className="w-3 h-3" />
              <span>{reel.view_count} views</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(reel.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side reactions */}
      <div className="absolute right-4 bottom-40 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => handleReaction('support')}
            className={cn(
              "w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all",
              reel.user_reactions?.includes('support') && "bg-rose-500/30"
            )}
          >
            <motion.div whileTap={{ scale: 1.3 }}>
              <span className="text-2xl">{reel.user_reactions?.includes('support') ? '❤️' : '🤍'}</span>
            </motion.div>
          </button>
          <span className="text-white text-xs font-medium">{reel.reactions_count?.support || 0}</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => handleReaction('respect')}
            className={cn(
              "w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all",
              reel.user_reactions?.includes('respect') && "bg-amber-500/30"
            )}
          >
            <motion.div whileTap={{ scale: 1.3 }}>
              <span className="text-2xl">🏆</span>
            </motion.div>
          </button>
          <span className="text-white text-xs font-medium">{reel.reactions_count?.respect || 0}</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => handleReaction('inspired')}
            className={cn(
              "w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all",
              reel.user_reactions?.includes('inspired') && "bg-primary/30"
            )}
          >
            <motion.div whileTap={{ scale: 1.3 }}>
              <span className="text-2xl">✨</span>
            </motion.div>
          </button>
          <span className="text-white text-xs font-medium">{reel.reactions_count?.inspired || 0}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
          onClick={toggleMute}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}
