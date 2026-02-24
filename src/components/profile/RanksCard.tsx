import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DataPanel } from "./settings-ui";
import { RankCard } from "@/components/ranks/RankCard";
import { RankEditor } from "@/components/ranks/RankEditor";
import type { Rank } from "@/types/ranks";
import { useRankXP } from "@/hooks/useRankXP";
import { usePact } from "@/hooks/usePact";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Trophy, Plus, Trash2, Edit2, Sparkles, Target, MoreVertical, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface RanksCardProps {
  userId: string;
}

// --- XP Timeline Bar ---
function XPTimeline({ ranks, currentXP, totalMaxXP }: { ranks: Rank[]; currentXP: number; totalMaxXP: number }) {
  if (ranks.length < 2 || totalMaxXP <= 0) return null;

  const maxVal = totalMaxXP;
  const markerPos = Math.min(100, (currentXP / maxVal) * 100);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="mb-4">
        <div className="text-[9px] font-mono text-primary/40 tracking-[0.15em] mb-1.5">XP_TIMELINE</div>
        <div className="relative h-3 w-full rounded-full overflow-hidden bg-primary/10 flex">
          {ranks.map((rank, i) => {
            const nextMin = ranks[i + 1]?.min_points ?? maxVal;
            const segmentWidth = ((nextMin - rank.min_points) / maxVal) * 100;
            return (
              <Tooltip key={rank.id}>
                <TooltipTrigger asChild>
                  <div
                    className="h-full transition-all cursor-pointer hover:brightness-125"
                    style={{
                      width: `${segmentWidth}%`,
                      backgroundColor: `${rank.frame_color || '#5bb4ff'}60`,
                      borderRight: i < ranks.length - 1 ? '1px solid rgba(255,255,255,0.1)' : undefined,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-card border-primary/30 text-xs font-mono">
                  <span style={{ color: rank.frame_color || '#5bb4ff' }}>{rank.name}</span>
                  <span className="text-muted-foreground ml-1.5">{rank.min_points.toLocaleString()} – {nextMin.toLocaleString()} XP</span>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        {/* Current XP marker */}
        <div className="relative h-0">
          <div
            className="absolute -top-[14px] w-0 h-0"
            style={{
              left: `${markerPos}%`,
              transform: 'translateX(-50%)',
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderBottom: '5px solid hsl(var(--primary))',
            }}
          />
        </div>
      </div>
    </TooltipProvider>
  );
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
  const [rankToDelete, setRankToDelete] = useState<Rank | null>(null);

  useEffect(() => {
    if (rankData?.ranks) setRanks(rankData.ranks);
  }, [rankData?.ranks]);

  const handleAddRank = () => {
    const newRank: Rank = { id: "new", min_points: ranks.length > 0 ? (ranks[ranks.length - 1].min_points + 500) : 0, name: "", frame_color: "#5bb4ff", glow_color: "rgba(91,180,255,0.5)" };
    setSelectedRank(newRank);
    setIsNewRank(true);
    setShowEditor(true);
  };

  const handleEditRank = (rank: Rank) => { setSelectedRank(rank); setIsNewRank(false); setShowEditor(true); };

  const handleSaveRank = async (rank: Rank) => {
    if (!rank.name.trim()) { toast({ title: "Validation Error", description: "Please enter a rank name", variant: "destructive" }); throw new Error("Validation failed"); }
    
    // Overlap validation: check for duplicate min_points
    const conflicting = ranks.find(r => r.min_points === rank.min_points && r.id !== rank.id);
    if (conflicting) {
      toast({ title: "Conflict", description: `Another rank ("${conflicting.name}") already uses ${rank.min_points.toLocaleString()} XP as threshold.`, variant: "destructive" });
      throw new Error("Conflict");
    }

    if (isNewRank) {
      const { error } = await supabase.from("ranks").insert({ user_id: userId, min_points: rank.min_points, max_points: rank.max_points || null, name: rank.name.trim(), logo_url: rank.logo_url, background_url: rank.background_url, background_opacity: rank.background_opacity, frame_color: rank.frame_color, glow_color: rank.glow_color, quote: rank.quote });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); throw error; }
      toast({ title: "Rank Created", description: `${rank.name} has been added to your progression` });
    } else {
      const { error } = await supabase.from("ranks").update({ min_points: rank.min_points, max_points: rank.max_points || null, name: rank.name.trim(), logo_url: rank.logo_url, background_url: rank.background_url, background_opacity: rank.background_opacity, frame_color: rank.frame_color, glow_color: rank.glow_color, quote: rank.quote }).eq("id", rank.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); throw error; }
      toast({ title: "Rank Updated", description: `${rank.name} has been updated` });
    }
    queryClient.invalidateQueries({ queryKey: ["rank-xp"] });
  };

  const handleDeleteRank = async (rank: Rank) => {
    setRankToDelete(rank);
  };

  const confirmDeleteRank = async () => {
    if (!rankToDelete) return;
    const { error } = await supabase.from("ranks").delete().eq("id", rankToDelete.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Rank Deleted", description: `${rankToDelete.name} has been removed` }); queryClient.invalidateQueries({ queryKey: ["rank-xp"] }); }
    setRankToDelete(null);
  };

  return (
    <DataPanel
      code="MODULE_05"
      title="RANKS"
      statusText={<span className="text-muted-foreground">{ranks.length} DEFINED</span>}
      footerLeft={<span>CURRENT: <b className="text-primary">{rankData?.currentRank?.name || "—"}</b></span>}
      footerRight={<span>XP: <b className="text-primary">{rankData?.currentXP?.toLocaleString() || "0"}</b></span>}
    >
      <div className="py-4">
        {/* Current Rank Card — only if a real rank exists */}
        {rankData?.currentRank && (
          <div className="mb-4 border border-primary/25 bg-primary/[0.04] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-[9px] font-mono text-primary/40 tracking-[0.15em]">CURRENT_RANK</span>
            </div>
            <div className="flex justify-center">
              <RankCard rank={rankData.currentRank} currentXP={rankData.currentXP} nextRankMinXP={rankData.nextRank?.min_points} totalMaxXP={rankData.totalMaxXP} isActive={true} size="sm" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[9px] font-mono text-primary/40">
                <span className="flex items-center gap-1"><Target className="h-3 w-3" />GLOBAL_PROGRESS</span>
                <span>{Math.round(rankData.globalProgress)}%</span>
              </div>
              <div className="h-1.5 bg-primary/10 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${rankData.globalProgress}%` }} className="h-full bg-gradient-to-r from-primary/50 to-primary" />
              </div>
              <div className="text-[9px] text-primary/25 font-mono text-center">{rankData.currentXP.toLocaleString()} / {rankData.totalMaxXP.toLocaleString()} XP</div>
            </div>
          </div>
        )}

        {/* Max XP info banner */}
        {rankData && rankData.totalMaxXP > 0 && (
          <div className="mb-3 border border-primary/15 bg-primary/[0.02] p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Info className="h-3 w-3 text-[hsl(40,100%,50%)]" />
              <span className="text-[9px] font-mono text-primary/40 tracking-[0.15em]">MAX_XP_FROM_GOALS</span>
            </div>
            <span className="text-xs font-mono text-[hsl(40,100%,50%)] font-bold">{rankData.totalMaxXP.toLocaleString()} XP</span>
          </div>
        )}

        {/* XP Timeline */}
        <XPTimeline ranks={ranks} currentXP={rankData?.currentXP || 0} totalMaxXP={rankData?.totalMaxXP || 0} />

        <div className="relative">
          {ranks.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-primary/20 bg-primary/[0.02]">
              <Trophy className="h-10 w-10 mx-auto mb-3 text-primary/30" />
              <p className="font-orbitron text-sm text-primary/70 uppercase tracking-wider">No ranks defined</p>
              <p className="text-xs text-muted-foreground font-rajdhani mt-1 max-w-[260px] mx-auto">
                Define XP thresholds to build your progression system. Your goals give you up to{" "}
                <strong className="text-primary">{(rankData?.totalMaxXP || 0).toLocaleString()} XP</strong> total.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[240px] pr-2">
              <div className="space-y-2">
                <AnimatePresence>
                  {ranks.map((rank) => {
                    const isCurrentRank = rankData?.currentRank?.id === rank.id;
                    const frameColor = rank.frame_color || '#5bb4ff';
                    return (
                      <motion.div key={rank.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className={cn(
                          "relative flex items-center gap-3 p-3 transition-all border",
                          isCurrentRank ? "border-primary/40" : "border-primary/15 bg-primary/[0.02] hover:border-primary/30",
                        )}
                        style={{
                          borderLeftWidth: isCurrentRank ? '3px' : undefined,
                          borderLeftColor: isCurrentRank ? frameColor : undefined,
                          backgroundColor: isCurrentRank ? `${frameColor}10` : undefined,
                          boxShadow: isCurrentRank ? `0 0 15px ${rank.glow_color || 'rgba(91,180,255,0.3)'}` : undefined,
                        }}>
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 border"
                          style={{ borderColor: `${frameColor}50`, background: `linear-gradient(135deg, ${frameColor}10, transparent)` }}>
                          {rank.logo_url ? <img src={rank.logo_url} alt="" className="w-6 h-6 object-contain" /> : <Trophy className="h-5 w-5" style={{ color: frameColor }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-orbitron font-semibold text-sm uppercase tracking-wide truncate" style={{ color: frameColor, textShadow: `0 0 8px ${rank.glow_color || 'rgba(91,180,255,0.3)'}` }}>{rank.name}</span>
                            {isCurrentRank && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider rounded-sm" style={{ backgroundColor: `${frameColor}20`, color: frameColor, border: `1px solid ${frameColor}40` }}>
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-muted-foreground font-mono tracking-wider">
                            {rank.min_points.toLocaleString()}+ XP
                          </div>
                        </div>

                        {/* Three-dot dropdown menu — works on mobile */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-primary/30 z-50">
                            <DropdownMenuItem onClick={() => handleEditRank(rank)} className="gap-2 cursor-pointer">
                              <Edit2 className="h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteRank(rank)} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
          {ranks.length > 3 && <div className="absolute bottom-0 left-0 right-2 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />}
        </div>

        <button onClick={handleAddRank}
          className={cn(
            "w-full h-10 mt-4 font-mono text-[10px] tracking-[0.22em] uppercase",
            "border border-dashed border-primary/30 bg-transparent",
            "text-primary/50 hover:text-primary hover:border-primary/60 hover:bg-primary/[0.05]",
            "transition-all duration-200 flex items-center justify-center gap-2",
          )}>
          <Plus className="h-4 w-4" />ADD NEW RANK
        </button>

        {selectedRank && (
          <RankEditor rank={selectedRank} open={showEditor} onClose={() => { setShowEditor(false); setSelectedRank(null); }} onSave={handleSaveRank} isNew={isNewRank} globalMaxXP={rankData?.totalMaxXP || 0} />
        )}

        <AlertDialog open={!!rankToDelete} onOpenChange={(open) => !open && setRankToDelete(null)}>
          <AlertDialogContent className="bg-card border-primary/30">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Delete Rank</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{rankToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-primary/30">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteRank} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DataPanel>
  );
}
