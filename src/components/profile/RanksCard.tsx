import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PactSettingsCard } from "./PactSettingsCard";
import { RankCard, type Rank } from "@/components/ranks/RankCard";
import { RankEditor } from "@/components/ranks/RankEditor";
import { useRankXP } from "@/hooks/useRankXP";
import { usePact } from "@/hooks/usePact";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronRight,
  Sparkles,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface RanksCardProps {
  userId: string;
}

export function RanksCard({ userId }: RanksCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: pact } = usePact(userId);
  const { data: rankData, isLoading } = useRankXP(userId, pact?.id);
  
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isNewRank, setIsNewRank] = useState(false);

  useEffect(() => {
    if (rankData?.ranks) {
      setRanks(rankData.ranks);
    }
  }, [rankData?.ranks]);

  const handleAddRank = () => {
    const newRank: Rank = {
      id: "new",
      min_points: ranks.length > 0 
        ? (ranks[ranks.length - 1].min_points + 500) 
        : 0,
      name: "",
      frame_color: "#5bb4ff",
      glow_color: "rgba(91,180,255,0.5)",
    };
    setSelectedRank(newRank);
    setIsNewRank(true);
    setShowEditor(true);
  };

  const handleEditRank = (rank: Rank) => {
    setSelectedRank(rank);
    setIsNewRank(false);
    setShowEditor(true);
  };

  const handleSaveRank = async (rank: Rank) => {
    if (!rank.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a rank name",
        variant: "destructive",
      });
      return;
    }

    if (isNewRank) {
      const { error } = await supabase.from("ranks").insert({
        user_id: userId,
        min_points: rank.min_points,
        max_points: rank.max_points || null,
        name: rank.name.trim(),
        logo_url: rank.logo_url,
        background_url: rank.background_url,
        background_opacity: rank.background_opacity,
        frame_color: rank.frame_color,
        glow_color: rank.glow_color,
        quote: rank.quote,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Rank Created",
        description: `${rank.name} has been added to your progression`,
      });
    } else {
      const { error } = await supabase
        .from("ranks")
        .update({
          min_points: rank.min_points,
          max_points: rank.max_points || null,
          name: rank.name.trim(),
          logo_url: rank.logo_url,
          background_url: rank.background_url,
          background_opacity: rank.background_opacity,
          frame_color: rank.frame_color,
          glow_color: rank.glow_color,
          quote: rank.quote,
        })
        .eq("id", rank.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Rank Updated",
        description: `${rank.name} has been updated`,
      });
    }

    // Refresh data
    queryClient.invalidateQueries({ queryKey: ["rank-xp"] });
  };

  const handleDeleteRank = async (rank: Rank) => {
    if (!confirm(`Are you sure you want to delete "${rank.name}"?`)) return;

    const { error } = await supabase.from("ranks").delete().eq("id", rank.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Rank Deleted",
        description: `${rank.name} has been removed`,
      });
      queryClient.invalidateQueries({ queryKey: ["rank-xp"] });
    }
  };

  return (
    <PactSettingsCard
      icon={<Trophy className="h-5 w-5 text-primary" />}
      title="Ranks"
      description="Configure your progression ranks with custom visuals"
    >
      {/* Current Rank Display */}
      {rankData?.currentRank && (
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-orbitron text-primary/70 uppercase tracking-wider">
              Current Rank
            </span>
          </div>
          <div className="flex justify-center">
            <RankCard
              rank={rankData.currentRank}
              currentXP={rankData.currentXP}
              nextRankMinXP={rankData.nextRank?.min_points}
              totalMaxXP={rankData.totalMaxXP}
              isActive={true}
              size="sm"
            />
          </div>
          
          {/* Global progress */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-[10px] font-rajdhani text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Global Progress
              </span>
              <span>{Math.round(rankData.globalProgress)}%</span>
            </div>
            <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rankData.globalProgress}%` }}
                className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full"
              />
            </div>
            <div className="text-[9px] text-muted-foreground/60 text-center">
              {rankData.currentXP.toLocaleString()} / {rankData.totalMaxXP.toLocaleString()} XP
            </div>
          </div>
          
          {/* Global Max XP Display */}
          <div className="mt-3 p-2.5 rounded-lg bg-background/50 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-wider">
                  Maximum XP from Goals
                </span>
              </div>
              <span className="text-xs font-orbitron text-amber-400 font-bold">
                {rankData.totalMaxXP.toLocaleString()} XP
              </span>
            </div>
            <p className="text-[9px] text-muted-foreground/60 mt-1">
              Sum of all goal XP values. Use this to define your rank thresholds.
            </p>
          </div>
        </div>
      )}

      {/* Ranks List */}
      <div className="relative">
        {ranks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground font-rajdhani border border-dashed border-primary/20 rounded-lg bg-primary/5">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-primary/60" />
            <p>No ranks defined yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Create your first rank below.</p>
          </div>
        ) : (
          <ScrollArea className="h-[240px] pr-2">
            <div className="space-y-2">
              <AnimatePresence>
                {ranks.map((rank, index) => {
                  const isCurrentRank = rankData?.currentRank?.id === rank.id;
                  
                  return (
                    <motion.div
                      key={rank.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "group relative flex items-center gap-3 p-3 rounded-lg transition-all",
                        "bg-gradient-to-r from-card/80 to-card/60",
                        "border hover:border-primary/40",
                        isCurrentRank 
                          ? "border-primary/50" 
                          : "border-primary/20"
                      )}
                      style={isCurrentRank ? {
                        boxShadow: `0 0 15px ${rank.glow_color || 'rgba(91,180,255,0.3)'}`,
                      } : undefined}
                    >
                      {/* Rank preview mini */}
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border"
                        style={{
                          borderColor: `${rank.frame_color || '#5bb4ff'}50`,
                          background: `linear-gradient(135deg, ${rank.frame_color || '#5bb4ff'}10, transparent)`,
                        }}
                      >
                        {rank.logo_url ? (
                          <img src={rank.logo_url} alt="" className="w-6 h-6 object-contain" />
                        ) : (
                          <Trophy className="h-5 w-5" style={{ color: rank.frame_color || '#5bb4ff' }} />
                        )}
                      </div>

                      {/* Rank info */}
                      <div className="flex-1 min-w-0">
                        <div 
                          className="font-orbitron font-semibold text-sm uppercase tracking-wide truncate"
                          style={{ 
                            color: rank.frame_color || '#5bb4ff',
                            textShadow: `0 0 8px ${rank.glow_color || 'rgba(91,180,255,0.3)'}`,
                          }}
                        >
                          {rank.name}
                        </div>
                        <div className="text-xs text-muted-foreground font-rajdhani">
                          {rank.min_points.toLocaleString()}+ XP
                          {isCurrentRank && (
                            <span className="ml-2 text-primary/70">(Current)</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditRank(rank)}
                          className="h-8 w-8 text-primary/70 hover:text-primary hover:bg-primary/20"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteRank(rank)}
                          className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Current indicator */}
                      {isCurrentRank && (
                        <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
        
        {/* Fade indicator */}
        {ranks.length > 3 && (
          <div className="absolute bottom-0 left-0 right-2 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none rounded-b-lg" />
        )}
      </div>

      {/* Add Rank Button */}
      <Button
        onClick={handleAddRank}
        variant="outline"
        className={cn(
          "w-full h-10 font-orbitron uppercase tracking-wider text-xs mt-4",
          "border border-dashed border-primary/40 rounded-lg",
          "text-primary/70 hover:text-primary hover:border-primary/60 hover:bg-primary/10"
        )}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Rank
      </Button>

      {/* Editor Dialog */}
      {selectedRank && (
        <RankEditor
          rank={selectedRank}
          open={showEditor}
          onClose={() => {
            setShowEditor(false);
            setSelectedRank(null);
          }}
          onSave={handleSaveRank}
          isNew={isNewRank}
          globalMaxXP={rankData?.totalMaxXP || 0}
        />
      )}
    </PactSettingsCard>
  );
}