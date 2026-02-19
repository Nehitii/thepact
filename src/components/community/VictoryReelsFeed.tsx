import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Trophy, Film, Plus, Play, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VictoryReelCard } from "./VictoryReelCard";
import { CreateReelModal } from "./CreateReelModal";
import { useVictoryReels } from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const thumbGradients = [
  "from-indigo-950 via-indigo-900 to-blue-800",
  "from-emerald-950 via-emerald-900 to-teal-800",
  "from-red-950 via-red-900 to-rose-800",
  "from-purple-950 via-purple-900 to-violet-800",
];

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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-base shadow-md shadow-primary/25">
            🏆
          </div>
          <span className="font-orbitron text-base font-bold tracking-wide">Victory Reels</span>
        </div>

        {user && (
          <Button onClick={() => setShowCreateModal(true)} variant="outline" className="gap-2 font-mono text-xs border-border/50">
            🎬 Share Victory
          </Button>
        )}
      </div>

      {/* Desktop: 2-column grid */}
      {!isMobile ? (
        <div className="grid grid-cols-2 gap-4">
          {reels.map((reel, index) => {
            const isDiscoverable = reel.profile?.community_profile_discoverable ?? true;
            const displayName = isDiscoverable ? (reel.profile?.display_name || "Anonymous") : "Anonymous";
            const avatarUrl = isDiscoverable ? reel.profile?.avatar_url || undefined : undefined;
            const initials = displayName.slice(0, 2).toUpperCase();
            const gradientClass = thumbGradients[index % thumbGradients.length];

            return (
              <motion.div
                key={reel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-border/50 overflow-hidden bg-card group cursor-pointer hover:border-primary/30 hover:-translate-y-1 transition-all hover:shadow-xl hover:shadow-primary/10"
              >
                {/* Thumbnail */}
                <div className={cn(
                  "relative h-44 bg-gradient-to-br flex items-center justify-center overflow-hidden",
                  gradientClass
                )}>
                  {/* Grid pattern overlay */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                    }}
                  />

                  {/* Trophy badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-semibold z-10">
                    🏆 COMPLETED
                  </div>

                  {/* Play button */}
                  <div className="w-13 h-13 rounded-full bg-white/15 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center z-10 group-hover:bg-primary group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/30 group-hover:scale-110 transition-all">
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </div>

                  {/* Duration */}
                  {reel.duration_seconds > 0 && (
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-mono text-muted-foreground z-10">
                      {Math.floor(reel.duration_seconds / 60)}:{(reel.duration_seconds % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-4">
                  {/* User row */}
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-orbitron font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold text-foreground">{displayName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                      {formatDistanceToNow(new Date(reel.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Goal title */}
                  {reel.goal?.name && (
                    <div className="text-sm font-semibold text-foreground mb-1 line-clamp-1">{reel.goal.name}</div>
                  )}

                  {/* Caption */}
                  {reel.caption && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{reel.caption}</p>
                  )}

                  {/* Stats row */}
                  <div className="flex gap-3 text-[11px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> <span className="text-foreground/70">{reel.view_count}</span>
                    </span>
                    <span>💪 <span className="text-foreground/70">{reel.reactions_count?.support || 0}</span></span>
                    <span>⚡ <span className="text-foreground/70">{reel.reactions_count?.inspired || 0}</span></span>
                  </div>
                </div>
              </motion.div>
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
