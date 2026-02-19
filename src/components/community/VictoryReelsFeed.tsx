import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Trophy, Film, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VictoryReelCard } from "./VictoryReelCard";
import { CreateReelModal } from "./CreateReelModal";
import { useVictoryReels } from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export function VictoryReelsFeed() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: reels, isLoading } = useVictoryReels();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const goToNext = () => {
    if (reels && currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Handle wheel/touch swipe (mobile only)
  useEffect(() => {
    if (!isMobile) return;
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    let lastScrollTime = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastScrollTime < 500) return;
      lastScrollTime = now;
      if (e.deltaY > 0) goToNext();
      else goToPrev();
    };

    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goToNext();
        else goToPrev();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, reels, isMobile]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') goToNext();
      else if (e.key === 'ArrowUp' || e.key === 'k') goToPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, reels]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="w-16 h-16 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!reels || reels.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-[calc(100vh-200px)] flex items-center justify-center"
      >
        <div className="text-center py-16 px-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-3">No Victory Reels Yet</h3>
          <p className="text-muted-foreground mb-4">
            Complete a goal to share your victory with the community. Your achievements inspire others.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {user && (
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Reel
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/goals')}>
              View My Goals
            </Button>
          </div>
        </div>
        <CreateReelModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      </motion.div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-orbitron text-lg font-semibold">Victory Reels</h2>
            <p className="text-sm text-muted-foreground">Celebrate completed goals</p>
          </div>
        </div>

        {user && (
          <Button onClick={() => setShowCreateModal(true)} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Share Victory
          </Button>
        )}
      </div>

      {/* Desktop: card-based scrollable list */}
      {!isMobile ? (
        <div className="space-y-4">
          {reels.map((reel) => {
            const isDiscoverable = reel.profile?.community_profile_discoverable ?? true;
            const displayName = isDiscoverable ? (reel.profile?.display_name || "Anonymous") : "Anonymous";
            const avatarUrl = isDiscoverable ? reel.profile?.avatar_url || undefined : undefined;

            return (
              <Card key={reel.id} className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Video preview */}
                    <div className="sm:w-72 h-48 sm:h-auto bg-black flex-shrink-0">
                      <video
                        src={reel.video_url}
                        poster={reel.thumbnail_url || undefined}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      />
                    </div>
                    {/* Info */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-8 h-8 ring-1 ring-primary/20">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {displayName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-sm font-medium">{displayName}</span>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(reel.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {reel.goal?.name && (
                          <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/30">
                            <Trophy className="w-3 h-3 mr-1" />
                            {reel.goal.name}
                          </Badge>
                        )}
                        {reel.caption && (
                          <p className="text-sm text-foreground line-clamp-2">{reel.caption}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{reel.view_count} views</span>
                        <span>❤️ {reel.reactions_count?.support || 0}</span>
                        <span>🏆 {reel.reactions_count?.respect || 0}</span>
                        <span>✨ {reel.reactions_count?.inspired || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Mobile: vertical swipe container */
        <div
          ref={containerRef}
          className="relative h-[calc(100vh-280px)] min-h-[500px] rounded-2xl overflow-hidden bg-black"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <VictoryReelCard reel={reels[currentIndex]} isActive={true} />
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
            <Button size="icon" variant="ghost" onClick={goToPrev} disabled={currentIndex === 0}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 disabled:opacity-30">
              <ChevronUp className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={goToNext} disabled={currentIndex === reels.length - 1}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 disabled:opacity-30">
              <ChevronDown className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress indicators */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
            {reels.slice(0, 10).map((_, i) => (
              <button key={i} onClick={() => setCurrentIndex(i)}
                className={cn("w-1.5 h-4 rounded-full transition-all",
                  i === currentIndex ? "bg-white" : "bg-white/30 hover:bg-white/50")} />
            ))}
            {reels.length > 10 && <span className="text-white/50 text-xs">+{reels.length - 10}</span>}
          </div>

          {/* Swipe hint */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/50 text-xs">
            <ChevronUp className="w-3 h-3 animate-bounce" />
            <span>Swipe to explore</span>
          </div>
        </div>
      )}

      <CreateReelModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
